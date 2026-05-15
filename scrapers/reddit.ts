// scrapers/reddit.ts
// ══════════════════════════════════════════════════════════════════════════════
// TrendAI — Reddit Scraper
//
// Uses Reddit's official OAuth API via snoowrap.
// Two clients run concurrently, each handling half the subreddit list.
// Paced at 1 req / 1.2s per client = ~50 QPM each, well under Reddit's 100 QPM limit.
// Circuit breaker aborts a client after 5 consecutive failures.
// All errors are caught and logged — never throws to caller.
// ══════════════════════════════════════════════════════════════════════════════

import Snoowrap from "snoowrap";
import chalk from "chalk";
import { SCRAPE_CONFIG } from "../config/index";
import type { RedditPost, SubredditEntry } from "../types/index";

// ── Constants ─────────────────────────────────────────────────────────────────

const CFG                 = SCRAPE_CONFIG.reddit;
const POSTS_PER_SUB       = CFG.maxPostsPerSub;       // 25
const REQUEST_DELAY_MS    = CFG.delayBetweenSubs;     // 1200
const MAX_RETRIES         = CFG.maxRetries;           // 3
const RETRY_BASE_MS       = CFG.retryDelay;           // 4000
const CIRCUIT_BREAKER_MAX = 5;
const POST_MAX_AGE_HOURS  = 48;

// ── Velocity formula (mirrors discovery.worker.ts exactly) ───────────────────

function calcVelocity(
  score:    number,
  comments: number,
  ratio:    number,
  ageHours: number,
): number {
  if (ageHours <= 0) return 0;
  const engagement  = score + comments * 2;
  const decay       = Math.max(0.1, 1 - ageHours / 48);
  const ratioBoost  = ratio > 0.8 ? 1.2 : ratio > 0.6 ? 1.0 : 0.8;
  const raw         = (engagement / ageHours) * decay * ratioBoost;
  return Math.min(100, Math.round(raw / 10));
}

// ── Client builder ────────────────────────────────────────────────────────────

function buildClient(label: string): Snoowrap | null {
  const idx           = label === "CLIENT_1" ? "1" : "2";
  const clientId      = process.env[`REDDIT_CLIENT_ID_${idx}`]     || "";
  const clientSecret  = process.env[`REDDIT_CLIENT_SECRET_${idx}`] || "";
  const username      = process.env.REDDIT_USERNAME                 || "";
  const password      = process.env.REDDIT_PASSWORD                 || "";
  const userAgent     = process.env.REDDIT_USER_AGENT               || "TrendAI/2.0";

  if (!clientId || !clientSecret || !username || !password) {
    console.log(chalk.yellow(`  ⚠ ${label}: credentials missing — skipping`));
    return null;
  }

  try {
    const client = new Snoowrap({ userAgent, clientId, clientSecret, username, password });
    // snoowrap default config — queue requests rather than drop them on rate limit
    client.config({ requestDelay: REQUEST_DELAY_MS, continueAfterRatelimitError: true });
    return client;
  } catch (err) {
    console.log(chalk.red(`  ✗ ${label}: failed to initialise — ${(err as Error).message}`));
    return null;
  }
}

// ── Single subreddit fetch with retry ─────────────────────────────────────────

