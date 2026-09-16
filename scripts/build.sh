#!/usr/bin/env bash
# Assemble the publishable site into dist/.
#
# Cloudflare Pages publishes a DIRECTORY, so without this it would publish the
# repository root -- including docs/, scripts/ and the UX audit,
# which is internal commentary about the site being unfinished. Only what a
# visitor should see goes into dist/.
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf dist
mkdir -p dist

cp ./*.html dist/
cp robots.txt dist/
[ -f sitemap.xml ] && cp sitemap.xml dist/
cp -R assets dist/assets
[ -f _headers ] && cp _headers dist/_headers

# Which branch is this? Cloudflare Workers Builds sets WORKERS_CI_BRANCH,
# Pages sets CF_PAGES_BRANCH; fall back to git for a local build.
BRANCH="${WORKERS_CI_BRANCH:-${CF_PAGES_BRANCH:-$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)}}"

# A preview branch is served on its own Cloudflare hostname, and that hostname
# is as crawlable as the real one. Left alone it would put a second copy of
# every page into the index, competing with automatesmall.com for its own
# search results -- and the copy Google picked would be whichever it crawled
# last. So the noindex the site shed at launch comes back, but ONLY in the
# built output of a non-production branch. The repository's own _headers and
# robots.txt stay production-shaped, which is what keeps `check-copy.py
# --production` an honest gate: it reads the files, not the build.
if [ "$BRANCH" != "main" ]; then
  printf '%s\n' \
    '# Preview build of branch '"$BRANCH"'. NOT automatesmall.com.' \
    'User-agent: *' \
    'Disallow: /' > dist/robots.txt
  # robots.txt asks a crawler not to fetch; X-Robots-Tag tells one that did
  # fetch not to index. A preview URL shared in a chat gets fetched, so both.
  {
    printf '%s\n' '# Preview build of branch '"$BRANCH"'. NOT automatesmall.com.'
    cat _headers 2>/dev/null
    printf '\n%s\n  %s\n' '/*' 'X-Robots-Tag: noindex, nofollow'
  } > dist/_headers
  # A preview pointing search engines at the real sitemap is the same leak.
  rm -f dist/sitemap.xml
  echo "PREVIEW build (branch: $BRANCH) -- noindex, no sitemap."
fi

# Same build stamp the Fly image carries, so "which commit is live" stays
# answerable. Cloudflare sets CF_PAGES_COMMIT_SHA; fall back to git locally.
SHA="${WORKERS_CI_COMMIT_SHA:-${CF_PAGES_COMMIT_SHA:-$(git rev-parse --short HEAD 2>/dev/null || echo unknown)}}"
printf '%s\n' "${SHA:0:7}" > dist/version.txt

echo "dist/ contains:"
find dist -type f | sort | sed 's/^/  /'
