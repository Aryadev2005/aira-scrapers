// scrapers/googleTrends.ts
// Uses Google Trends RSS — no auth, no widget tokens, no blocking
import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import type { GoogleTrendResult } from "../types/index";

const RSS_URL = "https://trends.google.com/trending/rss?geo=IN";
const LEGACY_URL = "https://trends.google.com/trends/trendingsearches/daily/rss?geo=IN";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36",
  "Accept": "application/rss+xml, application/xml, text/xml, */*",
  "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
};

export interface RssTrendItem {
  keyword:       string;
  trafficVolume: string;  // e.g. "500K+"
  approxVolume:  number;  // parsed to integer
  relatedTerms:  string[];
  newsHeadline:  string;
  newsUrl:       string;
  pubDate:       string;
}

function parseTrafficVolume(raw: string): number {
  if (!raw) return 0;
  const clean = raw.replace(/[^0-9KMB.+]/gi, "").toUpperCase();
  if (clean.includes("M")) return Math.round(parseFloat(clean) * 1_000_000);
  if (clean.includes("K")) return Math.round(parseFloat(clean) * 1_000);
  if (clean.includes("B")) return Math.round(parseFloat(clean) * 1_000_000_000);
  return parseInt(clean) || 0;
}

async function fetchFeed(url: string): Promise<RssTrendItem[]> {
  try {
    const res = await axios.get(url, {
      headers: HEADERS,
      timeout: 15_000,
      responseType: "text",
    });

    if (res.status !== 200) return [];

    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    const parsed = parser.parse(res.data as string);
    const items: any[] = parsed?.rss?.channel?.item ?? [];

    return items.map((item: any) => {
      const relatedTerms: string[] = [];
      const ht = item["ht:approx_traffic"] ?? item["ht:related_queries"]?.["ht:related_query"];
      if (Array.isArray(ht)) relatedTerms.push(...ht.map(String));
      else if (typeof ht === "string") relatedTerms.push(ht);

      const newsItem = item["ht:news_item"];
      const headline = (Array.isArray(newsItem) ? newsItem[0] : newsItem)?.["ht:news_item_title"] ?? "";
      const newsUrl  = (Array.isArray(newsItem) ? newsItem[0] : newsItem)?.["ht:news_item_url"] ?? "";

      const trafficRaw = String(item["ht:approx_traffic"] ?? item["approxTraffic"] ?? "");

      return {
        keyword:       String(item.title ?? "").trim(),
        trafficVolume: trafficRaw,
        approxVolume:  parseTrafficVolume(trafficRaw),
        relatedTerms,
        newsHeadline:  String(headline).trim(),
        newsUrl:       String(newsUrl).trim(),
        pubDate:       String(item.pubDate ?? "").trim(),
      };
    }).filter(i => i.keyword.length > 0);

  } catch (err: any) {
    console.warn(`[GT RSS] fetch failed: ${err.message}`);
    return [];
  }
}

export async function scrapeGoogleTrendsRSS(): Promise<RssTrendItem[]> {
  // Try new feed first, fallback to legacy
  let items = await fetchFeed(RSS_URL);
  if (!items.length) {
    console.warn("[GT RSS] New feed empty, trying legacy feed");
    items = await fetchFeed(LEGACY_URL);
  }
  return items;
}