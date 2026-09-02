import type { YouTubeEmbed } from "../types";
import { buildEmbedDescription, buildStatsLine } from "../format/stats";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function meta(name: string, content?: string, property = false): string {
  if (!content) return "";
  const attr = property ? "property" : "name";
  return `<meta ${attr}="${escapeHtml(name)}" content="${escapeHtml(content)}">`;
}

function formatDuration(seconds?: number): string | undefined {
  if (!seconds || seconds <= 0) return undefined;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function absoluteHttpsUrl(url?: string): string | undefined {
  if (!url?.trim()) return undefined;
  const trimmed = url.trim();
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("http://")) return `https://${trimmed.slice("http://".length)}`;
  return trimmed;
}

export function renderEmbedPage(embed: YouTubeEmbed, siteOrigin: string): string {
  const title = embed.title || "YouTube";
  const description = buildEmbedDescription(embed, 500);
  const statsLine = buildStatsLine(embed);
  const image = absoluteHttpsUrl(embed.thumbnail || embed.images?.[0]);
  const video = embed.videoUrl ? absoluteHttpsUrl(embed.videoUrl) : undefined;
  const canonical = embed.canonicalUrl;
  const fixUrl = canonical.replace("https://www.youtube.com", siteOrigin);

  const extraImages = (embed.images || [])
    .slice(1, 4)
    .map((url) => meta("og:image", absoluteHttpsUrl(url), true))
    .filter(Boolean)
    .join("\n    ");

  const pollNote = embed.poll?.choices.length
    ? `\n    ${meta("fixyoutube:poll", "true")}`
    : "";

  // iMessage / Facebook / Twitter read summary_large_image + og:image (not player cards).
  const twitterCard = image ? "summary_large_image" : "summary";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <link rel="canonical" href="${escapeHtml(canonical)}">
  ${meta("description", description)}
  ${meta("og:site_name", "FixYouTube")}
  ${meta("og:title", title, true)}
  ${meta("og:description", description, true)}
  ${meta("og:url", fixUrl, true)}
  ${meta("og:type", video ? "video.other" : "article", true)}
  ${meta("og:image", image, true)}
  ${image ? meta("og:image:secure_url", image, true) : ""}
  ${image ? meta("og:image:width", "1280", true) : ""}
  ${image ? meta("og:image:height", "720", true) : ""}
  ${extraImages}
  ${video ? meta("og:video", video, true) : ""}
  ${video ? meta("og:video:url", video, true) : ""}
  ${video ? meta("og:video:secure_url", video, true) : ""}
  ${video ? meta("og:video:type", "video/mp4", true) : ""}
  ${embed.videoWidth ? meta("og:video:width", String(embed.videoWidth), true) : ""}
  ${embed.videoHeight ? meta("og:video:height", String(embed.videoHeight), true) : ""}
  ${embed.publishedAt ? meta("article:published_time", embed.publishedAt, true) : ""}
  ${meta("twitter:card", twitterCard)}
  ${meta("twitter:title", title)}
  ${meta("twitter:description", description)}
  ${meta("twitter:image", image)}
  ${image ? meta("twitter:image:src", image) : ""}
  ${video ? meta("twitter:player", video) : ""}
  ${meta("theme-color", "#ff0000")}
  ${pollNote}
  <style>
    body { font-family: system-ui, sans-serif; background: #0f0f0f; color: #f1f1f1; margin: 0; padding: 2rem; }
    a { color: #3ea6ff; }
    .card { max-width: 640px; margin: 0 auto; }
    img, video { max-width: 100%; border-radius: 12px; }
    .poll { margin-top: 1rem; padding: 1rem; background: #212121; border-radius: 8px; }
    .poll li { margin: 0.35rem 0; }
    .meta { color: #aaa; font-size: 0.9rem; margin-top: 0.5rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${escapeHtml(title)}</h1>
    ${embed.author ? `<p class="meta">by ${escapeHtml(embed.author)}</p>` : ""}
    ${statsLine ? `<p class="meta">${escapeHtml(statsLine)}</p>` : ""}
    ${video ? `<video src="${escapeHtml(video)}" controls poster="${escapeHtml(image || "")}"></video>` : ""}
    ${!video && image ? `<img src="${escapeHtml(image)}" alt="">` : ""}
    <p>${escapeHtml(embed.description?.slice(0, 500) || "")}</p>
    ${
      embed.poll?.choices.length
        ? `<div class="poll"><strong>Poll</strong><ul>${embed.poll.choices
            .map((c) => `<li>${escapeHtml(c.text)}${c.votePercentage ? ` - ${escapeHtml(c.votePercentage)}` : ""}</li>`)
            .join("")}</ul>${embed.poll.totalVotes ? `<p class="meta">${escapeHtml(embed.poll.totalVotes)}</p>` : ""}</div>`
        : ""
    }
  </div>
</body>
</html>`;
}

export function renderLandingPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>FixYouTube - Rich YouTube embeds for Discord and more</title>
  <meta name="description" content="Fix YouTube embeds for Discord, Telegram, and other platforms. Videos, Shorts, community posts, and polls.">
  <meta property="og:title" content="FixYouTube">
  <meta property="og:description" content="Rich YouTube embeds - videos, Shorts, community posts, and polls.">
  <meta name="theme-color" content="#ff0000">
  <style>
    :root { --bg: #0f0f0f; --text: #f1f1f1; --accent: #ff0000; --link: #3ea6ff; }
    body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); margin: 0; line-height: 1.6; }
    main { max-width: 720px; margin: 0 auto; padding: 2.5rem 1.5rem 4rem; }
    h1 { font-size: 2rem; margin-bottom: 0.25rem; }
    h1 span { color: var(--accent); }
    code, pre { background: #212121; padding: 0.15rem 0.4rem; border-radius: 6px; }
    pre { padding: 1rem; overflow-x: auto; }
    a { color: var(--link); }
    li { margin: 0.4rem 0; }
  </style>
</head>
<body>
  <main>
    <h1>Fix<span>YouTube</span></h1>
    <p>Better YouTube link previews for Discord, iMessage, Telegram, Slack, and other apps - inspired by <a href="https://github.com/FxEmbed/FxEmbed">FxEmbed</a>.</p>
    <h2>How to use</h2>
    <p>Replace <code>youtube.com</code> with <code>fixyoutube.com</code> in any link:</p>
    <pre>https://www.youtube.com/watch?v=dQw4w9WgXcQ
→ https://fixyoutube.com/watch?v=dQw4w9WgXcQ</pre>
    <p>Works with Shorts, community posts, channels, and playlists too.</p>
    <h2>Supported</h2>
    <ul>
      <li>Videos and Shorts (inline video on Discord when available)</li>
      <li>Community posts with images</li>
      <li>Polls (choices and vote percentages in the description)</li>
      <li>Channels and playlists</li>
    </ul>
    <h2>API</h2>
    <p><code>GET /oembed?url=&lt;youtube-url&gt;</code> returns oEmbed JSON for supported links.</p>
    <p><a href="https://github.com/OBLIVIONck/fixyoutube">Source on GitHub</a></p>
  </main>
</body>
</html>`;
}

export function embedToOEmbed(embed: YouTubeEmbed, requestUrl: string) {
  const width = embed.videoWidth || 1280;
  const height = embed.videoHeight || 720;
  const html = embed.videoUrl
    ? `<iframe width="${width}" height="${height}" src="${embed.canonicalUrl.replace("watch?v=", "embed/")}" frameborder="0" allowfullscreen></iframe>`
    : undefined;

  return {
    type: embed.videoUrl ? "video" : "rich",
    version: "1.0",
    title: embed.title,
    author_name: embed.author,
    author_url: embed.authorUrl,
    provider_name: "FixYouTube",
    provider_url: "https://fixyoutube.com",
    thumbnail_url: embed.thumbnail,
    thumbnail_width: width,
    thumbnail_height: height,
    html,
    width,
    height,
    duration: formatDuration(embed.durationSeconds),
    description: buildEmbedDescription(embed, 1000),
    fixyoutube_stats: buildStatsLine(embed) || null,
    fixyoutube_views: embed.viewCount || null,
    fixyoutube_likes: embed.likes || null,
    fixyoutube_comments: embed.comments || null,
    fixyoutube_published_at: embed.publishedAt || null,
    fixyoutube_kind: embed.kind,
    fixyoutube_poll: embed.poll || null,
    fixyoutube_url: requestUrl,
  };
}
