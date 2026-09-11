#!/usr/bin/env bash
# One-shot first deploy of the AutomateSmall staging site to Fly.io.
#
#   ./scripts/first-deploy.sh            uses the default app name
#   ./scripts/first-deploy.sh my-name    uses a different app name
#
# Safe to re-run. Creates the app if it doesn't exist, deploys, then checks
# the three things that actually matter.
set -euo pipefail

cd "$(dirname "$0")/.."

APP="${1:-automatesmall-staging}"
FORBIDDEN="fuelup-youth"

say()  { printf '\n\033[1m%s\033[0m\n' "$*"; }
ok()   { printf '  \033[32mok\033[0m  %s\n' "$*"; }
bad()  { printf '  \033[31mno\033[0m  %s\n' "$*"; }
die()  { printf '\n\033[31m%s\033[0m\n' "$*" >&2; exit 1; }

if [ "$APP" = "$FORBIDDEN" ]; then
  die "Refusing: '$FORBIDDEN' is a frozen rollback snapshot for another project."
fi

say "1. Checking flyctl"
if ! command -v flyctl >/dev/null 2>&1; then
  die "flyctl is not installed. Run:

  curl -L https://fly.io/install.sh | sh
  export FLYCTL_INSTALL=\"\$HOME/.fly\"
  export PATH=\"\$FLYCTL_INSTALL/bin:\$PATH\"

then run this script again."
fi
ok "$(flyctl version | head -1)"

say "2. Checking you're signed in"
if ! flyctl auth whoami >/dev/null 2>&1; then
  die "Not signed in. Run 'flyctl auth login' and try again."
fi
ok "signed in as $(flyctl auth whoami 2>/dev/null)"

say "3. Checking the site before shipping it"
python3 scripts/check-copy.py

say "4. Making sure fly.toml points at $APP"
TOML_APP="$(grep -E '^app[[:space:]]*=' fly.toml | head -1 | cut -d'"' -f2)"
if [ "$TOML_APP" != "$APP" ]; then
  echo "  fly.toml says '$TOML_APP', you asked for '$APP'. Updating fly.toml."
  # macOS and GNU sed take different -i arguments.
  if sed --version >/dev/null 2>&1; then
    sed -i "s/^app *= *\".*\"/app            = \"$APP\"/" fly.toml
  else
    sed -i '' "s/^app *= *\".*\"/app            = \"$APP\"/" fly.toml
  fi
fi
ok "fly.toml targets $APP"

say "5. Making sure the app exists"
if flyctl apps list 2>/dev/null | awk '{print $1}' | grep -qx "$APP"; then
  ok "$APP already exists"
else
  echo "  creating $APP ..."
  if ! flyctl apps create "$APP" 2>/dev/null; then
    die "Could not create '$APP'. Fly app names are unique across every Fly
account, so this one is probably taken. Pick another and re-run:

  ./scripts/first-deploy.sh automatesmall-stg-zed"
  fi
  ok "created $APP"
fi

say "6. Deploying"
flyctl deploy --app "$APP" --ha=false --remote-only

URL="https://$APP.fly.dev"
say "7. Checking what actually shipped"
sleep 4
if curl -fsS "$URL/healthz" | grep -q ok; then ok "the site is up"; else bad "healthz did not answer"; fi
if curl -fsSI "$URL" | grep -qi 'x-robots-tag: *noindex'; then
  ok "noindex header present (staging will not be crawled)"
else
  bad "NOINDEX HEADER MISSING - do not share this URL until that is fixed"
fi
if curl -fsSI "$URL/how-it-works" >/dev/null 2>&1; then ok "extensionless URLs resolve"; else bad "/how-it-works did not resolve"; fi
if curl -fsSI "$URL/assets/fe-season.webp" | grep -qi 'content-type: *image/webp'; then
  ok "images serve as image/webp"
else
  bad "webp not served with the right content type"
fi

say "Done. Your staging site:"
printf '\n    %s\n\n' "$URL"
cat <<'NOTE'
Remember what is on it:
  - a placeholder founder name and photo
  - placeholder prices and legal entity details
  - a booking form that validates but sends nothing
  - a use case that still needs the client's written permission

Fine for review and for showing owners in the five-person test.
Not something to send a prospect.
NOTE
