// utils/helpers.ts

export const sleep = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms + Math.random() * 400));

const USER_AGENTS: string[] = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1",
];

export const randomUA = (): string =>
  USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

export const extractHashtags = (text: string = ""): string[] =>
  [...new Set(
    (text.match(/#[\w]+/g) || []).map((h) => h.replace("#", "").toLowerCase())
  )];

export interface ProxyConfig {
  protocol: string;
  host:     string;
  port:     number;
  auth?:    { username: string; password: string };
}

export const buildProxyConfig = (proxyUrl: string | null): ProxyConfig | null => {
  if (!proxyUrl) return null;
  try {
    const p = new URL(proxyUrl);
    return {
      protocol: p.protocol.replace(":", ""),
      host:     p.hostname,
      port:     parseInt(p.port),
      auth:     p.username ? { username: p.username, password: p.password } : undefined,
    };
  } catch {
    return null;
  }
};

export const chunkArray = <T>(arr: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );