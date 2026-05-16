// scrapers/googleTrends.ts
// ══════════════════════════════════════════════════════════════════════════════
// Google Trends scraper — direct widgetdata/multiline endpoint
//
// NO headless browser. NO Apify. Pure axios → JSON.
// Proxy is optional: works without one at low volume for local testing.
// When DataImpulse is configured, each request rotates a fresh residential IP.
//
// Flow per keyword:
//   Step 1 — /trends/explore   → fetch widget tokens (csrf + token per widget)
//   Step 2 — /trends/api/widgetdata/multiline → interest over time (timeline)
//   Step 3 — /trends/api/widgetdata/relatedsearches → related queries + topics
// ══════════════════════════════════════════════════════════════════════════════

import axios, { type AxiosInstance } from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import chalk from "chalk";
import { SCRAPE_CONFIG, PROXY_URL } from "../config/index";
import type {
  KeywordEntry,
  GoogleTrendResult,
  RelatedQuery,
  RelatedTopic,
  TrendDataPoint,
} from "../types/index";

// ── Constants ─────────────────────────────────────────────────────────────────

const GT_BASE        = "https://trends.google.com";
const TIMELINE_PATH  = "/trends/api/widgetdata/multiline";
const RELATED_PATH   = "/trends/api/widgetdata/relatedsearches";
const CFG            = SCRAPE_CONFIG.googleTrends;

// Google Trends strips the leading ")]}'\n" from JSON responses as XSSI guard
const XSSI_PREFIX    = ")]}',\n";

// ── Proxy session rotation ────────────────────────────────────────────────────
// DataImpulse format: http://user-USERNAME-session-SESSIONID:PASSWORD@gate.dataimpulse.com:823
// We replace the literal string "SESSION" with a random ID per request.

function randomSessionId(): string {
  return Math.random().toString(36).slice(2, 12);
}

// ── Jitter delay ──────────────────────────────────────────────────────────────

function jitter(minMs: number, maxMs: number): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(r => setTimeout(r, ms));
}

// ── Axios instance factory ────────────────────────────────────────────────────

function buildProxyAgent(_sessionId: string): HttpsProxyAgent<string> | null {
  if (!PROXY_URL) return null;
  try {
    // DataImpulse rotates IP per connection automatically — no session suffix needed
    console.log(`[DEBUG] Proxy agent connecting to DataImpulse gateway`);
    return new HttpsProxyAgent(PROXY_URL);
  } catch (err: any) {
    console.error(`[DEBUG] Proxy agent build failed: ${err.message}`);
    return null;
  }
}

function buildClient(sessionId: string): AxiosInstance {
  const agent = buildProxyAgent(sessionId);

  return axios.create({
    baseURL:    GT_BASE,
    timeout:    20_000,
    proxy:      false,          // MUST be false — disables axios built-in proxy handling
    httpAgent:  agent ?? undefined,
    httpsAgent: agent ?? undefined,
    headers: {
      "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      "User-Agent":      pickUserAgent(),
      "Referer":         "https://trends.google.com/trends/",
      "Cache-Control":   "no-cache",
    },
    validateStatus: () => true,
  });
}

// ── User-agent pool ───────────────────────────────────────────────────────────

const USER_AGENTS = [
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 14; Samsung Galaxy S23) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
];

function pickUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// ── XSSI guard strip ──────────────────────────────────────────────────────────

function stripXSSI(raw: string): string {
  if (raw.startsWith(XSSI_PREFIX)) return raw.slice(XSSI_PREFIX.length);
  if (raw.startsWith(")]}',")) return raw.slice(")]}',".length).trimStart();
  return raw;
}

// ── Step 1: Fetch explore page to get widget tokens ───────────────────────────

interface WidgetToken {
  timelineToken:  string | null;
  relatedToken:   string | null;
  csrfToken:      string;
}

