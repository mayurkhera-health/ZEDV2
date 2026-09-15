#!/usr/bin/env bash
# Deploy the AutomateSmall staging site to Fly.io.
#
# Guarded on purpose: this must never deploy to `fuelup-youth`, which is a
# frozen rollback snapshot for a completely different project.
set -euo pipefail

APP="automatesmall-staging"
FORBIDDEN="fuelup-youth"

cd "$(dirname "$0")/.."

if ! command -v flyctl >/dev/null 2>&1; then
  echo "flyctl is not installed. See https://fly.io/docs/flyctl/install/" >&2
  exit 1
fi

TOML_APP="$(grep -E '^app\s*=' fly.toml | head -1 | cut -d'"' -f2)"
if [ "$TOML_APP" != "$APP" ]; then
  echo "fly.toml names app '$TOML_APP', expected '$APP'. Refusing to deploy." >&2
  exit 1
fi
if [ "$TOML_APP" = "$FORBIDDEN" ]; then
  echo "REFUSING: '$FORBIDDEN' is a frozen rollback snapshot, not a deploy target." >&2
  exit 1
fi

# This deploys the working directory, not origin. A checkout that is behind
# produces a clean, successful deploy of old code.
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ -z "${SKIP_SYNC_CHECK:-}" ] && git fetch origin "$BRANCH" --quiet 2>/dev/null; then
  BEHIND="$(git rev-list --count HEAD..FETCH_HEAD 2>/dev/null || echo 0)"
  if [ "${BEHIND:-0}" -gt 0 ]; then
    echo "Refusing: this checkout is $BEHIND commit(s) behind origin/$BRANCH." >&2
    echo "Run 'git pull' first, or SKIP_SYNC_CHECK=1 to deploy anyway." >&2
    exit 1
  fi
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree is dirty. Commit before deploying so the URL matches a commit." >&2
  git status --short
  exit 1
fi

python3 scripts/check-copy.py

SHA="$(git rev-parse --short HEAD)"
echo "Deploying $SHA to $APP ..."
flyctl deploy --app "$APP" --ha=false --build-arg "GIT_SHA=$SHA"

# Prove the live site is actually serving what was just built.
sleep 4
LIVE="$(curl -fsS "https://$APP.fly.dev/version.txt" 2>/dev/null | tr -d '[:space:]' || true)"
if [ "$LIVE" != "$SHA" ]; then
  echo >&2
  echo "WARNING: live site reports '${LIVE:-nothing}' but you deployed '$SHA'." >&2
  echo "The deploy did not take, or an old machine is still serving." >&2
  echo "Check: flyctl status -a $APP" >&2
fi

echo
echo "Staging is live: https://$APP.fly.dev"
echo "Reminder: this build carries placeholder founder details, placeholder legal"
echo "entity information, and a booking form that transmits nothing."
