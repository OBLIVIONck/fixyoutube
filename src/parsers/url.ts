import type { YouTubeResourceKind } from "../types";

export interface ParsedYouTubeUrl {
  kind: YouTubeResourceKind;
  videoId?: string;
  postId?: string;
  channelId?: string;
  playlistId?: string;
  handle?: string;
  canonicalPath: string;
}

const VIDEO_ID = /^[\w-]{11}$/;

export function parseYouTubePath(pathname: string, search: string): ParsedYouTubeUrl | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  const params = new URLSearchParams(search);

  if (path === "/" || path === "") {
    return null;
  }

  const shorts = path.match(/^\/shorts\/([\w-]{11})$/);
  if (shorts) {
    return {
      kind: "short",
      videoId: shorts[1],
      canonicalPath: `/shorts/${shorts[1]}`,
    };
  }

  const watch = path === "/watch" && params.get("v");
  if (watch && VIDEO_ID.test(watch)) {
    const playlistId = params.get("list") || undefined;
    return {
      kind: "video",
      videoId: watch,
      playlistId,
      canonicalPath: `/watch?v=${watch}${playlistId ? `&list=${playlistId}` : ""}`,
    };
  }

  const post = path.match(/^\/post\/([\w-]+)$/);
  if (post) {
    return {
      kind: "post",
      postId: post[1],
      canonicalPath: `/post/${post[1]}`,
    };
  }

  const channel = path.match(/^\/channel\/(UC[\w-]+)$/);
  if (channel) {
    return {
      kind: "channel",
      channelId: channel[1],
      canonicalPath: `/channel/${channel[1]}`,
    };
  }

  const handle = path.match(/^\/@([\w.-]+)$/);
  if (handle) {
    return {
      kind: "channel",
      handle: handle[1],
      canonicalPath: `/@${handle[1]}`,
    };
  }

  const legacyC = path.match(/^\/c\/([\w.-]+)$/);
  if (legacyC) {
    return {
      kind: "channel",
      handle: legacyC[1],
      canonicalPath: `/c/${legacyC[1]}`,
    };
  }

  const legacyUser = path.match(/^\/user\/([\w.-]+)$/);
  if (legacyUser) {
    return {
      kind: "channel",
      handle: legacyUser[1],
      canonicalPath: `/user/${legacyUser[1]}`,
    };
  }

  const playlist = path === "/playlist" && params.get("list");
  if (playlist) {
    return {
      kind: "playlist",
      playlistId: playlist,
      canonicalPath: `/playlist?list=${playlist}`,
    };
  }

  const embed = path.match(/^\/embed\/([\w-]{11})$/);
  if (embed) {
    return {
      kind: "video",
      videoId: embed[1],
      canonicalPath: `/watch?v=${embed[1]}`,
    };
  }

  const live = path.match(/^\/live\/([\w-]{11})$/);
  if (live) {
    return {
      kind: "video",
      videoId: live[1],
      canonicalPath: `/watch?v=${live[1]}`,
    };
  }

  return {
    kind: "unknown",
    canonicalPath: path + (search ? search : ""),
  };
}

export function parseYouTubeInput(input: string): ParsedYouTubeUrl | null {
  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      if (VIDEO_ID.test(id)) {
        return {
          kind: "video",
          videoId: id,
          canonicalPath: `/watch?v=${id}`,
        };
      }
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      return parseYouTubePath(url.pathname, url.search);
    }
    if (host === "fixyoutube.com") {
      return parseYouTubePath(url.pathname, url.search);
    }
  } catch {
    return null;
  }
  return null;
}

export function toYouTubeUrl(parsed: ParsedYouTubeUrl): string {
  return `https://www.youtube.com${parsed.canonicalPath}`;
}
