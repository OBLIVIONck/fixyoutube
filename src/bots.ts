const BOT_UA =
  /discordbot|telegrambot|slackbot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|applebot|googlebot|bingbot|embedly|preview|bot\b|curl/i;

export function isEmbedBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return BOT_UA.test(userAgent);
}

export function wantsJson(accept: string | null | undefined): boolean {
  if (!accept) return false;
  return accept.includes("application/json") || accept.includes("text/json");
}
