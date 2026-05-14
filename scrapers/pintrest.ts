// scrapers/pinterest.ts

import chalk from "chalk";
import { buildApiHeaders } from "../core/http";
import { normalizePin } from "../normalizers/pintrest";
import { sleep, randomUA } from "../utils/helpers";
import { SCRAPE_CONFIG } from "../config/index";
import type { PinterestSession } from "../core/session";
import type { PinterestPin } from "../types/index";

const CFG = SCRAPE_CONFIG.pinterest;

// ── Internal API caller ───────────────────────────────────────────────────────

async function callAPI(
  session:  PinterestSession,
  url:      string,
  attempt:  number = 0
): Promise<Record<string, unknown>> {
  try {
    const res = await session.http.get(url, {
    headers: buildApiHeaders(
        session.userAgent,
        session.csrfToken,
        session.cookieString(),
        url
      ),
    });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    return res.data as Record<string, unknown>;
  } catch (err) {
    if (attempt < CFG.maxRetries) {
      const wait = CFG.retryDelay * (attempt + 1);
      console.log(chalk.yellow(`  ⚠ Retry ${attempt + 1}/${CFG.maxRetries} in ${wait}ms — ${(err as Error).message}`));
      await sleep(wait);
      session.userAgent = randomUA();
      return callAPI(session, url, attempt + 1);
    }
    throw err;
  }
}

function buildSearchUrl(query: string, bookmark: string | null): string {
  return `https://www.pinterest.com/resource/BaseSearchResource/get/?source_url=${
    encodeURIComponent(`/search/pins/?q=${query}`)
  }&data=${
    encodeURIComponent(JSON.stringify({
      options: {
        query,
        scope:     "pins",
        page_size: CFG.pageSize,
        ...(bookmark ? { bookmarks: [bookmark] } : {}),
      },
      context: {},
    }))
  }&_=${Date.now()}`;
}

function buildTrendingUrl(bookmark: string | null): string {
  return `https://www.pinterest.com/resource/UserHomefeedResource/get/?source_url=${
    encodeURIComponent("/")
  }&data=${
    encodeURIComponent(JSON.stringify({
      options: {
        page_size: CFG.pageSize,
        prepend:   false,
        ...(bookmark ? { bookmarks: [bookmark] } : {}),
      },
      context: {},
    }))
  }&_=${Date.now()}`;
}

function buildBoardUrl(boardUrl: string, bookmark: string | null): string {
  return `https://www.pinterest.com/resource/BoardFeedResource/get/?source_url=${
    encodeURIComponent(`/${boardUrl}/`)
  }&data=${
    encodeURIComponent(JSON.stringify({
      options: {
        board_url: `/${boardUrl}/`,
        page_size: CFG.pageSize,
        ...(bookmark ? { bookmarks: [bookmark] } : {}),
      },
      context: {},
    }))
  }&_=${Date.now()}`;
}

// ── Search ────────────────────────────────────────────────────────────────────

export async function scrapeSearch(
  session:  PinterestSession,
  query:    string,
  maxPins:  number = CFG.maxPinsPerQuery
): Promise<PinterestPin[]> {
  console.log(chalk.cyan(`\n🔍 "${query}"`));
  const pins:     PinterestPin[] = [];
  let   bookmark: string | null  = null;
  let   page    = 0;

  while (pins.length < maxPins) {
    let data: Record<string, unknown>;
    try {
      data = await callAPI(session, buildSearchUrl(query, bookmark));
    } catch (err) {
      console.log(chalk.red(`  ✗ ${(err as Error).message}`));
      break;
    }

    const response  = data?.resource_response as Record<string, unknown>;
    const dataObj   = response?.data           as Record<string, unknown>;
    const results   = (dataObj?.results        as Record<string, unknown>[]) || [];
    const nextBmark = response?.bookmark        as string | undefined;

    for (const item of results) {
      const pin = normalizePin(item);
      if (pin) pins.push(pin);
    }

    page++;
    console.log(chalk.gray(`  p${page}: +${results.length} → ${pins.length} total`));

    if (!nextBmark || nextBmark === "-end-" || results.length === 0) break;
    bookmark = nextBmark;
    await sleep(CFG.delayBetweenPages);
  }

  console.log(chalk.green(`  ✓ ${pins.length} pins`));
  return pins;
}

// ── Trending ──────────────────────────────────────────────────────────────────

export async function scrapeTrending(
  session:  PinterestSession,
  maxPins:  number = 50
): Promise<PinterestPin[]> {
  console.log(chalk.cyan(`\n🔥 Trending feed`));
  const pins:     PinterestPin[] = [];
  let   bookmark: string | null  = null;

  while (pins.length < maxPins) {
    let data: Record<string, unknown>;
    try {
      data = await callAPI(session, buildTrendingUrl(bookmark));
    } catch (err) {
      console.log(chalk.red(`  ✗ Trending: ${(err as Error).message}`));
      break;
    }

    const response  = data?.resource_response as Record<string, unknown>;
    const results   = (response?.data          as Record<string, unknown>[]) || [];
    const nextBmark = response?.bookmark        as string | undefined;

    for (const item of results) {
      const pin = normalizePin(item);
      if (pin) pins.push(pin);
    }

    console.log(chalk.gray(`  +${results.length} → ${pins.length} total`));
    if (!nextBmark || nextBmark === "-end-" || results.length === 0) break;
    bookmark = nextBmark;
    await sleep(CFG.delayBetweenPages);
  }

  console.log(chalk.green(`  ✓ ${pins.length} trending pins`));
  return pins;
}

// ── Board ─────────────────────────────────────────────────────────────────────

export async function scrapeBoard(
  session:  PinterestSession,
  boardUrl: string,
  maxPins:  number = 50
): Promise<PinterestPin[]> {
  console.log(chalk.cyan(`\n📌 Board: "${boardUrl}"`));
  const pins:     PinterestPin[] = [];
  let   bookmark: string | null  = null;

  while (pins.length < maxPins) {
    let data: Record<string, unknown>;
    try {
      data = await callAPI(session, buildBoardUrl(boardUrl, bookmark));
    } catch (err) {
      console.log(chalk.red(`  ✗ Board: ${(err as Error).message}`));
      break;
    }

    const response  = data?.resource_response as Record<string, unknown>;
    const results   = (response?.data          as Record<string, unknown>[]) || [];
    const nextBmark = response?.bookmark        as string | undefined;

    for (const item of results) {
      const pin = normalizePin(item);
      if (pin) pins.push(pin);
    }

    console.log(chalk.gray(`  +${results.length} → ${pins.length} total`));
    if (!nextBmark || nextBmark === "-end-" || results.length === 0) break;
    bookmark = nextBmark;
    await sleep(CFG.delayBetweenPages);
  }

  console.log(chalk.green(`  ✓ ${pins.length} pins`));
  return pins;
}