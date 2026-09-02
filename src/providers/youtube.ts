import type { Env, YouTubeEmbed, CommunityPoll, PollChoice } from "../types";
import type { ParsedYouTubeUrl } from "../parsers/url";
import { toYouTubeUrl } from "../parsers/url";
import {
  decodeHtmlEntities,
  extractMeta,
  extractPageTitle,
  extractYtInitialData,
  fetchYouTubePage,
  innertube,
  pickLargestThumbnail,
} from "./innertube";
import {
  parsePostPublishedTime,
  parseVideoEngagementFromNext,
  parseVideoTitleFromNext,
  type VideoEngagement,
} from "./engagement";

interface PlayerResponse {
  videoDetails?: {
    title?: string;
    shortDescription?: string;
    author?: string;
    channelId?: string;
    lengthSeconds?: string;
    viewCount?: string;
    thumbnail?: { thumbnails?: { url?: string; width?: number }[] };
  };
  streamingData?: {
    formats?: { url?: string; width?: number; height?: number; mimeType?: string }[];
    adaptiveFormats?: { url?: string; width?: number; height?: number; mimeType?: string }[];
  };
  microformat?: {
    playerMicroformatRenderer?: {
      publishDate?: string;
      category?: string;
    };
  };
}

function bestProgressiveVideo(streaming?: PlayerResponse["streamingData"]) {
  const formats = [
    ...(streaming?.formats || []),
    ...(streaming?.adaptiveFormats || []),
  ].filter((f) => f.url && f.mimeType?.includes("video/mp4"));
  formats.sort((a, b) => (b.width || 0) - (a.width || 0));
  return formats[0];
}

function walkForPostRenderer(node: unknown): Record<string, unknown> | null {
  if (!node || typeof node !== "object") return null;
  const obj = node as Record<string, unknown>;
  if (obj.backstagePostThreadRenderer || obj.postRenderer || obj.sharedPostRenderer) {
    return obj;
  }
  for (const value of Object.values(obj)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = walkForPostRenderer(item);
        if (found) return found;
      }
    } else if (value && typeof value === "object") {
      const found = walkForPostRenderer(value);
      if (found) return found;
    }
  }
  return null;
}

function textFromRuns(runs: unknown): string {
  if (!Array.isArray(runs)) return "";
  return runs
    .map((r) => (r && typeof r === "object" && "text" in r ? String((r as { text?: string }).text || "") : ""))
    .join("");
}

function parsePollFromAttachment(attachment: Record<string, unknown> | undefined): CommunityPoll | undefined {
  const poll = attachment?.pollRenderer as Record<string, unknown> | undefined;
  if (!poll) return undefined;
  const choicesRaw = poll.choices as Record<string, unknown>[] | undefined;
  const choices: PollChoice[] = (choicesRaw || []).map((ch) => {
    const textRuns = (ch.text as { runs?: unknown })?.runs;
    const text = textRuns ? textFromRuns(textRuns) : String(ch.text || "");
    const pctRuns = (ch.votePercentageIfSelected as { runs?: unknown })?.runs
      || (ch.votePercentage as { runs?: unknown })?.runs;
    const votePercentage = pctRuns ? textFromRuns(pctRuns) : undefined;
    return { text, votePercentage };
  });
  const totalRuns = (poll.totalVotes as { simpleText?: string; runs?: unknown }) || {};
  const totalVotes =
    totalRuns.simpleText ||
    (totalRuns.runs ? textFromRuns(totalRuns.runs) : undefined);
  return { choices, totalVotes };
}

function parseImagesFromAttachment(attachment: Record<string, unknown> | undefined): string[] {
  const images: string[] = [];
  const backstage = attachment?.backstageImageRenderer as Record<string, unknown> | undefined;
  if (backstage?.image) {
    const url = pickLargestThumbnail(
      ((backstage.image as { thumbnails?: { url?: string; width?: number }[] }).thumbnails) || []
    );
    if (url) images.push(url);
  }
  const multi = attachment?.postMultiImageRenderer as Record<string, unknown> | undefined;
  const items = multi?.images as Record<string, unknown>[] | undefined;
  for (const item of items || []) {
    const renderer = item.backstageImageRenderer as Record<string, unknown> | undefined;
    const url = pickLargestThumbnail(
      ((renderer?.image as { thumbnails?: { url?: string; width?: number }[] })?.thumbnails) || []
    );
    if (url) images.push(url);
  }
  return images;
}

const GENERIC_TITLES = new Set([
  "youtube",
  "youtube video",
  "youtube -",
  "watch",
]);

function isUsableTitle(title?: string): boolean {
  if (!title?.trim()) return false;
  const normalized = title.trim().toLowerCase();
  if (GENERIC_TITLES.has(normalized)) return false;
  if (normalized === "youtube") return false;
  return true;
}