async function fetchSubreddit(
  client:  Snoowrap,
  entry:   SubredditEntry,
  attempt: number = 1,
): Promise<RedditPost[]> {
  const nowSec    = Date.now() / 1000;
  const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  try {
    const listing = await (client as any)
      .getSubreddit(entry.name)
      .getHot({ limit: POSTS_PER_SUB });

    const posts: RedditPost[] = [];

    for (const item of listing) {
      try {
        const title = (item.title || "").trim();
        if (!title || title.length < 10) continue;

        const score    = Number(item.score          || 0);
        const comments = Number(item.num_comments   || 0);
        const ratio    = Number(item.upvote_ratio   || 0.5);
        const created  = Number(item.created_utc    || 0);
        const ageHours = created > 0 ? (nowSec - created) / 3600 : 12;

        if (ageHours > POST_MAX_AGE_HOURS) continue;

        const velocity   = calcVelocity(score, comments, ratio, ageHours);
        const isBreakout = score > 500 && ageHours < 6;
        const postId     = String(item.id || `${entry.name}_${Date.now()}_${Math.random()}`);

        posts.push({
          post_id:      postId,
          subreddit:    entry.name,
          niche:        entry.niche,
          tier:         entry.tier,
          title:        title.substring(0, 300),
          score,
          upvote_ratio: ratio,
          num_comments: comments,
          url:          item.url        || item.permalink || "",
          author:       item.author?.name || "",
          flair:        item.link_flair_text || "",
          age_hours:    Math.round(ageHours * 10) / 10,
          velocity,
          is_breakout:  isBreakout,
          feed:         "hot",
          expires_at:   expiresAt,
          raw_data:     {
            score, comments, ageHours,
            niche: entry.niche,
            tier:  entry.tier,
            source: "reddit_api",
          },
        });
      } catch {
        // skip malformed individual item silently
      }
    }

    return posts;

  } catch (err: any) {
    const status = err?.statusCode || err?.status || 0;

    // Non-retryable: private, banned, or nonexistent subreddit
    if (status === 403 || status === 404 || status === 451) {
      console.log(chalk.gray(`  ⊘ r/${entry.name}: inaccessible (${status}) — skipping`));
      return [];
    }

    // Retryable
    if (attempt < MAX_RETRIES) {
      const wait = RETRY_BASE_MS * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.log(chalk.yellow(`  ↻ r/${entry.name}: attempt ${attempt} failed — retrying in ${Math.round(wait / 1000)}s`));
      await new Promise((r) => setTimeout(r, wait));
      return fetchSubreddit(client, entry, attempt + 1);
    }

    console.log(chalk.red(`  ✗ r/${entry.name}: failed after ${MAX_RETRIES} attempts — ${err.message}`));
    return [];
  }
}

// ── Single-client runner ──────────────────────────────────────────────────────

async function runClient(
  client:  Snoowrap,
  entries: SubredditEntry[],
  label:   string,
): Promise<{ posts: RedditPost[]; ok: number; failed: number }> {
  const allPosts: RedditPost[] = [];
  let ok = 0, failed = 0, consecutiveFailures = 0;

  for (const entry of entries) {
    if (consecutiveFailures >= CIRCUIT_BREAKER_MAX) {
      console.log(chalk.red(`\n  ⚡ ${label}: circuit breaker tripped after ${CIRCUIT_BREAKER_MAX} consecutive failures — aborting client`));
      break;
    }

    process.stdout.write(chalk.gray(`  ${label} › r/${entry.name} ... `));

    const posts = await fetchSubreddit(client, entry);

    if (posts.length > 0) {
      console.log(chalk.green(`${posts.length} posts`));
      allPosts.push(...posts);
      ok++;
      consecutiveFailures = 0;
    } else {
      console.log(chalk.gray(`0 posts`));
      failed++;
      consecutiveFailures++;
    }

    // Pacing handled by snoowrap.requestDelay, but add minimal gap for safety
    await new Promise((r) => setTimeout(r, 200));
  }

  return { posts: allPosts, ok, failed };
}

// ── Chunk helper ──────────────────────────────────────────────────────────────

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function scrapeReddit(entries: SubredditEntry[]): Promise<{
  posts:    RedditPost[];
  ok:       number;
  failed:   number;
}> {
  const client1 = buildClient("CLIENT_1");
  const client2 = buildClient("CLIENT_2");

  const available = [
    client1 ? { client: client1, label: "CLIENT_1" } : null,
    client2 ? { client: client2, label: "CLIENT_2" } : null,
  ].filter(Boolean) as { client: Snoowrap; label: string }[];

  if (available.length === 0) {
    console.log(chalk.red("  ✗ No Reddit clients available — check credentials in .env"));
    return { posts: [], ok: 0, failed: entries.length };
  }

  const chunks = chunkArray(entries, Math.ceil(entries.length / available.length));

  console.log(chalk.cyan(`\n  Clients: ${available.length}  |  Subreddits: ${entries.length}  |  Per client: ~${chunks[0]?.length}`));

  const results = await Promise.allSettled(
    available.map((c, i) => runClient(c.client, chunks[i] || [], c.label))
  );

  let allPosts: RedditPost[] = [];
  let totalOk = 0, totalFailed = 0;

  for (const r of results) {
    if (r.status === "fulfilled") {
      allPosts    = allPosts.concat(r.value.posts);
      totalOk    += r.value.ok;
      totalFailed += r.value.failed;
    } else {
      console.log(chalk.red(`  ✗ Client promise rejected: ${r.reason?.message}`));
    }
  }

  return { posts: allPosts, ok: totalOk, failed: totalFailed };
}