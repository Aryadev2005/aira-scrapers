// scrapers/pintrest.ts — Playwright version

import chalk from "chalk";
import { chromium } from "playwright";
import { normalizePin } from "../normalizers/pinterest";
import { SCRAPE_CONFIG } from "../config/index";
import type { PinterestPin } from "../types/index";
import type { PinterestSession } from "../core/session";

const CFG = SCRAPE_CONFIG.pinterest;

// ── Pin enrichment via PinResource API ───────────────────────────────────────

async function enrichPinsWithSaves(
  page: any,
  pins: PinterestPin[]
): Promise<void> {
  console.log(chalk.gray(`  enriching ${pins.length} pins with save counts...`));
  for (const pin of pins) {
    try {
      const pinId = pin.pin_id;
      const saves = await page.evaluate((id: string) => {
        return new Promise<number>((resolve) => {
          const url = `https://www.pinterest.com/resource/PinResource/get/?source_url=/pin/${id}/&data=${encodeURIComponent(JSON.stringify({
            options: { id, field_set_key: "detailed" },
            context: {}
          }))}&_=${Date.now()}`;
          const xhr = new XMLHttpRequest();
          xhr.open("GET", url);
          xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
          xhr.setRequestHeader("Accept", "application/json, text/javascript, */*, q=0.01");
          xhr.withCredentials = true;
          xhr.onload = () => {
            try {
              const json = JSON.parse(xhr.responseText);
              console.log("PIN_DETAIL_RAW:", JSON.stringify(json?.resource_response?.data?.aggregated_pin_data || json?.resource_response?.error || "empty", null, 2).slice(0, 300));
              resolve(Number(
                json?.resource_response?.data?.aggregated_pin_data?.aggregated_stats?.saves || 0
              ));
            } catch { resolve(0); }
          };
          xhr.onerror = () => resolve(0);
          xhr.send();
        });
      }, pinId);

      if (saves > 0) {
        pin.saves = saves;
        console.log(chalk.gray(`    pin ${pinId} → ${saves} saves`));
      }
    } catch (err) {
      console.log(chalk.yellow(`    pin ${pin.pin_id} evaluate error: ${(err as Error).message}`));
    }
    await new Promise(r => setTimeout(r, 300));
  }
}

// ── Core scrape via Playwright ────────────────────────────────────────────────

async function scrapeWithPlaywright(
  url: string,
  query: string,
  maxPins: number,
  cookieString: string
): Promise<PinterestPin[]> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    extraHTTPHeaders: {
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  // Inject cookies from session file
  const cookies = cookieString.split("; ").map((pair) => {
    const [name, ...rest] = pair.split("=");
    return {
      name: name.trim(),
      value: rest.join("=").trim(),
      domain: ".pinterest.com",
      path: "/",
    };
  });
  await context.addCookies(cookies);

  const pins: PinterestPin[] = [];
  const seenIds = new Set<string>();

  const page = await context.newPage();

  // TEMP: forward browser console PIN_DETAIL logs to terminal
  page.on("console", (msg: any) => {
    if (msg.text().startsWith("PIN_DETAIL")) {
      console.log("BROWSER:", msg.text().slice(0, 300));
    }
  });

  // Intercept API responses that contain pin data
  page.on("response", async (response) => {
  const respUrl = response.url();
  if (
    respUrl.includes("pinterest.com/resource/") &&
    respUrl.includes("get/") &&
    pins.length < maxPins
  ) {
    try {
      const json = await response.json();
      const resourceResponse = json?.resource_response;
      if (!resourceResponse) return;

      const results =
        resourceResponse?.data?.results ||
        resourceResponse?.data ||
        [];

      const items = Array.isArray(results) ? results : [];
      for (const item of items) {
        if (pins.length >= maxPins) break;

        // Skip UI junk
        const type = (item as any).type;
        if (type === "filter" || type === "story" || type === "search") continue;

        // Must have an actual pin id
        const id = String((item as any).id || (item as any).pin_id || "");
        if (!id || seenIds.has(id)) continue;

        const pin = normalizePin(item as Record<string, unknown>);
        if (pin) {
          seenIds.add(id);
          pins.push(pin);
        }
      }
      if (items.length > 0) {
        console.log(chalk.gray(`  intercepted ${items.length} items → ${pins.length} total`));
      }
    } catch {
      // not JSON — skip
    }
  }
});

  try {
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3000);

  // Scroll to trigger more pin loads
  let scrolls = 0;
  while (pins.length < maxPins && scrolls < 10) {
    await page.mouse.wheel(0, 2000);
    await page.waitForTimeout(1500);
    scrolls++;
    console.log(chalk.gray(`  scroll ${scrolls} → ${pins.length} pins so far`));
  }

  await enrichPinsWithSaves(page, pins);

} catch (err) {
  console.log(chalk.yellow(`  ⚠ Page load issue: ${(err as Error).message}`));
}

await browser.close();
return pins;}
// ── Search ────────────────────────────────────────────────────────────────────

export async function scrapeSearch(
  session: PinterestSession,
  query: string,
  maxPins: number = CFG.maxPinsPerQuery
): Promise<PinterestPin[]> {
  console.log(chalk.cyan(`\n🔍 "${query}"`));
  const url = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}&rs=typed`;
  const pins = await scrapeWithPlaywright(url, query, maxPins, session.cookieString());
  console.log(chalk.green(`  ✓ ${pins.length} pins`));
  return pins;
}

// ── Trending ──────────────────────────────────────────────────────────────────

export async function scrapeTrending(
  session: PinterestSession,
  maxPins: number = 50
): Promise<PinterestPin[]> {
  console.log(chalk.cyan(`\n🔥 Trending feed`));
  const url = "https://www.pinterest.com/";
  const pins = await scrapeWithPlaywright(url, "trending", maxPins, session.cookieString());
  console.log(chalk.green(`  ✓ ${pins.length} trending pins`));
  return pins;
}

// ── Board ─────────────────────────────────────────────────────────────────────

export async function scrapeBoard(
  session: PinterestSession,
  boardUrl: string,
  maxPins: number = 50
): Promise<PinterestPin[]> {
  console.log(chalk.cyan(`\n📌 Board: "${boardUrl}"`));
  const url = `https://www.pinterest.com/${boardUrl}/`;
  const pins = await scrapeWithPlaywright(url, boardUrl, maxPins, session.cookieString());
  console.log(chalk.green(`  ✓ ${pins.length} pins`));
  return pins;
}