// core/db.ts

import pg from "pg";
import chalk from "chalk";
import { DB_CONFIG, SCRAPE_CONFIG } from "../config/index";
import type { PinterestPin, UpsertResult, DBTableStats, RedditPost, RedditTableStats } from "../types/index";

const { Pool } = pg;
let pool: pg.Pool | null = null;

export function connectDB(): pg.Pool {
  if (pool) return pool;
  pool = new Pool(DB_CONFIG);
  pool.on("error", (err: Error) =>
    console.error(chalk.red("DB pool error:"), err.message)
  );
  return pool;
}

export async function testConnection(): Promise<{ time: Date; db: string }> {
  if (!pool) throw new Error("DB not connected");
  const res = await pool.query("SELECT NOW() as time, current_database() as db");
  return res.rows[0] as { time: Date; db: string };
}

export async function disconnectDB(): Promise<void> {
  if (pool) { await pool.end(); pool = null; }
}

// ── Pinterest upsert ──────────────────────────────────────────────────────────

export async function upsertPinterestPins(pins: PinterestPin[]): Promise<UpsertResult> {
  if (!pool) throw new Error("DB not connected");
  if (!pins.length) return { inserted: 0, updated: 0, errors: 0 };

  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  let inserted = 0, updated = 0, errors = 0;

  for (const pin of pins) {
    try {
      const saves      = BigInt(pin.saves  || 0);
      const clicks     = BigInt(pin.clicks || 0);
      const engagement = (pin.saves + pin.clicks) / Math.max(pin.saves + pin.clicks, 1);

      const res = await pool.query(
        `INSERT INTO discovery_pinterest_raw (
          pinterest_id, title, description, image_url, pin_url,
          board_name, board_owner, saves, clicks, engagement_rate,
          hashtags, pin_type, expires_at, raw_data
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::bigint,$9::bigint,$10::decimal,$11,$12,$13,$14::jsonb)
        ON CONFLICT (pinterest_id) DO UPDATE SET
          saves           = GREATEST(EXCLUDED.saves, discovery_pinterest_raw.saves),
          clicks          = GREATEST(EXCLUDED.clicks, discovery_pinterest_raw.clicks),
          engagement_rate = EXCLUDED.engagement_rate,
          title           = CASE WHEN EXCLUDED.title != '' THEN EXCLUDED.title ELSE discovery_pinterest_raw.title END,
          description     = CASE WHEN EXCLUDED.description != '' THEN EXCLUDED.description ELSE discovery_pinterest_raw.description END,
          image_url       = CASE WHEN EXCLUDED.image_url != '' THEN EXCLUDED.image_url ELSE discovery_pinterest_raw.image_url END,
          hashtags        = EXCLUDED.hashtags,
          raw_data        = EXCLUDED.raw_data,
          expires_at      = EXCLUDED.expires_at,
          scraped_at      = NOW()
        RETURNING (xmax = 0) AS is_insert`,
        [
          pin.pin_id,
          (pin.title        || "").slice(0, 300),
          (pin.description  || "").slice(0, 500),
          pin.image_url     || "",
          pin.pin_url       || "",
          (pin.board_name   || "").slice(0, 200),
          pin.board_owner   || "",
          saves.toString(),
          clicks.toString(),
          engagement.toFixed(6),
          pin.hashtags      || [],
          pin.pin_type      || "pin",
          expiresAt.toISOString(),
          JSON.stringify({
            pinner_username:  pin.pinner_username  || "",
            pinner_followers: pin.pinner_followers || 0,
            dominant_color:   pin.dominant_color   || "",
            image_url_236:    pin.image_url_236    || "",
            image_url_474:    pin.image_url_474    || "",
            image_url_736:    pin.image_url_736    || "",
            created_at:       pin.created_at       || null,
            scraped_at:       new Date().toISOString(),
          }),
        ]
      );

      if ((res.rows[0] as { is_insert: boolean })?.is_insert) inserted++;
      else updated++;
    } catch (err) {
      console.error(chalk.red(`  ✗ DB upsert failed pin ${pin.pin_id}: ${(err as Error).message}`));
      errors++;
    }
  }

  return { inserted, updated, errors };
}

export async function getPinterestTableStats(): Promise<DBTableStats> {
  if (!pool) throw new Error("DB not connected");
  const res = await pool.query(`
    SELECT
      COUNT(*)                                                     AS total_pins,
      COUNT(*) FILTER (WHERE saves > 0)                           AS pins_with_saves,
      COUNT(*) FILTER (WHERE scraped_at > NOW() - INTERVAL '24h') AS scraped_last_24h,
      COUNT(*) FILTER (WHERE expires_at > NOW())                  AS active_pins,
      MAX(scraped_at)                                             AS last_scraped,
      ROUND(AVG(saves::numeric), 1)                               AS avg_saves
    FROM discovery_pinterest_raw
  `);
  return res.rows[0] as DBTableStats;
}

// ── Reddit upsert ─────────────────────────────────────────────────────────────

