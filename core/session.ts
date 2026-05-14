// core/session.ts

import { writeFileSync, readFileSync, existsSync } from "fs";
import chalk from "chalk";
import type { AxiosInstance } from "axios";
import { createHttpClient } from "./http";
import { randomUA, sleep } from "../utils/helpers";
import { SCRAPE_CONFIG, PROXY_URL } from "../config/index";
import type { SessionCache } from "../types/index";
const CFG = SCRAPE_CONFIG.pinterest;

export class PinterestSession {
  cookies:   Record<string, string> = {};
  csrfToken: string                 = "";
  userAgent: string                 = randomUA();
  http!:     AxiosInstance;

  private readonly proxyUrl: string | null = PROXY_URL;

  // ── Cookie helpers ──────────────────────────────────────────────────────────

  cookieString(): string {
    return Object.entries(this.cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }

  private absorbSetCookieHeaders(headers: Record<string, unknown>): void {
    const setCookie = headers["set-cookie"];
    if (!Array.isArray(setCookie)) return;

    for (const cookieStr of setCookie) {
      const eqIdx = cookieStr.indexOf("=");
      const scIdx = cookieStr.indexOf(";");
      if (eqIdx > 0) {
        const key = cookieStr.slice(0, eqIdx).trim();
        const val = cookieStr.slice(eqIdx + 1, scIdx > 0 ? scIdx : undefined).trim();
        if (key && val) this.cookies[key] = val;
      }
    }
  }

  // ── Session cache ───────────────────────────────────────────────────────────

  private saveSession(): void {
    const data: SessionCache = {
      cookies:   this.cookies,
      csrfToken: this.csrfToken,
      userAgent: this.userAgent,
      savedAt:   Date.now(),
    };
    writeFileSync(CFG.sessionFile, JSON.stringify(data, null, 2));
    console.log(chalk.gray("  💾 Session cached → pinterest.session.json"));
  }

  private loadSession(): boolean {
    try {
      if (!existsSync(CFG.sessionFile)) return false;

      const data     = JSON.parse(readFileSync(CFG.sessionFile, "utf8")) as SessionCache;
      const ageDays  = (Date.now() - data.savedAt) / 86_400_000;

      if (ageDays > CFG.sessionMaxAgeDays) {
        console.log(chalk.yellow(`  ⚠ Session expired (${ageDays.toFixed(1)}d) — re-logging in`));
        return false;
      }

      this.cookies   = data.cookies;
      this.csrfToken = data.csrfToken;
      this.userAgent = data.userAgent;
      console.log(chalk.green(`✓ Cached session loaded (${ageDays.toFixed(1)}d old) — skipping login`));
      return true;
    } catch {
      return false;
    }
  }

  // ── Init ────────────────────────────────────────────────────────────────────

  async init(): Promise<void> {
    console.log(chalk.blue("▶ Initialising Pinterest session..."));

    if (this.proxyUrl) {
      console.log(chalk.gray(`  Proxy: ${this.proxyUrl.replace(/:[^:@]+@/, ":***@")}`));
    }

    if (this.loadSession()) {
      this.http = createHttpClient(this.userAgent, this.proxyUrl);
      return;
    }

    this.http = createHttpClient(this.userAgent, this.proxyUrl);
    await this.freshLogin();
  }

  private async freshLogin(): Promise<void> {
    const email    = process.env.PINTEREST_EMAIL;
    const password = process.env.PINTEREST_PASSWORD;

    if (!email || !password) {
      throw new Error("PINTEREST_EMAIL and PINTEREST_PASSWORD must be set in .env");
    }

    // Step 1 — homepage → csrftoken
    console.log(chalk.blue("▶ Getting Pinterest homepage..."));
    await sleep(3000 + Math.random() * 2000);

    const homeRes = await this.http.get("https://www.pinterest.com/", {
      headers: {
        "User-Agent":      this.userAgent,
        Accept:            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Fetch-Dest":  "document",
        "Sec-Fetch-Mode":  "navigate",
        "Sec-Fetch-Site":  "none",
      },
    });

    this.absorbSetCookieHeaders(homeRes.headers as Record<string, unknown>);

    this.csrfToken =
      this.cookies["csrftoken"] ||
      (homeRes.data as string)?.match(/"csrftoken"\s*:\s*"([^"]+)"/)?.[1] ||
      "";

    if (!this.csrfToken) throw new Error("Could not extract csrftoken from homepage");

    // Step 2 — login
    console.log(chalk.blue(`▶ Logging in as ${email}...`));
    await sleep(1500 + Math.random() * 1000);

    const loginRes = await this.http.post(
      "https://www.pinterest.com/resource/UserSessionResource/create/",
      new URLSearchParams({
        source_url: "/login/",
        data: JSON.stringify({
          options: { username_or_email: email, password },
          context: {},
        }),
      }).toString(),
      {
        headers: {
          "User-Agent":       this.userAgent,
          "Content-Type":     "application/x-www-form-urlencoded",
          Accept:             "application/json, text/javascript, */*, q=0.01",
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRFToken":      this.csrfToken,
          "X-APP-VERSION":    "a17b1e8",
          Referer:            "https://www.pinterest.com/login/",
          Origin:             "https://www.pinterest.com",
          Cookie:             this.cookieString(),
        },
      }
    );

    this.absorbSetCookieHeaders(loginRes.headers as Record<string, unknown>);

    const loginData = loginRes.data as Record<string, unknown>;
    const resError  = (loginData?.resource_response as Record<string, unknown>)?.error;
    if (resError) {
      throw new Error(`Login failed: ${(resError as Record<string, string>).message}`);
    }

    this.csrfToken = this.cookies["csrftoken"] || this.csrfToken;
    console.log(chalk.green(`✓ Logged in — cookies: ${Object.keys(this.cookies).join(", ")}`));

    this.saveSession();
  }
}