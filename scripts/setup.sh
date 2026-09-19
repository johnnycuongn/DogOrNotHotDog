#!/usr/bin/env bash
# Gets SeeFood running on a Mac that has never seen it before.
set -euo pipefail

cd "$(dirname "$0")/.."
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
bad()  { printf '  \033[31m✗\033[0m %s\n' "$1"; }
note() { printf '    %s\n' "$1"; }

echo
echo "SeeFood setup"
echo

fail=0

# --- Node ---------------------------------------------------------------
if command -v node >/dev/null 2>&1; then
  major=$(node -p 'process.versions.node.split(".")[0]')
  if [ "$major" -ge 20 ]; then
    ok "node $(node -v)"
  else
    bad "node $(node -v) — this needs v20 or newer"
    note "Install a current Node from https://nodejs.org, then re-run."
    fail=1
  fi
else
  bad "node is not installed"
  note "Install it from https://nodejs.org (LTS), then re-run."
  fail=1
fi

# --- Claude Code --------------------------------------------------------
# This app has no API key. It borrows the login the Claude Code CLI already
# holds in the Keychain, so that CLI has to be installed and signed in.
if command -v claude >/dev/null 2>&1; then
  ok "claude CLI $(claude --version 2>/dev/null | head -1)"
else
  bad "the claude CLI is not installed"
  note "Install Claude Code, run 'claude' once and finish the login."
  note "https://claude.com/claude-code"
  fail=1
fi

if security find-generic-password -s "Claude Code-credentials" >/dev/null 2>&1; then
  ok "Claude Code login found in the Keychain"
else
  bad "no Claude Code login in the Keychain"
  note "Run 'claude' once and sign in. This app cannot call Claude without it."
  fail=1
fi

[ "$fail" -eq 0 ] || { echo; echo "Fix the above, then run: npm run setup"; echo; exit 1; }

# --- Dependencies -------------------------------------------------------
echo
echo "Installing dependencies…"
npm install --silent
ok "dependencies installed"

# --- Does it actually work? ---------------------------------------------
echo
echo "Asking Claude to classify the test image…"
if node scripts/smoke.mjs; then
  echo
  echo "Ready. Start it with:"
  echo "    npm start"
  echo
  echo "To put it on a public URL:"
  echo "    npm run share"
  echo
else
  echo
  echo "Setup stopped: the Claude call did not go through."
  echo
  exit 1
fi
