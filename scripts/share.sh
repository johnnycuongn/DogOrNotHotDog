#!/usr/bin/env bash
# Puts the locally running app on a public https URL with a Cloudflare quick
# tunnel. No Cloudflare account needed. Ctrl-C ends it.
set -euo pipefail

cd "$(dirname "$0")/.."
PORT="${PORT:-3457}"

if ! curl -fsS -o /dev/null --max-time 3 "http://localhost:$PORT/"; then
  echo "Nothing is serving on port $PORT."
  echo "Start the app first, in another tab:  npm start"
  echo "(or set PORT if you started it elsewhere:  PORT=4000 npm run share)"
  exit 1
fi

# Prefer an installed cloudflared; otherwise keep a copy in .cache/ so this
# does not need Homebrew, sudo, or an accepted Xcode licence.
if command -v cloudflared >/dev/null 2>&1; then
  CF=cloudflared
else
  CF=".cache/cloudflared"
  if [ ! -x "$CF" ]; then
    case "$(uname -m)" in
      arm64) arch=arm64 ;;
      *)     arch=amd64 ;;
    esac
    echo "Fetching cloudflared (one time, kept in .cache/)…"
    mkdir -p .cache
    curl -fsSL -o .cache/cloudflared.tgz \
      "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-${arch}.tgz"
    tar xzf .cache/cloudflared.tgz -C .cache
    rm -f .cache/cloudflared.tgz
    chmod +x "$CF"
  fi
fi

echo "Opening a tunnel to localhost:$PORT …"
echo "The https URL appears below. It lives only while this command runs,"
echo "and a new one is issued every time — quick tunnels cannot keep a name."
echo
exec "$CF" tunnel --url "http://localhost:$PORT"