export async function upsertRedditPosts(posts: RedditPost[]): Promise<UpsertResult> {
  if (!pool) throw new Error("DB not connected");
  if (!posts.length) return { inserted: 0, updated: 0, errors: 0 };

  const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
  let inserted = 0, updated = 0, errors = 0;

  for (const post of posts) {
    try {
      const res = await pool.query(
        `INSERT INTO discovery_reddit_raw (
          post_id, subreddit, title, score, upvote_ratio, num_comments,
          url, author, flair, age_hours, velocity, is_breakout,
          feed, expires_at, raw_data
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
        ON CONFLICT (post_id) DO UPDATE SET
          score        = EXCLUDED.score,
          num_comments = EXCLUDED.num_comments,
          upvote_ratio = EXCLUDED.upvote_ratio,
          age_hours    = EXCLUDED.age_hours,
          velocity     = EXCLUDED.velocity,
          is_breakout  = EXCLUDED.is_breakout,
          scraped_at   = NOW()
        RETURNING (xmax = 0) AS is_insert`,
        [
          post.post_id,
          post.subreddit,
          post.title,
          post.score,
          post.upvote_ratio,
          post.num_comments,
          post.url,
          post.author,
          post.flair,
          post.age_hours,
          post.velocity,
          post.is_breakout,
          post.feed,
          expiresAt.toISOString(),
          JSON.stringify(post.raw_data),
        ]
      );

      if ((res.rows[0] as { is_insert: boolean })?.is_insert) inserted++;
      else updated++;
    } catch (err) {
      console.error(chalk.red(`  ✗ DB upsert failed post ${post.post_id}: ${(err as Error).message}`));
      errors++;
    }
  }

  return { inserted, updated, errors };
}

export async function getRedditTableStats(): Promise<RedditTableStats> {
  if (!pool) throw new Error("DB not connected");
  const res = await pool.query(`
    SELECT
      COUNT(*)                                                      AS total_posts,
      COUNT(*) FILTER (WHERE score > 0)                            AS posts_with_score,
      COUNT(*) FILTER (WHERE scraped_at > NOW() - INTERVAL '24h') AS scraped_last_24h,
      COUNT(*) FILTER (WHERE expires_at > NOW())                   AS active_posts,
      MAX(scraped_at)                                              AS last_scraped,
      ROUND(AVG(velocity::numeric), 1)                             AS avg_velocity
    FROM discovery_reddit_raw
  `);
  return res.rows[0] as RedditTableStats;
}
// ── Google Trends upsert ── ADD to core/db.ts ─────────────────────────────────

import type {
  GoogleTrendResult,
  GoogleTrendsUpsertResult,
  GoogleTrendsTableStats,
} from "../types/index";

export async function upsertGoogleTrends(
  results: GoogleTrendResult[],
): Promise<GoogleTrendsUpsertResult> {
  if (!pool) throw new Error("DB not connected");
  if (!results.length) return { inserted: 0, updated: 0, errors: 0, skipped: 0 };

  const expiresAt = new Date(
    Date.now() + SCRAPE_CONFIG.googleTrends.expiresInDays * 24 * 60 * 60 * 1000,
  );
  let inserted = 0, updated = 0, errors = 0, skipped = 0;

  for (const r of results) {
    if (!r.keyword || r.keyword.trim() === "") { skipped++; continue; }

    try {
      const res = await pool.query(
        `INSERT INTO discovery_google_trends_raw (
          keyword,
          geo,
          interest_score,
          related_queries,
          related_topics,
          breakout,
          trend_date,
          expires_at,
          raw_data
        ) VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7::date, $8, $9::jsonb)
        ON CONFLICT (keyword, geo, trend_date) DO UPDATE SET
          interest_score  = GREATEST(EXCLUDED.interest_score, discovery_google_trends_raw.interest_score),
          related_queries = EXCLUDED.related_queries,
          related_topics  = EXCLUDED.related_topics,
          breakout        = EXCLUDED.breakout OR discovery_google_trends_raw.breakout,
          raw_data        = EXCLUDED.raw_data,
          expires_at      = EXCLUDED.expires_at,
          scraped_at      = NOW()
        RETURNING (xmax = 0) AS is_insert`,
        [
          r.keyword.trim().slice(0, 300),
          r.geo,
          r.interestScore,
          JSON.stringify(r.relatedQueries),
          JSON.stringify(r.relatedTopics),
          r.breakout,
          r.trendDate,
          expiresAt.toISOString(),
          JSON.stringify({
            peakScore:    r.peakScore,
            timelineData: r.timelineData,
            scraped_at:   new Date().toISOString(),
          }),
        ],
      );

      if ((res.rows[0] as { is_insert: boolean })?.is_insert) inserted++;
      else updated++;
    } catch (err) {
      console.error(
        chalk.red(`  ✗ GT upsert failed "${r.keyword}": ${(err as Error).message}`),
      );
      errors++;
    }
  }

  return { inserted, updated, errors, skipped };
}

export async function getGoogleTrendsTableStats(): Promise<GoogleTrendsTableStats> {
  if (!pool) throw new Error("DB not connected");
  const res = await pool.query(`
    SELECT
      COUNT(*)                                                       AS total_keywords,
      COUNT(*) FILTER (WHERE breakout = true)                       AS breakout_count,
      COUNT(*) FILTER (WHERE scraped_at > NOW() - INTERVAL '24h')  AS scraped_last_24h,
      COUNT(*) FILTER (WHERE expires_at > NOW())                    AS active_keywords,
      MAX(scraped_at)                                               AS last_scraped,
      ROUND(AVG(interest_score::numeric), 1)                        AS avg_interest
    FROM discovery_google_trends_raw
  `);
  return res.rows[0] as GoogleTrendsTableStats;
}