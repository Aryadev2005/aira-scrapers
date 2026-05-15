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
  context: any,         // BrowserContext, not page
  pins: PinterestPin[]
): Promise<void> {
  console.log(chalk.gray(`  enriching ${pins.length} pins with save counts...`));

  for (const pin of pins) {
    const pinPage = await context.newPage();
    let resolved = false;

    try {
      // Set up response listener BEFORE navigating
      const savePromise = new Promise<number>((resolve) => {
        pinPage.on("response", async (response: any) => {
          const url = response.url();
          // Pinterest fires CloseupResource or PinResource when a pin page loads
          if (
            url.includes("resource/PinResource/get") ||
            url.includes("resource/CloseupResource/get") ||
            url.includes(`/v3/pins/${pin.pin_id}`)
          ) {
            try {
              const json = await response.json();
              const data = json?.resource_response?.data;

              // Log fields on first pin
              if (pins.indexOf(pin) === 0) {
                console.log(chalk.yellow(`  🔍 pin page keys: ${Object.keys(data || {}).join(", ")}`));
                console.log(chalk.yellow(`  🔍 repin_count=${data?.repin_count}, agg_saves=${data?.aggregated_pin_data?.aggregated_stats?.saves}`));
              }

              const saves = Number(
                data?.repin_count ||
                data?.aggregated_pin_data?.aggregated_stats?.saves ||
                0
              );
              if (!resolved) {
                resolved = true;
                resolve(saves);
              }
            } catch {
              // not the response we want
            }
          }
        });

        // Timeout fallback — resolve 0 after 8s
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve(0);
          }
        }, 12000);
      });

      // Navigate to the actual pin page
      await pinPage.goto(`https://www.pinterest.com/pin/${pin.pin_id}/`, {
        waitUntil: "domcontentloaded",
        timeout: 12000,
      });

      const saves = await savePromise;
      if (saves > 0) {
        pin.saves = saves;
        console.log(chalk.green(`    pin ${pin.pin_id} → ${saves} saves`));
      } else {
        console.log(chalk.gray(`    pin ${pin.pin_id} → 0 saves`));
      }

    } catch (err) {
      console.log(chalk.yellow(`    pin ${pin.pin_id} error: ${(err as Error).message}`));
    } finally {
      await pinPage.close();
    }

    await new Promise(r => setTimeout(r, 600)); // 600ms between pins
  }
}

// ── Core scrape via Playwright ────────────────────────────────────────────────

async function scrapeWithPlaywright(
  url: string,
  query: string,
  maxPins: number,
  cookieString: string,
  csrfToken: string
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
  const savesCache = new Map<string, number>();

  const page = await context.newPage();

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
      // TEMP DEBUG — log raw fields from first batch containing a real pin
      if (items.length > 0 && pins.length === 0) {
        const sample = items.find((i: any) => i?.id || i?.pin_id);
        if (sample) {
          console.log("🔍 RAW SAMPLE FIELDS:", JSON.stringify({
            id: sample.id,
            repin_count: sample.repin_count,
            save_count: sample.save_count,
            saves: sample.saves,
            aggregated_pin_data: sample.aggregated_pin_data,
            type: sample.type,
            _all_keys: Object.keys(sample),
          }, null, 2));
        }
      }
      for (const item of items) {
        if (pins.length >= maxPins) break;

        // Skip UI junk
        const type = (item as any).type;
        if (type === "filter" || type === "story" || type === "search" || type === "conversation") continue;

        // Must have an actual pin id
        const id = String((item as any).id || (item as any).pin_id || "");
        if (!id || seenIds.has(id)) continue;
        if (!/^\d+$/.test(id)) continue;
        // repin_count is Pinterest's saves field in feed responses
        const saves = Number(
          (item as any).repin_count ||
          (item as any).aggregated_pin_data?.aggregated_stats?.saves ||
          (item as any).save_count ||
          0
        );
        if (saves > 0) savesCache.set(id, saves);

        const pin = normalizePin(item as Record<string, unknown>);
        if (pin) {
          pin.saves = savesCache.get(id) || 0;
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

  await enrichPinsWithSaves(context, pins);

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
  const pins = await scrapeWithPlaywright(url, query, maxPins, session.cookieString(), session.csrfToken);
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
  const pins = await scrapeWithPlaywright(url, "trending", maxPins, session.cookieString(), session.csrfToken);
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
  const pins = await scrapeWithPlaywright(url, boardUrl, maxPins, session.cookieString(), session.csrfToken);
  console.log(chalk.green(`  ✓ ${pins.length} pins`));
  return pins;
}