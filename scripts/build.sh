#!/usr/bin/env bash
# Assemble the publishable site into dist/.
#
# Cloudflare Pages publishes a DIRECTORY, so without this it would publish the
# repository root -- including docs/, scripts/, the Dockerfile and the UX audit,
# which is internal commentary about the site being unfinished. Only what a
# visitor should see goes into dist/.
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf dist
mkdir -p dist

cp ./*.html dist/
cp robots.txt dist/
cp -R assets dist/assets
[ -f _headers ] && cp _headers dist/_headers

# Same build stamp the Fly image carries, so "which commit is live" stays
# answerable. Cloudflare sets CF_PAGES_COMMIT_SHA; fall back to git locally.
SHA="${CF_PAGES_COMMIT_SHA:-$(git rev-parse --short HEAD 2>/dev/null || echo unknown)}"
printf '%s\n' "${SHA:0:7}" > dist/version.txt

echo "dist/ contains:"
find dist -type f | sort | sed 's/^/  /'