async function resolveVideoTitle(
  canonicalUrl: string,
  videoId: string,
  sources: {
    player?: PlayerResponse;
    next?: unknown;
    html?: string;
  }
): Promise<string> {
  const candidates: (string | undefined)[] = [
    sources.player?.videoDetails?.title?.trim(),
    sources.next ? parseVideoTitleFromNext(sources.next) : undefined,
  ];

  if (sources.html) {
    candidates.push(extractPageTitle(sources.html));
    candidates.push(decodeHtmlEntities(extractMeta(sources.html, "og:title") || ""));
  }

  for (const title of candidates) {
    if (isUsableTitle(title)) return title!.trim();
  }

  try {
    const oembed = await fetchViaOEmbed(canonicalUrl);
    if (isUsableTitle(oembed.title)) return oembed.title!.trim();
  } catch {
    // oEmbed unavailable
  }

  if (!sources.html) {
    try {
      const html = await fetchYouTubePage(`/watch?v=${videoId}`);
      const pageTitle = extractPageTitle(html);
      if (isUsableTitle(pageTitle)) return pageTitle!;
    } catch {
      // page fetch failed
    }
  }

  return `Video ${videoId}`;
}

function parseCommunityPostFromInitialData(data: unknown, postId: string): Partial<YouTubeEmbed> | null {
  const thread = walkForPostRenderer(data);
  if (!thread) return null;
  const post =
    (thread.backstagePostThreadRenderer as Record<string, unknown> | undefined)?.post
    || thread.postRenderer
    || (thread.sharedPostRenderer as Record<string, unknown> | undefined);
  const rawRenderer = (post as Record<string, unknown> | undefined)?.backstagePostRenderer
    || post;
  if (!rawRenderer || typeof rawRenderer !== "object") return null;
  const renderer = rawRenderer as Record<string, unknown>;

  const contentText = textFromRuns(
    ((renderer.contentText as { runs?: unknown })?.runs) || []
  );
  const authorName =
    ((renderer.authorText as { runs?: unknown[] })?.runs?.[0] as { text?: string })?.text
    || ((renderer.authorText as { simpleText?: string })?.simpleText);
  const attachment = renderer.backstageAttachment as Record<string, unknown> | undefined;
  const poll = parsePollFromAttachment(attachment);
  const images = parseImagesFromAttachment(attachment);
  const voteCount = (renderer.voteCount as { simpleText?: string })?.simpleText;
  const commentCount = (
    (renderer.actionButtons as Record<string, unknown>)
      ?.commentActionButtonsRenderer as Record<string, unknown>
  )?.replyButton as Record<string, unknown> | undefined;
  const comments = (
    (commentCount?.buttonRenderer as Record<string, unknown>)?.text as { simpleText?: string }
  )?.simpleText;
  const publishedAt = parsePostPublishedTime(renderer);

  let description = contentText;
  if (poll?.choices.length) {
    const lines = poll.choices.map((c) => {
      const pct = c.votePercentage ? ` (${c.votePercentage})` : "";
      return `• ${c.text}${pct}`;
    });
    description = [contentText, "", "Poll:", ...lines, poll.totalVotes ? `\n${poll.totalVotes}` : ""]
      .filter(Boolean)
      .join("\n");
  }

  return {
    kind: "post",
    title: authorName ? `${authorName} on YouTube` : "YouTube Community Post",
    description,
    author: authorName,
    thumbnail: images[0],
    images,
    poll,
    likes: voteCount,
    comments,
    publishedAt,
    canonicalUrl: `https://www.youtube.com/post/${postId}`,
  };
}

