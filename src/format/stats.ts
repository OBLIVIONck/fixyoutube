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

export function buildEmbedDescription(embed: YouTubeEmbed, maxBody = 500): string {
  const stats = buildStatsLine(embed);
  const body = (embed.description || "").trim();
  const clippedBody = body.length > maxBody ? `${body.slice(0, maxBody - 1)}…` : body;

  if (stats && clippedBody) return `${stats}\n\n${clippedBody}`;
  if (stats) return stats;
  return clippedBody;
}
