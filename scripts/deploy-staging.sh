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

if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree is dirty. Commit before deploying so the URL matches a commit." >&2
  git status --short
  exit 1
fi

python3 scripts/check-copy.py

echo "Deploying $(git rev-parse --short HEAD) to $APP ..."
flyctl deploy --app "$APP" --ha=false

echo
echo "Staging is live: https://$APP.fly.dev"
echo "Reminder: this build carries placeholder founder details, placeholder legal"
echo "entity information, and a booking form that transmits nothing."
