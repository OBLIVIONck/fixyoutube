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
  const marker = "var ytInitialData = ";
  const start = html.indexOf(marker);
  if (start < 0) return null;

  const jsonStart = start + marker.length;
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = jsonStart; i < html.length; i++) {
    const ch = html[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(jsonStart, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

export function extractPageTitle(html: string): string | undefined {
  const og = extractMeta(html, "og:title") || extractMeta(html, "twitter:title");
  if (og?.trim()) return decodeHtmlEntities(og.trim());

  const tag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  if (!tag) return undefined;
  const cleaned = decodeHtmlEntities(tag.trim()).replace(/\s*-\s*YouTube\s*$/i, "").trim();
  return cleaned || undefined;
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
  const absolute = url.startsWith("//") ? `https:${url}` : url;
  return normalizePreviewImage(absolute);
}

/** iMessage and some crawlers reject WebP preview images. */
export function normalizePreviewImage(url?: string, videoId?: string): string | undefined {
  if (!url?.trim()) {
    return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : undefined;
  }

  let normalized = url.trim();
  if (normalized.startsWith("//")) normalized = `https:${normalized}`;

  const id =
    videoId ||
    normalized.match(/\/vi(?:_webp)?\/([\w-]{11})\//)?.[1] ||
    normalized.match(/\/vi\/([\w-]{11})\//)?.[1];

  if (normalized.includes("ytimg.com")) {
    if (normalized.includes("vi_webp/") || normalized.endsWith(".webp")) {
      if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    }
    if (id && !/\.(jpe?g|png)($|\?)/i.test(normalized)) {
      return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    }
  }

  return normalized
    .replace(/vi_webp\//g, "vi/")
    .replace(/\.webp($|\?)/i, ".jpg$1");
}
