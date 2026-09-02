// Crawlers and on-device preview fetchers (Discord, iMessage, Telegram, etc.)
const EMBED_BOT_UA =
  /discordbot|telegrambot|slackbot|facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|applebot|googlebot|bingbot|embedly|iframely|vkshare|datadetector|preview|bot\b|curl/i;

// iMessage fetches link previews on-device with a spoofed UA that bundles
// several social crawlers in one string (see Apple TN3156).
const IMESSAGE_UA =
  /facebookexternalhit\/\d|facebot|twitterbot\/\d/i;

export function isEmbedBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return EMBED_BOT_UA.test(userAgent) || IMESSAGE_UA.test(userAgent);
}

export function wantsJson(accept: string | null | undefined): boolean {
  if (!accept) return false;
  return accept.includes("application/json") || accept.includes("text/json");
}

export function wantsLinkPreview(userAgent: string | null | undefined, accept?: string | null): boolean {
  return isEmbedBot(userAgent) || wantsJson(accept);
}
