# FixYouTube

Better YouTube embeds for Discord, Telegram, Slack, and other platforms - inspired by [FxEmbed](https://github.com/FxEmbed/FxEmbed).

Replace `youtube.com` with `fixyoutube.com` in any link. Bots get rich previews with video, stats, images, and polls. Humans are redirected to YouTube.

Works with Discord, Telegram, Slack, **iMessage**, and other apps that read Open Graph tags.

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

FixYouTube is a Node.js app built with [Hono](https://hono.dev).

```bash
git clone https://github.com/OBLIVIONck/fixyoutube.git
cd fixyoutube
npm install
npm run dev
```

Production:

```bash
npm start
```

Or with Docker:

```bash
docker compose up -d --build
```

Optional environment variables:

- `PORT` - listen port (default `8787`)
- `INNERTUBE_CLIENT_VERSION` - InnerTube client version string

Point your domain at the server (reverse proxy to `PORT`) to use your own hostname.

## Contributing

Issues and pull requests are welcome. Please open an issue first for large changes.

```bash
npm test
npm run check
```

## How it works

- [Hono](https://hono.dev) HTTP router on Node.js
- Bot user-agents get Open Graph / Twitter Card HTML
- [InnerTube](https://wiki.archiveteam.org/index.php/YouTube) for video metadata
- Page parsing for community posts, images, and polls
- Everyone else gets a redirect to YouTube

## License

MIT
