// index.ts

import "dotenv/config";
import { writeFileSync } from "fs";
import chalk from "chalk";
import {
  connectDB, testConnection, disconnectDB,
  upsertPinterestPins, getPinterestTableStats,
  upsertRedditPosts, getRedditTableStats,
  getGoogleTrendsTableStats,        
} from "./core/db";
import { PinterestSession }                          from "./core/session";
import { scrapeReddit }          from "./scrapers/reddit"; 
import { scrapeSearch, scrapeTrending, scrapeBoard } from "./scrapers/pinterest";
import { REDDIT_SUBREDDITS, getSubredditsByTier, SCRAPE_CONFIG, PINTEREST_QUERIES } from "./config/index";
import { sleep }                                     from "./utils/helpers";
import type { PinterestPin, RedditPost ,ScraperSource }          from "./types/index";
import { scrapeTikTokHashtags }  from "./scrapers/tiktok";
import {
  upsertTikTokVideos,
  getTikTokTableStats,
}                                from "./core/db";
import { TIKTOK_HASHTAGS }       from "./config/index";
import type { TikTokVideo }      from "./types/index";
// ── CLI args ──────────────────────────────────────────────────────────────────

const args      = process.argv.slice(2);
const SOURCE    = (args[args.indexOf("--source") + 1] || "pinterest") as ScraperSource;
const IS_TEST   = args.includes("--test");
const SAVE_DB   = args.includes("--save");
const BOARD_IDX = args.indexOf("--board");
const BOARD_ARG = BOARD_IDX !== -1 ? args[BOARD_IDX + 1] : null;

// ── Stats printer ─────────────────────────────────────────────────────────────

function printStats(pins: PinterestPin[]): void {
  console.log(chalk.bold.white("\n════════════════════════════════════"));
  console.log(chalk.bold.white("  SCRAPE SUMMARY"));
  console.log(chalk.bold.white("════════════════════════════════════"));
  console.log(`  Total pins       : ${chalk.green(pins.length)}`);
  console.log(`  With image URL   : ${chalk.green(pins.filter(p => p.image_url).length)}`);
  console.log(`  With saves > 0   : ${chalk.green(pins.filter(p => p.saves > 0).length)}`);
  console.log(`  With description : ${chalk.green(pins.filter(p => p.description).length)}`);
  console.log(`  With hashtags    : ${chalk.green(pins.filter(p => p.hashtags.length > 0).length)}`);

  const top5 = [...pins].sort((a, b) => b.saves - a.saves).slice(0, 5);
  if (top5.length) {
    console.log(chalk.bold.white("\n  Top 5 by saves:"));
    top5.forEach((p, i) =>
      console.log(chalk.gray(`  ${i + 1}. [${p.saves} saves] ${(p.title || "(no title)").slice(0, 60)}`))
    );
  }
  console.log(chalk.bold.white("════════════════════════════════════\n"));
}
// ── Reddit stats printer ──────────────────────────────────────────────────────

function printRedditStats(posts: RedditPost[]): void {
  console.log(chalk.bold.white("\n════════════════════════════════════"));
  console.log(chalk.bold.white("  REDDIT SCRAPE SUMMARY"));
  console.log(chalk.bold.white("════════════════════════════════════"));
  console.log(`  Total posts      : ${chalk.green(posts.length)}`);
  console.log(`  Breakout posts   : ${chalk.green(posts.filter(p => p.is_breakout).length)}`);
  console.log(`  High velocity    : ${chalk.green(posts.filter(p => p.velocity >= 60).length)}`);
  console.log(`  Unique subreddits: ${chalk.green(new Set(posts.map(p => p.subreddit)).size)}`);

  const niches = [...new Set(posts.map(p => p.niche))];
  console.log(`  Niches covered   : ${chalk.cyan(niches.join(", "))}`);

  const top5 = [...posts].sort((a, b) => b.score - a.score).slice(0, 5);
  if (top5.length) {
    console.log(chalk.bold.white("\n  Top 5 by score:"));
    top5.forEach((p, i) =>
      console.log(chalk.gray(`  ${i + 1}. [${p.score}↑ v:${p.velocity}] r/${p.subreddit} — ${p.title.slice(0, 55)}`))
    );
  }
  console.log(chalk.bold.white("════════════════════════════════════\n"));
}
// ── Pinterest orchestrator ────────────────────────────────────────────────────

