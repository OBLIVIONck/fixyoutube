import type { Env } from "../types";

const DEFAULT_API_KEY = "AIzaSyAO_FJ2SlbwUmuQnpgNleGl7EULemtdG0";
const DEFAULT_CLIENT_VERSION = "2.20250317.01.00";

function clientContext(env: Env) {
  return {
    client: {
      hl: "en",
      gl: "US",
      clientName: "WEB",
      clientVersion: env.INNERTUBE_CLIENT_VERSION || DEFAULT_CLIENT_VERSION,
    },
  };
}

function apiKey(env: Env): string {
  return env.INNERTUBE_API_KEY || DEFAULT_API_KEY;
}

export async function innertube<T>(
  env: Env,
  endpoint: string,
  body: Record<string, unknown>
): Promise<T> {
  const url = `https://www.youtube.com/youtubei/v1/${endpoint}?key=${apiKey(env)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
    body: JSON.stringify({
      context: clientContext(env),
      ...body,
    }),
  });
  if (!res.ok) {
    throw new Error(`InnerTube ${endpoint} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchYouTubePage(path: string): Promise<string> {
  const res = await fetch(`https://www.youtube.com${path}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) {
    throw new Error(`YouTube page fetch failed: ${res.status}`);
  }
  return res.text();
}

export function extractMeta(html: string, property: string): string | undefined {
  const og = new RegExp(
    `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i"
  );
  const ogRev = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
    "i"
  );
  const name = new RegExp(
    `<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i"
  );
  return og.exec(html)?.[1] || ogRev.exec(html)?.[1] || name.exec(html)?.[1];
}

export function extractYtInitialData(html: string): unknown | null {
  const match = html.match(/var ytInitialData = (\{.*?\});<\/script>/s);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function pickLargestThumbnail(thumbnails?: { url?: string; width?: number }[]): string | undefined {
  if (!thumbnails?.length) return undefined;
  const sorted = [...thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0));
  const url = sorted[0]?.url;
  if (!url) return undefined;
  return url.startsWith("//") ? `https:${url}` : url;
}
