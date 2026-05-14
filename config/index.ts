// config/index.ts

import type { PoolConfig } from "pg";

// ── DB ────────────────────────────────────────────────────────────────────────

export const DB_CONFIG: PoolConfig = {
  connectionString:    process.env.DATABASE_URL,
  ssl:                 { rejectUnauthorized: false },
  max:                 5,
  idleTimeoutMillis:   30_000,
  connectionTimeoutMillis: 10_000,
};

// ── Scraper configs ───────────────────────────────────────────────────────────

export interface ScraperConfig {
  maxRetries:  number;
  retryDelay:  number;
}

export interface PinterestConfig extends ScraperConfig {
  maxPinsPerQuery:      number;
  pageSize:             number;
  delayBetweenPages:    number;
  delayBetweenQueries:  number;
  sessionFile:          string;
  sessionMaxAgeDays:    number;
}

export interface RedditConfig extends ScraperConfig {
  maxPostsPerSub:   number;
  delayBetweenSubs: number;
}

export interface TikTokConfig extends ScraperConfig {
  maxVideosPerTag:  number;
  delayBetweenTags: number;
}

export interface GoogleTrendsConfig extends ScraperConfig {
  maxKeywords:          number;
  delayBetweenKeywords: number;
}

export const SCRAPE_CONFIG = {
  pinterest: {
    maxPinsPerQuery:      100,
    pageSize:             25,
    delayBetweenPages:    1200,
    delayBetweenQueries:  3500,
    maxRetries:           3,
    retryDelay:           5000,
    sessionFile:          "./pintrest.session.json",
    sessionMaxAgeDays:    13,
  } satisfies PinterestConfig,

  reddit: {
    maxPostsPerSub:   50,
    delayBetweenSubs: 2000,
    maxRetries:       3,
    retryDelay:       4000,
  } satisfies RedditConfig,

  tiktok: {
    maxVideosPerTag:  30,
    delayBetweenTags: 3000,
    maxRetries:       3,
    retryDelay:       5000,
  } satisfies TikTokConfig,

  googleTrends: {
    maxKeywords:          20,
    delayBetweenKeywords: 2000,
    maxRetries:           3,
    retryDelay:           4000,
  } satisfies GoogleTrendsConfig,
};

// ── Global proxy ──────────────────────────────────────────────────────────────

export const PROXY_URL: string | null =
  process.env.SCRAPER_PROXY || process.env.PINTREST_PROXY || null;

// ── Query lists ───────────────────────────────────────────────────────────────

export const PINTEREST_QUERIES: string[] = [
  // Global aesthetic trends
  "clean girl aesthetic outfit",
  "quiet luxury aesthetic 2025",
  "korean skincare routine steps",
  "that girl morning routine",
  "y2k fashion aesthetic",
  "minimalist home office setup",
  "coastal grandmother style",
  "dark academia aesthetic outfit",
  "pilates girl aesthetic",
  "vanilla girl aesthetic",
  "mob wife aesthetic",
  "coquette aesthetic outfit",
  "soft girl aesthetic",
  // India-specific
  "indian wedding guest outfit 2025",
  "bollywood makeup look",
  "mehndi design 2025",
  "indian home decor ideas",
  "saree styling modern",
  "south indian bridal look",
];

export const REDDIT_SUBREDDITS: string[] = [
  "AskIndia", "bollywood", "Entrepreneur", "SkincareAddiction",
  "marketing", "fitness", "food", "technology", "gaming", "fashion",
];

export const TIKTOK_HASHTAGS: string[] = [
  "cleangirl", "grwm", "quietluxury", "koreanbeauty",
  "fitcheck", "studywithme", "contentcreator", "startupindia",
];

export const GOOGLE_TRENDS_KEYWORDS: string[] = [
  "indian fashion trends", "bollywood makeup",
  "content creator india", "instagram reels ideas",
  "youtube shorts ideas india",
];