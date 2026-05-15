// types/index.ts
// ── Shared types across all scrapers ─────────────────────────────────────────

export interface PinterestPin {
  pin_id:           string;
  title:            string;
  description:      string;
  image_url:        string;
  image_url_236:    string;
  image_url_474:    string;
  image_url_736:    string;
  pin_url:          string;
  board_name:       string;
  board_owner:      string;
  pinner_username:  string;
  pinner_followers: number;
  saves:            number;
  clicks:           number;
  hashtags:         string[];
  pin_type:         string;
  dominant_color:   string;
  created_at:       string | null;
}

export interface UpsertResult {
  inserted: number;
  updated:  number;
  errors:   number;
}

export interface DBTableStats {
  total_pins:       string;
  pins_with_saves:  string;
  scraped_last_24h: string;
  active_pins:      string;
  last_scraped:     Date;
  avg_saves:        string;
}

export interface SessionCache {
  cookies:   Record<string, string>;
  csrfToken: string;
  userAgent: string;
  appVersion: string;
  savedAt:   number;
}

export type ScraperSource = "pinterest" | "reddit" | "tiktok" | "googleTrends";
// ── Reddit ────────────────────────────────────────────────────────────────────

export interface RedditPost {
  post_id:      string;
  subreddit:    string;
  niche:        string;
  tier:         string;
  title:        string;
  score:        number;
  upvote_ratio: number;
  num_comments: number;
  url:          string;
  author:       string;
  flair:        string;
  age_hours:    number;
  velocity:     number;
  is_breakout:  boolean;
  feed:         string;
  expires_at:   Date;
  raw_data:     object;
}

export interface RedditResult {
  inserted:         number;
  updated:          number;
  errors:           number;
  subredditsOk:     number;
  subredditsFailed: number;
  skippedCache:     number;
  durationMs:       number;
}

export interface RedditTableStats {
  total_posts:       string;
  posts_with_score:  string;
  scraped_last_24h:  string;
  active_posts:      string;
  last_scraped:      Date;
  avg_velocity:      string;
}

export interface SubredditEntry {
  name:  string;
  tier:  "A" | "B" | "C";
  niche: string;
}