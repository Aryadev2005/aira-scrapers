// scrapers/runner.ts (Google Trends)
// ══════════════════════════════════════════════════════════════════════════════
// Orchestrates a full Google Trends scrape run for a given tier.
//
// Uses p-limit for concurrency (max 5 parallel requests).
// Each batch of 5 keywords fires simultaneously with per-request jitter.
// After each batch, a cooldown pause is applied.
// ══════════════════════════════════════════════════════════════════════════════

import chalk from "chalk";
import pLimit from "p-limit";
import { scrapeKeyword } from "./googleTrends";
import { upsertGoogleTrends } from "../core/db";
import { SCRAPE_CONFIG } from "../config/index";
import { getKeywordsByTier } from "../config/keywords";
import type { TrendTier, GoogleTrendResult, GoogleTrendsRunResult } from "../types/index";

const CFG = SCRAPE_CONFIG.googleTrends;

// Pause between batches — harder boundary to avoid burst detection
const BATCH_PAUSE_MS = 8_000;

function jitter(minMs: number, maxMs: number): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(r => setTimeout(r, ms));
}

export async function runGoogleTrendsScrape(
  tier: TrendTier,
  dryRun = false,
): Promise<GoogleTrendsRunResult> {
  const start    = Date.now();
  const keywords = getKeywordsByTier(tier);
  const limit    = pLimit(CFG.concurrency);

  console.log(chalk.bold.cyan(`\n═══════════════════════════════════════════`));
  console.log(chalk.bold.cyan(`  Google Trends — Tier ${tier} scrape`));
  console.log(chalk.bold.cyan(`  Keywords  : ${keywords.length}`));
  console.log(chalk.bold.cyan(`  Geo       : ${CFG.geo}`));
  console.log(chalk.bold.cyan(`  DryRun    : ${dryRun}`));
  console.log(chalk.bold.cyan(`═══════════════════════════════════════════\n`));

  let totalInserted = 0;
  let totalUpdated  = 0;
  let totalErrors   = 0;
  let totalSkipped  = 0;
  let done          = 0;

  // Process in batches of batchSize
  for (let i = 0; i < keywords.length; i += CFG.batchSize) {
    const batch = keywords.slice(i, i + CFG.batchSize);

    const tasks = batch.map(entry =>
      limit(async () => {
        // Per-request jitter so parallel requests don't fire at exact same ms
        await jitter(CFG.minDelayMs, CFG.maxDelayMs);
        return scrapeKeyword(entry);
      }),
    );

    const results = await Promise.allSettled(tasks);
    const valid: GoogleTrendResult[] = [];

    for (const r of results) {
      done++;
      if (r.status === "fulfilled" && r.value !== null) {
        valid.push(r.value);
      } else if (r.status === "rejected") {
        totalErrors++;
        console.error(chalk.red(`  [runner] task rejected: ${r.reason?.message}`));
      } else if (r.status === "fulfilled" && r.value === null) {
        totalSkipped++;
      }
    }

    // Print batch progress
    const batchNum = Math.floor(i / CFG.batchSize) + 1;
    const total    = Math.ceil(keywords.length / CFG.batchSize);
    const breakouts = valid.filter(v => v.breakout).length;

    console.log(
      chalk.gray(`  Batch ${batchNum}/${total} — ${valid.length} valid, ${breakouts} breakouts, progress: ${done}/${keywords.length}`)
    );

    // Upsert this batch to DB
    if (!dryRun && valid.length > 0) {
      const upsert = await upsertGoogleTrends(valid);
      totalInserted += upsert.inserted;
      totalUpdated  += upsert.updated;
      totalErrors   += upsert.errors;
      totalSkipped  += upsert.skipped;

      // Log breakouts
      for (const v of valid.filter(v => v.breakout)) {
        console.log(chalk.bold.yellow(`  🔥 BREAKOUT: "${v.keyword}" (score: ${v.interestScore})`));
      }
    }

    // Cooldown between batches (skip after last batch)
    if (i + CFG.batchSize < keywords.length) {
      await new Promise(r => setTimeout(r, BATCH_PAUSE_MS));
    }
  }

  const durationMs = Date.now() - start;

  console.log(chalk.bold.white(`\n════════════════════════════════════════`));
  console.log(chalk.bold.white(`  GOOGLE TRENDS TIER ${tier} — COMPLETE`));
  console.log(chalk.bold.white(`════════════════════════════════════════`));
  console.log(`  Keywords  : ${chalk.green(keywords.length)}`);
  console.log(`  Inserted  : ${chalk.green(totalInserted)}`);
  console.log(`  Updated   : ${chalk.green(totalUpdated)}`);
  console.log(`  Skipped   : ${chalk.yellow(totalSkipped)}`);
  console.log(`  Errors    : ${chalk.red(totalErrors)}`);
  console.log(`  Duration  : ${chalk.cyan((durationMs / 1000).toFixed(1) + "s")}`);
  console.log(chalk.bold.white(`════════════════════════════════════════\n`));

  return {
    tier,
    totalKeywords: keywords.length,
    inserted:      totalInserted,
    updated:       totalUpdated,
    errors:        totalErrors,
    skipped:       totalSkipped,
    durationMs,
  };
}