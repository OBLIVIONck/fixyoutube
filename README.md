# FixYouTube

Rich YouTube embeds for Discord, Telegram, Slack, and other platforms - inspired by [FxEmbed](https://github.com/FxEmbed/FxEmbed).

Swap `youtube.com` for `fixyoutube.com` and share the link. Bots get rich previews with video, images, and poll details. Humans are redirected to YouTube.

## Quick start

```text
https://www.youtube.com/watch?v=dQw4w9WgXcQ
→ https://fixyoutube.com/watch?v=dQw4w9WgXcQ
```

Also works with:

- Shorts (`/shorts/...`)
- Community posts (`/post/...`) including polls
- Channels (`/@handle`, `/channel/...`)
- Playlists (`/playlist?list=...`)
- `youtu.be/...` links (paste into `/oembed` or rewrite host)

## Deploy

### Option A: VPS (current)

The service runs as a Docker container behind Caddy on the c00lkiddtech VPS.

```bash
docker compose up -d --build
```

Point DNS at the VPS:

| Type | Host | Value |
|------|------|-------|
| A | `@` | `15.204.116.29` |
| A | `www` | `15.204.116.29` |

`fixyoutube.com` is currently on Namecheap nameservers (`dns1.registrar-servers.com`). Update the A records in Namecheap, then HTTPS is issued automatically via Caddy on-demand TLS.

### Option B: Cloudflare Workers

Your current `CLOUDFLARE_API_TOKEN` can edit DNS on existing zones but cannot deploy Workers yet. Create a new token with **Workers Scripts Edit** and **Zone** permissions, then:

```bash
export CLOUDFLARE_API_TOKEN=...
export CLOUDFLARE_ACCOUNT_ID=64428e69298176aba96969d47209fbde
npm run deploy:cf
```

Add `fixyoutube.com` to Cloudflare (or transfer nameservers from Namecheap), uncomment the `[[routes]]` blocks in `wrangler.toml`, and redeploy.

GitHub Actions deploys automatically when you add repo secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID` (optional, defaults in `wrangler.toml`)

## Development

```bash
npm install
npm run dev
```

Test a video embed like Discord would:

```bash
curl -H "User-Agent: Discordbot/2.0" "http://localhost:8787/watch?v=dQw4w9WgXcQ"
```

oEmbed:

```bash
curl "http://localhost:8787/oembed?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

## Deploy (Cloudflare Workers)

1. `npm run deploy`
2. Point `fixyoutube.com` DNS to Cloudflare
3. Uncomment the `[[routes]]` blocks in `wrangler.toml` and redeploy

## How it works

- **Cloudflare Worker** + [Hono](https://hono.dev) routing
- **Bot detection** - Discordbot, TelegramBot, Slackbot, etc. get embed HTML with Open Graph / Twitter Card meta
- **InnerTube API** for video metadata and stream URLs
- **Page parsing** for community posts, images, and polls (`ytInitialData`)
- **Humans** - 302 redirect to the original YouTube URL

## Roadmap

- [ ] Telegram Instant View style pages
- [ ] Live stream status badges
- [ ] Multi-image mosaic (`m.fixyoutube.com`)
- [ ] Public JSON API (`/api/v1/...`)
- [ ] Music.youtube.com support

## License

MIT
