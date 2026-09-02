import { Hono } from "hono";
import type { Env } from "./types";
import { isEmbedBot, wantsJson, wantsLinkPreview } from "./bots";
import { parseYouTubeInput, parseYouTubePath, toYouTubeUrl } from "./parsers/url";
import { resolveYouTubeEmbed } from "./providers/youtube";
import { embedToOEmbed, renderEmbedPage, renderLandingPage } from "./embed/html";

const app = new Hono<{ Bindings: Env }>();

function siteOrigin(c: { req: { url: string } }): string {
  const url = new URL(c.req.url);
  return `${url.protocol}//${url.host}`;
}

app.get("/oembed", async (c) => {
  const target = c.req.query("url");
  if (!target) {
    return c.json({ error: "Missing url parameter" }, 400);
  }
  const parsed = parseYouTubeInput(target);
  if (!parsed) {
    return c.json({ error: "Unsupported YouTube URL" }, 400);
  }
  try {
    const embed = await resolveYouTubeEmbed(c.env, parsed);
    return c.json(embedToOEmbed(embed, target));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to resolve embed";
    return c.json({ error: message }, 502);
  }
});

app.get("/health", (c) => c.json({ ok: true, service: "fixyoutube" }));

app.get("/", (c) => {
  const ua = c.req.header("User-Agent");
  if (isEmbedBot(ua) || wantsJson(c.req.header("Accept"))) {
    return c.html(renderLandingPage());
  }
  return c.html(renderLandingPage());
});

app.get("/*", async (c) => {
  const url = new URL(c.req.url);
  const parsed = parseYouTubePath(url.pathname, url.search);
  if (!parsed) {
    return c.html(renderLandingPage());
  }

  const ua = c.req.header("User-Agent");
  const youtubeUrl = toYouTubeUrl(parsed);

  if (!wantsLinkPreview(ua, c.req.header("Accept"))) {
    return c.redirect(youtubeUrl, 302);
  }

  try {
    const embed = await resolveYouTubeEmbed(c.env, parsed);
    if (wantsJson(c.req.header("Accept"))) {
      return c.json(embedToOEmbed(embed, youtubeUrl));
    }
    return c.html(renderEmbedPage(embed, siteOrigin(c)), 200, {
      "Cache-Control": "public, max-age=300",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Embed failed";
    return c.html(
      `<!DOCTYPE html><html><head><title>FixYouTube</title></head><body><p>${message}</p><p><a href="${youtubeUrl}">Open on YouTube</a></p></body></html>`,
      502
    );
  }
});

export default app;