async function fetchVideoEmbed(env: Env, parsed: ParsedYouTubeUrl): Promise<YouTubeEmbed> {
  const videoId = parsed.videoId!;
  const canonicalUrl = toYouTubeUrl(parsed);

  let player: PlayerResponse | undefined;
  let engagement: VideoEngagement = {};
  let nextData: unknown;
  let html: string | undefined;

  try {
    const [playerRes, nextRes] = await Promise.all([
      innertube<PlayerResponse>(env, "player", { videoId }),
      innertube(env, "next", { videoId }),
    ]);
    player = playerRes;
    nextData = nextRes;
    engagement = parseVideoEngagementFromNext(nextRes);
  } catch {
    try {
      html = await fetchYouTubePage(parsed.canonicalPath);
    } catch {
      html = undefined;
    }
    const title = await resolveVideoTitle(canonicalUrl, videoId, { html });
    return {
      kind: parsed.kind === "short" ? "short" : "video",
      canonicalUrl,
      title,
      description: decodeHtmlEntities(extractMeta(html || "", "og:description") || ""),
      thumbnail: html ? extractMeta(html, "og:image") : undefined,
      videoUrl: html ? extractMeta(html, "og:video:url") || extractMeta(html, "og:video") : undefined,
    };
  }

  const title = await resolveVideoTitle(canonicalUrl, videoId, {
    player,
    next: nextData,
    html,
  });

  const details = player?.videoDetails;
  const stream = bestProgressiveVideo(player?.streamingData);
  const thumb = pickLargestThumbnail(details?.thumbnail?.thumbnails);
  const publishDate =
    player?.microformat?.playerMicroformatRenderer?.publishDate || engagement.publishedAt;

  return {
    kind: parsed.kind === "short" ? "short" : "video",
    canonicalUrl,
    title,
    description: details?.shortDescription || "",
    author: details?.author,
    authorUrl: details?.channelId
      ? `https://www.youtube.com/channel/${details.channelId}`
      : undefined,
    thumbnail: thumb || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    videoUrl: stream?.url,
    videoWidth: stream?.width || 1280,
    videoHeight: stream?.height || 720,
    durationSeconds: details?.lengthSeconds ? Number(details.lengthSeconds) : undefined,
    viewCount: engagement.viewCount || details?.viewCount,
    publishedAt: publishDate,
    likes: engagement.likes,
    comments: engagement.comments,
  };
}

async function fetchPostEmbed(parsed: ParsedYouTubeUrl): Promise<YouTubeEmbed> {
  const postId = parsed.postId!;
  const canonicalUrl = toYouTubeUrl(parsed);
  const html = await fetchYouTubePage(parsed.canonicalPath);
  const initial = extractYtInitialData(html);
  const fromData = initial ? parseCommunityPostFromInitialData(initial, postId) : null;

  const title = fromData?.title
    || decodeHtmlEntities(extractMeta(html, "og:title") || "YouTube Community Post");
  const description = fromData?.description
    || decodeHtmlEntities(extractMeta(html, "og:description") || "");
  const thumbnail = fromData?.thumbnail || extractMeta(html, "og:image");

  return {
    kind: "post",
    canonicalUrl,
    title,
    description,
    author: fromData?.author,
    thumbnail,
    images: fromData?.images,
    poll: fromData?.poll,
    likes: fromData?.likes,
    comments: fromData?.comments,
    publishedAt: fromData?.publishedAt,
  };
}

async function fetchChannelEmbed(parsed: ParsedYouTubeUrl): Promise<YouTubeEmbed> {
  const canonicalUrl = toYouTubeUrl(parsed);
  const html = await fetchYouTubePage(parsed.canonicalPath);
  return {
    kind: "channel",
    canonicalUrl,
    title: decodeHtmlEntities(extractMeta(html, "og:title") || "YouTube Channel"),
    description: decodeHtmlEntities(extractMeta(html, "og:description") || ""),
    thumbnail: extractMeta(html, "og:image"),
  };
}

async function fetchPlaylistEmbed(parsed: ParsedYouTubeUrl): Promise<YouTubeEmbed> {
  const canonicalUrl = toYouTubeUrl(parsed);
  const html = await fetchYouTubePage(parsed.canonicalPath);
  return {
    kind: "playlist",
    canonicalUrl,
    title: decodeHtmlEntities(extractMeta(html, "og:title") || "YouTube Playlist"),
    description: decodeHtmlEntities(extractMeta(html, "og:description") || ""),
    thumbnail: extractMeta(html, "og:image"),
  };
}

export async function resolveYouTubeEmbed(env: Env, parsed: ParsedYouTubeUrl): Promise<YouTubeEmbed> {
  switch (parsed.kind) {
    case "video":
    case "short":
      return fetchVideoEmbed(env, parsed);
    case "post":
      return fetchPostEmbed(parsed);
    case "channel":
      return fetchChannelEmbed(parsed);
    case "playlist":
      return fetchPlaylistEmbed(parsed);
    default:
      return {
        kind: "unknown",
        canonicalUrl: toYouTubeUrl(parsed),
        title: "YouTube",
        description: "Open on YouTube",
      };
  }
}

export async function fetchViaOEmbed(videoUrl: string): Promise<Partial<YouTubeEmbed>> {
  const endpoint = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(videoUrl)}`;
  const res = await fetch(endpoint);
  if (!res.ok) return {};
  const data = (await res.json()) as {
    title?: string;
    author_name?: string;
    author_url?: string;
    thumbnail_url?: string;
    html?: string;
  };
  return {
    title: data.title,
    author: data.author_name,
    authorUrl: data.author_url,
    thumbnail: data.thumbnail_url,
  };
}
