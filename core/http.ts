// core/http.ts

import axios, { type AxiosInstance, type AxiosRequestHeaders } from "axios";
import { buildProxyConfig } from "../utils/helpers";

export function createHttpClient(
  userAgent: string,
  proxyUrl: string | null = null
): AxiosInstance {
  const config: Record<string, unknown> = {
    timeout:         30_000,
    withCredentials: true,
    maxRedirects:    5,
    headers: {
      "User-Agent":         userAgent,
      "Accept-Language":    "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
      "Accept-Encoding":    "gzip, deflate, br",
      Connection:           "keep-alive",
      "Sec-Ch-Ua":          '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
      "Sec-Ch-Ua-Mobile":   "?0",
      "Sec-Ch-Ua-Platform": '"Windows"',
    },
  };

  const proxy = buildProxyConfig(proxyUrl);
  if (proxy) config.proxy = proxy;

  return axios.create(config);
}

export function buildApiHeaders(
  userAgent:    string,
  csrfToken:    string,
  cookieString: string,
  referer:      string
): Record<string, string> {
  return {
    "User-Agent":            userAgent,
    Accept:                  "application/json, text/javascript, */*, q=0.01",
    "Accept-Language":       "en-IN,en-GB;q=0.9,en-US;q=0.8",
    "Accept-Encoding":       "gzip, deflate, br",
    "X-Requested-With":      "XMLHttpRequest",
    "X-APP-VERSION":         "a17b1e8",
    "X-Pinterest-AppState":  "active",
    "X-CSRFToken":           csrfToken,
    Referer:                 referer,
    Origin:                  "https://www.pinterest.com",
    Cookie:                  cookieString,
    Connection:              "keep-alive",
    "Sec-Fetch-Dest":        "empty",
    "Sec-Fetch-Mode":        "cors",
    "Sec-Fetch-Site":        "same-origin",
  } as Partial<AxiosRequestHeaders>;
}