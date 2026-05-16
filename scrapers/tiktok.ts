// scrapers/tiktok.ts
// ══════════════════════════════════════════════════════════════════════════════
// TikTok Creative Center scraper — via tiktok-discover-api.vercel.app proxy
//
// Working endpoints (as of 2026-05-16):
//   GET /api?endpoint=getTrendingSongs    → data.sound_list[]  (20 trending sounds)
//   GET /api?endpoint=getTrendingCreators → data.creators[]    (20 creators × 3 videos)
//
// Broken endpoints (proxy returns {}):
//   GET /api?endpoint=getTrendingHastag   → {} (tried, logged, handled gracefully)
//   GET /api?endpoint=getTrendingVideos   → {} (same)
//
// No auth. No proxy. No signing. Works from any IP.
// ══════════════════════════════════════════════════════════════════════════════

import axios from "axios";
import chalk from "chalk";
import { SCRAPE_CONFIG } from "../config/index";
import type { TikTokVideo } from "../types/index";

const CFG = SCRAPE_CONFIG.tiktok;
const API_BASE = "https://tiktok-discover-api.vercel.app/api";

const http = axios.create({
  timeout: 20_000,
  headers: {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept":     "application/json",
  },
});

// ── Response interfaces ───────────────────────────────────────────────────────

interface CCHashtag {
  hashtag_id:     string;
  hashtag_name:   string;
  video_views:    number;
  publish_cnt:    number;
  rank:           number;
  rank_diff?:     number | null;
  rank_diff_type: number;
  country_info?:  { id: string; value: string };
}

interface CCSong {
  song_id:        string;
  clip_id:        string;
  title:          string;
  author:         string;
  rank:           number;
  rank_diff?:     number | null;
  rank_diff_type: number;
  cover:          string;
  duration:       number;
  link:           string;
  url_title:      string;
  country_code:   string;
}

interface CCCreatorItem {
  item_id:     string;
  cover_url:   string;
  tt_link:     string;
  vv:          number;
  liked_cnt:   number;
  create_time: number;
}

