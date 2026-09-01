#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "Missing CLOUDFLARE_API_TOKEN."
  echo "Create a token at https://dash.cloudflare.com/profile/api-tokens with:"
  echo "  - Account: Workers Scripts Edit"
  echo "  - Zone: fixyoutube.com (Workers Routes Edit, DNS Edit)"
  echo "  - Optional: Account Settings Read (for account_id lookup)"
  exit 1
fi

export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-64428e69298176aba96969d47209fbde}"

echo "Deploying FixYouTube worker..."
npx wrangler deploy "$@"

echo ""
echo "If fixyoutube.com is on Cloudflare, uncomment routes in wrangler.toml and redeploy."
echo "Or add a Workers custom domain in the Cloudflare dashboard."
