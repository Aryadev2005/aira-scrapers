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
  savedAt:   number;
}

export type ScraperSource = "pinterest" | "reddit" | "tiktok" | "googleTrends";