interface CCCreator {
  nick_name:    string;
  tt_link:      string;
  follower_cnt: number;
  country_code: string;
  items:        CCCreatorItem[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractHandle(ttLink: string): string {
  const match = ttLink.match(/@([^/]+)/);
  return match ? `@${match[1]}` : "";
}

function rankLabel(rankDiffType: number, rankDiff?: number | null): string {
  if (rankDiffType === 1) return `↑${rankDiff ?? ""} rising`;
  if (rankDiffType === 2) return "→ stable";
  if (rankDiffType === 3) return `↓${rankDiff ?? ""} falling`;
  return "★ new";
}

// ── Fetch functions ───────────────────────────────────────────────────────────

async function fetchHashtags(): Promise<TikTokVideo[]> {
  try {
    const resp = await http.get(API_BASE, {
      params: { endpoint: "getTrendingHastag" },
    });
    console.log(chalk.gray(`    [debug] hashtags status: ${resp.status} | body: ${JSON.stringify(resp.data).slice(0, 150)}`));
    console.log(chalk.gray(`    [debug] list length: ${resp.data?.data?.list?.length ?? "N/A"}`));

    const list: CCHashtag[] = resp.data?.data?.list || [];
    console.log(chalk.gray(`  [cc] hashtags: ${list.length} items${list.length === 0 ? " (endpoint currently unavailable)" : ""}`));

    return list.map(h => ({
      tiktok_id:         `cc_hashtag_${h.hashtag_id}`,
      description:       `#${h.hashtag_name} | ${h.video_views.toLocaleString()} views | ${h.publish_cnt.toLocaleString()} posts | rank #${h.rank} | ${rankLabel(h.rank_diff_type, h.rank_diff)}`,
      creator_handle:    "",
      creator_name:      "",
      creator_followers: 0,
      views:             h.video_views,
      likes:             0,
      comments:          0,
      shares:            0,
      saves:             h.publish_cnt,
      engagement_rate:   0,
      sound_name:        "",
      sound_artist:      "",
      hashtags:          [h.hashtag_name.toLowerCase()],
      video_url:         "",
      thumbnail_url:     "",
      duration:          0,
      source_hashtag:    h.hashtag_name.toLowerCase(),
    }));
  } catch (err: any) {
    console.log(chalk.yellow(`  [cc] hashtags error: ${err?.message}`));
    return [];
  }
}

async function fetchSongs(): Promise<TikTokVideo[]> {
  try {
    const resp = await http.get(API_BASE, {
      params: { endpoint: "getTrendingSongs" },
    });

    const list: CCSong[] = resp.data?.data?.sound_list || [];
    console.log(chalk.gray(`  [cc] songs: ${list.length} items`));

    return list.map(s => ({
      tiktok_id:         `cc_song_${s.song_id}`,
      description:       `"${s.title}" by ${s.author} | rank #${s.rank} | ${rankLabel(s.rank_diff_type, s.rank_diff)} | ${s.country_code}`,
      creator_handle:    "",
      creator_name:      s.author,
      creator_followers: 0,
      views:             0,
      likes:             0,
      comments:          0,
      shares:            0,
      saves:             0,
      engagement_rate:   0,
      sound_name:        s.title,
      sound_artist:      s.author,
      hashtags:          [],
      video_url:         s.link,
      thumbnail_url:     s.cover,
      duration:          s.duration,
      source_hashtag:    `song_${s.url_title.toLowerCase()}`,
    }));
  } catch (err: any) {
    console.log(chalk.yellow(`  [cc] songs error: ${err?.message}`));
    return [];
  }
}

async function fetchCreatorVideos(): Promise<TikTokVideo[]> {
  try {
    const resp = await http.get(API_BASE, {
      params: { endpoint: "getTrendingCreators" },
    });

    const creators: CCCreator[] = resp.data?.data?.creators || [];
    const videos: TikTokVideo[] = [];

    for (const creator of creators) {
      const handle   = extractHandle(creator.tt_link || "");
      const name     = creator.nick_name || "";
      const followers = creator.follower_cnt || 0;
      for (const item of (creator.items || [])) {
        const vv     = item.vv      || 0;
        const liked  = item.liked_cnt || 0;
        videos.push({
          tiktok_id:         `cc_video_${item.item_id}`,
          description:       `${handle} (${name}) | ${vv.toLocaleString()} views | ${liked.toLocaleString()} likes | ${followers.toLocaleString()} followers`,
          creator_handle:    handle,
          creator_name:      name,
          creator_followers: followers,
          views:             vv,
          likes:             liked,
          comments:          0,
          shares:            0,
          saves:             0,
          engagement_rate:   followers > 0 ? Math.min(1, liked / followers) : 0,
          sound_name:        "",
          sound_artist:      "",
          hashtags:          [],
          video_url:         item.tt_link   || "",
          thumbnail_url:     item.cover_url || "",
          duration:          0,
          source_hashtag:    `creator_${name.toLowerCase().replace(/\s+/g, "_")}`,
        });
      }
    }

    console.log(chalk.gray(`  [cc] videos: ${videos.length} items (from ${creators.length} trending creators)`));
    return videos;
  } catch (err: any) {
    console.log(chalk.yellow(`  [cc] creators error: ${err?.message}`));
    return [];
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function scrapeTikTokHashtag(
  hashtag: string,
  _maxVideos: number = CFG.maxVideosPerTag,
): Promise<TikTokVideo[]> {
  const tag = hashtag.replace(/^#/, "").trim();
  console.log(chalk.cyan(`\n🎵 #${tag} — individual lookup not supported; use scrapeTikTokTrending`));
  return [];
}

export async function scrapeTikTokHashtags(
  _hashtags: string[],
  _maxVideosPerTag: number = CFG.maxVideosPerTag,
  _onResult?: (hashtag: string, videos: TikTokVideo[]) => Promise<void>,
): Promise<TikTokVideo[]> {
  console.log(chalk.gray("  Hashtag list is reference-only — all data comes from CC trending endpoints"));
  return [];
}

export async function scrapeTikTokTrending(): Promise<TikTokVideo[]> {
  console.log(chalk.cyan("\n🔥 TikTok Trending (Creative Center)"));

  const [hashtags, songs, creatorVideos] = await Promise.all([
    fetchHashtags(),
    fetchSongs(),
    fetchCreatorVideos(),
  ]);

  const all: TikTokVideo[] = [];
  const seen = new Set<string>();

  for (const v of [...hashtags, ...creatorVideos, ...songs]) {
    if (!seen.has(v.tiktok_id)) {
      seen.add(v.tiktok_id);
      all.push(v);
    }
  }

  if (all.length > 0) {
    console.log(chalk.green(`  ✓ ${all.length} total entries`));
    const top3 = [...all].sort((a, b) => b.views - a.views).slice(0, 3);
    top3.forEach(v =>
      console.log(chalk.gray(`    ${v.description.slice(0, 90)}`))
    );
  } else {
    console.log(chalk.red("  ✗ 0 results — proxy may be down"));
  }

  return all;
}
