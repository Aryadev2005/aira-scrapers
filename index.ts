// index.ts

import "dotenv/config";
import { writeFileSync } from "fs";
import chalk from "chalk";
import {
  connectDB, testConnection, disconnectDB,
  upsertPinterestPins, getPinterestTableStats,
} from "./core/db";
import { PinterestSession }                          from "./core/session";
import { scrapeSearch, scrapeTrending, scrapeBoard } from "./scrapers/pinterest";
import { PINTEREST_QUERIES, SCRAPE_CONFIG }          from "./config/index";
import { sleep }                                     from "./utils/helpers";
import type { PinterestPin, ScraperSource }          from "./types/index";

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

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(chalk.bold.magenta("\n╔══════════════════════════════════════════╗"));
  console.log(chalk.bold.magenta("║   TrendAI Scraper v2.0 — TypeScript      ║"));
  console.log(chalk.bold.magenta("╚══════════════════════════════════════════╝\n"));
  console.log(`  Source : ${chalk.white(SOURCE.toUpperCase())}`);
  console.log(`  Mode   : ${chalk.white(IS_TEST ? "TEST (1 query, 25 pins)" : "FULL")}`);
  console.log(`  Save   : ${chalk.white(SAVE_DB ? "Supabase DB + JSON" : "JSON only")}`);
  console.log(`  Board  : ${chalk.white(BOARD_ARG ?? "—")}\n`);

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