export interface VideoEngagement {
  viewCount?: string;
  likes?: string;
  comments?: string;
  publishedAt?: string;
}

function textFromRuns(runs: unknown): string {
  if (!Array.isArray(runs)) return "";
  return runs
    .map((r) => (r && typeof r === "object" && "text" in r ? String((r as { text?: string }).text || "") : ""))
    .join("");
}

function simpleText(node: unknown): string | undefined {
  if (!node || typeof node !== "object") return undefined;
  const obj = node as { simpleText?: string; runs?: unknown };
  if (obj.simpleText) return obj.simpleText;
  const runs = textFromRuns(obj.runs);
  return runs || undefined;
}

function parseLikeCountFromAccessibility(text: string): string | undefined {
  const along = text.match(/along with ([\d,]+) other people/i);
  if (along) return along[1];
  const likes = text.match(/([\d,.]+[KMB]?)\s+likes?/i);
  if (likes) return likes[1];
  return undefined;
}

export function parseVideoEngagementFromNext(data: unknown): VideoEngagement {
  const out: VideoEngagement = {};
  const seen = {
    views: false,
    date: false,
    likes: false,
    comments: false,
  };

  function walk(node: unknown) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }

    const obj = node as Record<string, unknown>;

    if (!seen.views && obj.viewCount) {
      const viewNode = obj.viewCount as Record<string, unknown>;
      const renderer = viewNode.videoViewCountRenderer as Record<string, unknown> | undefined;
      const text = simpleText(renderer?.viewCount) || simpleText(viewNode);
      if (text) {
        out.viewCount = text.replace(/\s*views?$/i, "").trim();
        seen.views = true;
      }
    }

    if (!seen.date && obj.dateText) {
      const text = simpleText(obj.dateText);
      if (text) {
        out.publishedAt = text;
        seen.date = true;
      }
    }

    if (!seen.likes && typeof obj.accessibilityText === "string") {
      const likes = parseLikeCountFromAccessibility(obj.accessibilityText);
      if (likes) {
        out.likes = likes;
        seen.likes = true;
      }
    }

    if (!seen.comments) {
      const countText = simpleText(obj.countText);
      if (countText && /comment/i.test(countText) && /\d/.test(countText)) {
        out.comments = countText.replace(/\s*comments?$/i, "").trim();
        seen.comments = true;
      }
    }

    for (const value of Object.values(obj)) walk(value);
  }

  walk(data);
  return out;
}

export function parseVideoDescriptionFromNext(data: unknown): string | undefined {
  let found: string | undefined;

  function walk(node: unknown) {
    if (found || !node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }

    const obj = node as Record<string, unknown>;
    const body = obj.attributedDescriptionBodyText as Record<string, unknown> | undefined;
    if (body) {
      const content = body.content;
      if (typeof content === "string" && content.trim()) {
        found = content.trim();
        return;
      }
      const runs = textFromRuns(body.runs);
      if (runs.trim()) {
        found = runs.trim();
        return;
      }
    }

    for (const value of Object.values(obj)) walk(value);
  }

  walk(data);
  return found;
}

export function parseChannelFromNext(data: unknown): string | undefined {
  let found: string | undefined;

  function walk(node: unknown) {
    if (found || !node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }

    const obj = node as Record<string, unknown>;
    const secondary = obj.videoSecondaryInfoRenderer as Record<string, unknown> | undefined;
    if (secondary?.owner) {
      const owner = secondary.owner as Record<string, unknown>;
      const videoOwner = owner.videoOwnerRenderer as Record<string, unknown> | undefined;
      const title = simpleText(videoOwner?.title);
      if (title) {
        found = title;
        return;
      }
    }

    const details = obj.videoDetails as { author?: string } | undefined;
    if (details?.author?.trim()) {
      found = details.author.trim();
      return;
    }

    for (const value of Object.values(obj)) walk(value);
  }

  walk(data);
  return found;
}

export function parseVideoTitleFromNext(data: unknown): string | undefined {
  let found: string | undefined;

  function walk(node: unknown) {
    if (found || !node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }

    const obj = node as Record<string, unknown>;
    const primary = obj.videoPrimaryInfoRenderer as Record<string, unknown> | undefined;
    if (primary?.title) {
      const title = simpleText(primary.title);
      if (title) {
        found = title;
        return;
      }
    }

    const details = obj.videoDetails as { title?: string } | undefined;
    if (details?.title?.trim()) {
      found = details.title.trim();
      return;
    }

    for (const value of Object.values(obj)) walk(value);
  }

  walk(data);
  return found;
}

export function parsePostPublishedTime(renderer: Record<string, unknown>): string | undefined {
  return (
    simpleText(renderer.publishedTimeText)
    || simpleText(renderer.publishedTime)
    || simpleText(renderer.timestampText)
  );
}
