import type { YouTubeEmbed } from "../types";

export function formatCompactCount(value: string | number): string {
  const n = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 0) return String(value);
  if (n >= 1_000_000_000) return `${trimTrailingZero(n / 1_000_000_000)}B`;
  if (n >= 1_000_000) return `${trimTrailingZero(n / 1_000_000)}M`;
  if (n >= 1_000) return `${trimTrailingZero(n / 1_000)}K`;
  return n.toLocaleString("en-US");
}

function trimTrailingZero(n: number): string {
  const s = n.toFixed(1);
  return s.endsWith(".0") ? s.slice(0, -2) : s;
}

export function formatViewLabel(raw?: string): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (/view/i.test(trimmed)) return trimmed;
  const n = Number(trimmed.replace(/,/g, ""));
  if (Number.isFinite(n)) return `${formatCompactCount(n)} views`;
  return trimmed;
}

export function formatLikeLabel(raw?: string): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (/like/i.test(trimmed)) return trimmed;
  const n = Number(trimmed.replace(/,/g, ""));
  if (Number.isFinite(n)) return `${formatCompactCount(n)} likes`;
  return `${trimmed} likes`;
}

export function formatCommentLabel(raw?: string): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (/comment/i.test(trimmed)) return trimmed;
  const n = Number(trimmed.replace(/,/g, ""));
  if (Number.isFinite(n)) return `${formatCompactCount(n)} comments`;
  return `${trimmed} comments`;
}

export function formatPublishedLabel(isoOrText?: string): string | undefined {
  if (!isoOrText) return undefined;
  const trimmed = isoOrText.trim();
  if (!trimmed) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return trimmed;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function buildStatsLine(embed: YouTubeEmbed): string | undefined {
  const parts: string[] = [];
  const views = formatViewLabel(embed.viewCount);
  const likes = formatLikeLabel(embed.likes);
  const comments = formatCommentLabel(embed.comments);
  const published = formatPublishedLabel(embed.publishedAt);

  if (views) parts.push(views);
  if (likes) parts.push(likes);
  if (comments) parts.push(comments);
  if (published) parts.push(published);

  return parts.length ? parts.join(" · ") : undefined;
}

/** First few non-empty lines of the video/post description for link previews. */
export function excerptDescription(text: string, maxLines = 4, maxChars = 320): string {
  const cleaned = String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!cleaned) return "";

  const lines = cleaned.split("\n").map((line) => line.trim()).filter(Boolean);
  const taken: string[] = [];
  let used = 0;

  for (const line of lines) {
    if (taken.length >= maxLines) break;
    const slice = line.length > 140 ? `${line.slice(0, 139)}…` : line;
    if (used + slice.length + 1 > maxChars && taken.length > 0) break;
    taken.push(slice);
    used += slice.length + 1;
  }

  return taken.join("\n");
}

export function buildEmbedDescription(embed: YouTubeEmbed, maxBody = 500): string {
  const channel = (embed.author || "").trim();
  const stats = buildStatsLine(embed);
  const excerpt = excerptDescription(embed.description || "", 4, Math.max(120, maxBody - 120));

  const headerParts: string[] = [];
  if (channel) headerParts.push(channel);
  if (stats) headerParts.push(stats);

  const header = headerParts.join("\n");
  if (header && excerpt) {
    const combined = `${header}\n\n${excerpt}`;
    if (combined.length <= maxBody) return combined;
    const room = maxBody - header.length - 3;
    if (room > 40) return `${header}\n\n${excerpt.slice(0, room)}…`;
    return header.slice(0, maxBody);
  }
  if (header) return header.length > maxBody ? `${header.slice(0, maxBody - 1)}…` : header;
  if (excerpt) return excerpt.length > maxBody ? `${excerpt.slice(0, maxBody - 1)}…` : excerpt;
  return "";
}

/** Single-line embed description: stats and excerpt (channel goes in article:author). */
export function buildDiscordDescription(embed: YouTubeEmbed, maxLen = 350): string {
  const parts: string[] = [];

  const stats = buildStatsLine(embed);
  if (stats) parts.push(stats);

  const excerpt = excerptDescription(embed.description || "", 3, 220)
    .replace(/\s*\n\s*/g, " · ")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (excerpt) parts.push(excerpt);

  const line = parts.filter(Boolean).join(" · ");
  if (!line) return "";
  return line.length > maxLen ? `${line.slice(0, maxLen - 1)}…` : line;
}

/** Single-line OG description: channel, stats, and description excerpt (Discord-safe). */
export function buildSocialDescription(embed: YouTubeEmbed, maxLen = 350): string {
  const parts: string[] = [];
  const channel = (embed.author || "").trim();
  if (channel) parts.push(channel);

  const stats = buildStatsLine(embed);
  if (stats) parts.push(stats);

  const excerpt = excerptDescription(embed.description || "", 3, 220)
    .replace(/\s*\n\s*/g, " · ")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (excerpt) parts.push(excerpt);

  const line = parts.filter(Boolean).join(" · ");
  if (!line) return "";
  return line.length > maxLen ? `${line.slice(0, maxLen - 1)}…` : line;
}

/** Short single-line blurb for iMessage / Twitter / Facebook cards. */
export function buildPreviewBlurb(embed: YouTubeEmbed, maxLen = 200): string {
  const parts: string[] = [];
  if (embed.author) parts.push(embed.author);
  const stats = buildStatsLine(embed);
  if (stats) parts.push(stats);

  const body = (embed.description || "").replace(/\s+/g, " ").trim();
  if (body) {
    const room = maxLen - parts.join(" · ").length - 3;
    if (room > 24) {
      parts.push(body.length > room ? `${body.slice(0, room - 1)}…` : body);
    }
  }

  const line = parts.filter(Boolean).join(" · ");
  return line.length > maxLen ? `${line.slice(0, maxLen - 1)}…` : line;
}