async function runPinterest(): Promise<PinterestPin[]> {
  const CFG      = SCRAPE_CONFIG.pinterest;
  const queries  = IS_TEST ? [PINTEREST_QUERIES[0]] : PINTEREST_QUERIES;
  const pinsPerQ = IS_TEST ? 25 : CFG.maxPinsPerQuery;
  const allPins: PinterestPin[] = [];

  const session = new PinterestSession();
  await session.init();

  if (BOARD_ARG) {
    const pins = await scrapeBoard(session, BOARD_ARG, pinsPerQ);
    allPins.push(...pins);
    if (SAVE_DB && pins.length) {
      const r = await upsertPinterestPins(pins);
      console.log(chalk.blue(`  💾 DB: +${r.inserted} new, ${r.updated} updated, ${r.errors} errors`));
    }
  } else {
    for (const query of queries) {
      try {
        const pins = await scrapeSearch(session, query, pinsPerQ);
        allPins.push(...pins);
        if (SAVE_DB && pins.length) {
          const r = await upsertPinterestPins(pins);
          console.log(chalk.blue(`  💾 DB: +${r.inserted} new, ${r.updated} updated, ${r.errors} errors`));
        }
      } catch (err) {
        console.log(chalk.red(`✗ "${query}": ${(err as Error).message}`));
      }
      await sleep(CFG.delayBetweenQueries);
    }

    if (!IS_TEST) {
      try {
        const trending = await scrapeTrending(session, 50);
        allPins.push(...trending);
        if (SAVE_DB && trending.length) {
          const r = await upsertPinterestPins(trending);
          console.log(chalk.blue(`  💾 DB trending: +${r.inserted} new, ${r.updated} updated`));
        }
      } catch (err) {
        console.log(chalk.red(`✗ Trending: ${(err as Error).message}`));
      }
    }
  }

  return allPins;
}
// ── TikTok orchestrator ───────────────────────────────────────────────────────

async function runTikTok(): Promise<TikTokVideo[]> {
  console.log(chalk.bold.magenta(`\n🎵 TikTok Scraper (Creative Center)`));
  console.log(chalk.gray(`  mode    : ${IS_TEST ? "TEST" : "FULL"}`));
  console.log(chalk.gray(`  save DB : ${SAVE_DB}`));
  console.log(chalk.bold.white("────────────────────────────────────"));

  // Import the trending function
  const { scrapeTikTokTrending } = await import("./scrapers/tiktok");
  const trending = await scrapeTikTokTrending();

  if (SAVE_DB && trending.length > 0) {
    const r = await upsertTikTokVideos(trending);
    console.log(chalk.blue(`  💾 DB: +${r.inserted} new, ${r.updated} updated, ${r.errors} errors`));
  }

  console.log(chalk.bold.white("\n════════════════════════════════════"));
  console.log(chalk.bold.white("  TIKTOK SCRAPE SUMMARY"));
  console.log(chalk.bold.white("════════════════════════════════════"));
  const uniqueSounds = new Set(trending.filter(v => v.sound_name).map(v => v.sound_name)).size;
  console.log(`  Total entries : ${chalk.green(trending.length)}`);
  console.log(`  With views    : ${chalk.green(trending.filter(v => v.views > 0).length)}`);
  console.log(`  Unique sounds : ${chalk.green(uniqueSounds)}`);

  const top5 = [...trending].sort((a, b) => b.views - a.views).slice(0, 5);
  if (top5.length) {
    console.log(chalk.bold.white("\n  Top 5 by views:"));
    top5.forEach((v, i) =>
      console.log(chalk.gray(`  ${i + 1}. ${v.description.slice(0, 80)}`))
    );
  }
  console.log(chalk.bold.white("════════════════════════════════════\n"));

  if (SAVE_DB) {
    try {
      const stats = await getTikTokTableStats();
      console.log(chalk.blue(`  📊 DB total: ${stats.total_videos} | active: ${stats.active_videos}`));
    } catch { /* optional */ }
  }

  return trending;
}
// ── Reddit orchestrator ───────────────────────────────────────────────────────