async function fetchWidgetTokens(
  client: AxiosInstance,
  keyword: string,
  geo: string,
  timeRange: string,
): Promise<WidgetToken | null> {
  try {
    const req = JSON.stringify({
      comparisonItem: [{ keyword, geo, time: timeRange }],
      category: 0,
      property: "",
    });

    const params = new URLSearchParams({
      hl:  "en-IN",
      tz:  "-330",
      req: req,
    });

    // Hit the JSON API endpoint — NOT the HTML explore page
    const res = await client.get(
      `/trends/api/explore?${params.toString()}`,
    );

    console.log(`[DEBUG] explore API status: ${res.status}, length: ${String(res.data).length}`);

    if (res.status === 429) {
      console.log(`[DEBUG] 429 body:`, String(res.data).slice(0, 200));
      throw new Error("RATE_LIMITED");
    }
    if (res.status !== 200) {
      throw new Error(`HTTP ${res.status}`);
    }

    const raw  = stripXSSI(res.data as string);
    const json = JSON.parse(raw);

    const widgets: any[] = json.widgets ?? [];
    console.log(`[DEBUG] widgets found: ${widgets.length}, ids: ${widgets.map((w:any) => w.id).join(", ")}`);

    let timelineToken: string | null = null;
    let relatedToken:  string | null = null;
    const csrfToken = "APP";

    for (const w of widgets) {
      if (w.id === "TIMESERIES" && w.token)         timelineToken = w.token;
      if (w.id === "RELATED_QUERIES" && w.token)    relatedToken  = w.token;
    }

    return { timelineToken, relatedToken, csrfToken };
  } catch (err: any) {
    if (err.message === "RATE_LIMITED") throw err;
    console.error(`[DEBUG] explore API error: ${err.message}`);
    return null;
  }
}

// ── Step 2: Fetch interest-over-time timeline ─────────────────────────────────

async function fetchTimeline(
  client: AxiosInstance,
  token: string,
  keyword: string,
  geo: string,
  timeRange: string,
  csrfToken: string,
): Promise<TrendDataPoint[]> {
  try {
    const req = JSON.stringify({
      time:          timeRange,
      resolution:    "HOUR",
      locale:        "en-IN",
      comparisonItem: [{ geo, complexKeywordsRestriction: { keyword: [{ type: "BROAD", value: keyword }] } }],
      requestOptions: { property: "", backend: "IZG", category: 0 },
    });

    const params = new URLSearchParams({
      hl:      "en-IN",
      tz:      "-330",   // IST offset
      req:     req,
      token:   token,
    });

    const res = await client.get(`${TIMELINE_PATH}?${params.toString()}`, {
      headers: { "X-Client-Data": csrfToken },
    });

    if (res.status !== 200) return [];

    const raw  = stripXSSI(res.data as string);
    const json = JSON.parse(raw);

    const points: any[] =
      json?.default?.timelineData ?? [];

    return points
      .filter((p: any) => p?.value?.[0] !== undefined)
      .map((p: any) => ({
        date:  p.formattedTime ?? p.formattedAxisTime ?? "",
        value: Number(p.value[0]),
      }));
  } catch {
    return [];
  }
}

// ── Step 3: Fetch related queries and topics ──────────────────────────────────

interface RelatedData {
  relatedQueries: RelatedQuery[];
  relatedTopics:  RelatedTopic[];
}

async function fetchRelated(
  client:    AxiosInstance,
  token:     string,
  keyword:   string,
  geo:       string,
  timeRange: string,
  csrfToken: string,
): Promise<RelatedData> {
  const empty: RelatedData = { relatedQueries: [], relatedTopics: [] };

  try {
    const req = JSON.stringify({
      restriction: {
        geo:         { country: geo },
        time:        timeRange,
        originalTimeRangeForExploreUrl: timeRange,
        complexKeywordsRestriction: { keyword: [{ type: "BROAD", value: keyword }] },
      },
      keywordType:     "QUERY",
      metric:          ["TOP", "RISING"],
      trendinessSettings: { compareTime: "" },
      requestOptions:  { property: "", backend: "IZG", category: 0 },
      language:        "en",
    });

    const params = new URLSearchParams({
      hl:    "en-IN",
      tz:    "-330",
      req:   req,
      token: token,
    });

    const res = await client.get(`${RELATED_PATH}?${params.toString()}`, {
      headers: { "X-Client-Data": csrfToken },
    });

    if (res.status !== 200) return empty;

    const raw  = stripXSSI(res.data as string);
    const json = JSON.parse(raw);

    const ranked: any[]  = json?.default?.rankedList ?? [];

    const relatedQueries: RelatedQuery[] = [];
    const relatedTopics:  RelatedTopic[]  = [];

    for (const list of ranked) {
      const items: any[] = list?.rankedKeyword ?? [];
      for (const item of items) {
        const isBreakout = item.value === 0 && item.formattedValue === "Breakout";
        const val        = isBreakout ? 101 : Number(item.value ?? 0);

        if (item.topic) {
          relatedTopics.push({
            topic:            item.topic?.title ?? item.query ?? "",
            value:            val,
            isRisingBreakout: isBreakout,
          });
        } else {
          relatedQueries.push({
            query:            item.query ?? "",
            value:            val,
            isRisingBreakout: isBreakout,
          });
        }
      }
    }

    return {
      relatedQueries: relatedQueries.slice(0, 15),
      relatedTopics:  relatedTopics.slice(0, 15),
    };
  } catch {
    return empty;
  }
}

