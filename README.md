# FixYouTube

Better YouTube embeds for Discord, Telegram, Slack, and other platforms - inspired by [FxEmbed](https://github.com/FxEmbed/FxEmbed).

Replace `youtube.com` with `fixyoutube.com` in any link. Bots get rich previews with video, stats, images, and polls. Humans are redirected to YouTube.

**Live site:** [fixyoutube.com](https://fixyoutube.com)

## Usage

```text
https://www.youtube.com/watch?v=dQw4w9WgXcQ
→ https://fixyoutube.com/watch?v=dQw4w9WgXcQ
```

Supported links:

- Videos (`/watch?v=...`, `youtu.be/...`)
- Shorts (`/shorts/...`)
- Community posts (`/post/...`) including polls
- Channels (`/@handle`, `/channel/...`)
- Playlists (`/playlist?list=...`)

Embeds include view/like/comment counts and publish date when YouTube exposes them.

## API

```bash
curl "https://fixyoutube.com/oembed?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

## Self-hosting

FixYouTube runs on [Cloudflare Workers](https://workers.cloudflare.com/).

```bash
git clone https://github.com/OBLIVIONck/fixyoutube.git
cd fixyoutube
npm install
npm run dev
```

Deploy:

```bash
# Create a Cloudflare API token with Workers Scripts Edit permission
export CLOUDFLARE_API_TOKEN=your_token
export CLOUDFLARE_ACCOUNT_ID=your_account_id
npm run deploy
```

Point your domain at Cloudflare and add worker routes in `wrangler.toml` (see the commented examples).

GitHub Actions deploys on push when `CLOUDFLARE_API_TOKEN` is set as a repository secret.

## Contributing

Issues and pull requests are welcome. Please open an issue first for large changes.

```bash
npm test
npm run check
```

## How it works

- [Hono](https://hono.dev) router on Cloudflare Workers
- Bot user-agents get Open Graph / Twitter Card HTML
- [InnerTube](https://wiki.archiveteam.org/index.php/YouTube) for video metadata
- Page parsing for community posts, images, and polls
- Everyone else gets a redirect to YouTube

## License

MIT