async function runReddit(): Promise<RedditPost[]> {
  // In test mode: only Tier A, first 5 subreddits
  // In full mode: Tier A + B (Tier C is separate deep run)
  const entries = IS_TEST
    ? getSubredditsByTier("A").slice(0, 5)
    : getSubredditsByTier("A").concat(getSubredditsByTier("B"));

  console.log(chalk.bold.cyan(`\n  Mode: ${IS_TEST ? "TEST (5 subreddits)" : `FULL (${entries.length} subreddits, Tier A + B)`}`));

  const { posts, ok, failed } = await scrapeReddit(entries);

  console.log(chalk.bold.white(`\n  Done: ${ok} subreddits ok, ${failed} failed, ${posts.length} posts`));

  if (SAVE_DB && posts.length) {
    const r = await upsertRedditPosts(posts);
    console.log(chalk.blue(`  💾 DB: +${r.inserted} new, ${r.updated} updated, ${r.errors} errors`));

    const stats = await getRedditTableStats();
    console.log(chalk.blue(`  📊 Table: ${stats.total_posts} total, ${stats.active_posts} active, avg velocity ${stats.avg_velocity}`));
  }

  return posts;
}
// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(chalk.bold.magenta("\n╔══════════════════════════════════════════╗"));
  console.log(chalk.bold.magenta("║   TrendAI Scraper v2.0 — TypeScript      ║"));
  console.log(chalk.bold.magenta("╚══════════════════════════════════════════╝\n"));
  console.log(`  Source : ${chalk.white(SOURCE.toUpperCase())}`);
  console.log(`  Mode   : ${chalk.white(IS_TEST ? "TEST (1 query, 25 pins)" : "FULL")}`);
  console.log(`  Save   : ${chalk.white(SAVE_DB ? "Supabase DB + JSON" : "JSON only")}`);
  console.log(`  Board  : ${chalk.white(BOARD_ARG ?? "—")}\n`);

  if (SOURCE === "reddit") {
    connectDB();
    const conn = await testConnection();
    console.log(chalk.green(`  ✓ DB: ${conn.db} @ ${conn.time}`));

    const posts = await runReddit();
    printRedditStats(posts);

    if (!SAVE_DB) {
      const outFile = `reddit_output_${Date.now()}.json`;
      writeFileSync(outFile, JSON.stringify(posts, null, 2));
      console.log(chalk.gray(`  Saved to ${outFile}`));
    }

    await disconnectDB();
    return;
  }

  if (SOURCE === "tiktok") {
    if (SAVE_DB) {
      connectDB();
      const conn = await testConnection();
      console.log(chalk.green(`  ✓ DB: ${conn.db} @ ${conn.time}`));
    }
    await runTikTok();
    if (SAVE_DB) await disconnectDB();
    return;
  }

  if (SAVE_DB) {
    console.log(chalk.blue("▶ Connecting to Supabase..."));
    connectDB();
    try {
      const info = await testConnection();
      console.log(chalk.green(`✓ Connected → ${info.db}\n`));
    } catch (err) {
      console.error(chalk.red(`✗ DB failed: ${(err as Error).message}`));
      process.exit(1);
    }
  }

  let allPins: PinterestPin[] = [];

  try {
    if (SOURCE === "pinterest") allPins = await runPinterest();
    else console.log(chalk.yellow(`⚠ Source "${SOURCE}" not yet implemented`));
  } catch (err) {
    console.error(chalk.red(`✗ Fatal: ${(err as Error).message}`));
    console.error((err as Error).stack);
    process.exit(1);
  }

  printStats(allPins);

  if (SAVE_DB) {
    try {
      const stats = await getPinterestTableStats();
      console.log(chalk.bold.blue("  Supabase — discovery_pinterest_raw:"));
      console.log(chalk.gray(`  Total rows  : ${stats.total_pins}`));
      console.log(chalk.gray(`  Active      : ${stats.active_pins}`));
      console.log(chalk.gray(`  Last 24h    : ${stats.scraped_last_24h}`));
      console.log(chalk.gray(`  Avg saves   : ${stats.avg_saves}`));
      console.log(chalk.gray(`  Last scraped: ${stats.last_scraped}\n`));
    } catch { /* non-fatal */ }
    await disconnectDB();
  }
// ADD to index.ts — in your SOURCE routing section

// ── Google Trends source ──────────────────────────────────────────────────────
if (SOURCE === "googleTrends") {
  const { runGoogleTrendsScrape } = await import("./scrapers/runner");

  // CLI: tsx index.ts --source googleTrends --tier A --test --save
  const TIER_IDX = args.indexOf("--tier");
  const TIER_ARG = TIER_IDX !== -1 ? args[TIER_IDX + 1] : null;
  const tier = (["A", "B", "C"].includes(TIER_ARG ?? "") ? TIER_ARG : "A") as "A" | "B" | "C";

  if (SAVE_DB) {
    connectDB();
    await testConnection();
  }

  const result = await runGoogleTrendsScrape(tier, !SAVE_DB);

  if (SAVE_DB) {
    console.log(chalk.bold.green("\n✓ Results saved to Supabase DB"));
    const stats = await getGoogleTrendsTableStats();
    console.log(chalk.bold.white("\n  DB TABLE STATS:"));
    console.log(`  Total keywords  : ${chalk.cyan(stats.total_keywords)}`);
    console.log(`  Breakouts       : ${chalk.yellow(stats.breakout_count)}`);
    console.log(`  Active          : ${chalk.green(stats.active_keywords)}`);
    console.log(`  Scraped 24h     : ${chalk.green(stats.scraped_last_24h)}`);
    console.log(`  Avg interest    : ${chalk.cyan(stats.avg_interest)}`);
    console.log(`  Last scraped    : ${chalk.gray(stats.last_scraped)}`);
    await disconnectDB();
  }

  process.exit(0);
}
  const out = `pins_${Date.now()}.json`;
  writeFileSync(out, JSON.stringify({
    scraped_at: new Date().toISOString(),
    source:     SOURCE,
    total:      allPins.length,
    pins:       allPins,
  }, null, 2));
  console.log(chalk.green(`✓ JSON → ${out}`));
}

main().catch((err: unknown) => {
  console.error(chalk.red(`\n✗ Fatal: ${(err as Error).message}`));
  process.exit(1);
});