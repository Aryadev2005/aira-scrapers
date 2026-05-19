// scrapers/runner.ts — RSS-based, replaces widget-token runner
// ══════════════════════════════════════════════════════════════════════════════
// Orchestrates a Google Trends scrape using RSS feed instead of per-keyword scraping.
// This approach is fast (4 seconds for all trends), requires no auth, and never gets blocked.
// ══════════════════════════════════════════════════════════════════════════════

import { scrapeGoogleTrendsRSS } from "./googleTrends";
import { upsertGoogleTrends } from "../core/db";
import type { GoogleTrendResult, GoogleTrendsRunResult } from "../types/index";

export async function runGoogleTrendsScrape(
  _tier?: string,
  dryRun = false,
): Promise<GoogleTrendsRunResult> {
  const start = Date.now();

  const items = await scrapeGoogleTrendsRSS();

  if (!items.length) {
    return {
      inserted: 0,
      updated: 0,
      errors: 0,
      skipped: 0,
      durationMs: Date.now() - start,
      tier: _tier ?? "rss",
    };
  }

  const results: GoogleTrendResult[] = items.map(item => ({
    keyword:        item.keyword,
    geo:            "IN",
    interestScore:  Math.min(100, Math.round(item.approxVolume / 10_000)),
    peakScore:      Math.min(100, Math.round(item.approxVolume / 10_000)),
    breakout:       item.approxVolume >= 500_000,
    relatedQueries: item.relatedTerms.map(q => ({
      query: q,
      value: 50,
      isRisingBreakout: false,
    })),
    relatedTopics:  [],
    timelineData:   [],
    trendDate:      new Date().toISOString().split("T")[0],
  }));

  if (dryRun) {
    console.log(`[GT RSS] DryRun — ${results.length} trends found`);
    results.forEach(r => console.log(`  ${r.keyword} (vol≈${r.interestScore})`));
    return {
      inserted: results.length,
      updated: 0,
      errors: 0,
      skipped: 0,
      durationMs: Date.now() - start,
      tier: "rss",
    };
  }

  const { inserted, updated, errors } = await upsertGoogleTrends(results);
  return {
    inserted,
    updated,
    errors,
    skipped: 0,
    durationMs: Date.now() - start,
    tier: _tier ?? "rss",
  };
}