// ── Compute interest score from timeline ──────────────────────────────────────

function computeScores(timeline: TrendDataPoint[]): {
  interestScore: number;
  peakScore:     number;
  breakout:      boolean;
} {
  if (!timeline.length) {
    return { interestScore: 0, peakScore: 0, breakout: false };
  }

  const values       = timeline.map(p => p.value);
  const latest       = values[values.length - 1] ?? 0;
  const peak         = Math.max(...values);
  const breakout     = peak >= CFG.breakoutThreshold;

  return {
    interestScore: latest,
    peakScore:     peak,
    breakout,
  };
}

// ── Main: scrape single keyword with retry ────────────────────────────────────

export async function scrapeKeyword(
  entry: KeywordEntry,
): Promise<GoogleTrendResult | null> {
  const { keyword, niche: _niche } = entry;
  const geo       = CFG.geo;
  const timeRange = CFG.timeRange;

  let lastError: string = "";

  for (let attempt = 1; attempt <= CFG.maxRetries; attempt++) {
    const sessionId = randomSessionId();
    const client    = buildClient(sessionId);

    try {
      // Step 1: widget tokens
      const tokens = await fetchWidgetTokens(client, keyword, geo, timeRange);
      console.log(`[DEBUG] ${keyword} — tokens:`, JSON.stringify(tokens));

      if (!tokens) {
        lastError = "no widget tokens";
        if (attempt < CFG.maxRetries) {
          await jitter(CFG.retryBaseMs, CFG.retryBaseMs * 2);
          continue;
        }
        return null;
      }

      // Step 2: timeline (only if we have the token)
      const timeline = tokens.timelineToken
        ? await fetchTimeline(client, tokens.timelineToken, keyword, geo, timeRange, tokens.csrfToken)
        : [];
      console.log(`[DEBUG] ${keyword} — timeline length: ${timeline.length}, sample:`, timeline.slice(0, 3));

      const { interestScore, peakScore, breakout } = computeScores(timeline);
      console.log(`[DEBUG] ${keyword} — interestScore: ${interestScore}, peakScore: ${peakScore}, breakout: ${breakout}, threshold: ${CFG.interestThreshold}`);

      // Skip keywords with no interest — saves DB writes
      if (interestScore < CFG.interestThreshold && !breakout) {
        return null; // caller will count as "skipped"
      }

      // Step 3: related (only if interest is meaningful)
      const related = tokens.relatedToken
        ? await fetchRelated(client, tokens.relatedToken, keyword, geo, timeRange, tokens.csrfToken)
        : { relatedQueries: [], relatedTopics: [] };

      const today = new Date().toISOString().split("T")[0];

      return {
        keyword,
        geo,
        interestScore,
        peakScore,
        breakout,
        relatedQueries:  related.relatedQueries,
        relatedTopics:   related.relatedTopics,
        timelineData:    timeline,
        trendDate:       today,
      };
    } catch (err: any) {
      lastError = err.message ?? "unknown";

      if (err.message === "RATE_LIMITED" || err.message === "CAPTCHA_BLOCK") {
        // Exponential backoff
        const backoff = CFG.retryBaseMs * Math.pow(2, attempt - 1);
        console.warn(chalk.yellow(`  [GT] ${keyword} — ${err.message}, backing off ${backoff}ms`));
        await jitter(backoff, backoff * 1.5);
        continue;
      }

      // Non-retriable error
      break;
    }
  }

  console.error(chalk.red(`  [GT] ${keyword} — failed after ${CFG.maxRetries} attempts: ${lastError}`));
  return null;
}