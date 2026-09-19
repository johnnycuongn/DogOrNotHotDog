# SeeFood

A recreation of the SeeFood app from HBO's *Silicon Valley*. Point it at
something, and Claude rules on whether it is a hotdog.

There is **no API key**. It borrows the login the Claude Code CLI already holds
in your Keychain, which is the one thing to understand before installing it.

## Install on a Mac

**Prerequisites:** macOS, [Node 20+](https://nodejs.org), and
[Claude Code](https://claude.com/claude-code) installed **and signed in** — run
`claude` once and finish the login. The app authenticates as you, so without
that login it cannot call Claude at all.

```sh
git clone https://github.com/johnnycuongn/DogOrNotHotDog.git
cd DogOrNotHotDog
npm run setup
```

`npm run setup` checks Node, checks the Claude CLI, confirms the login is in
the Keychain, installs dependencies, and then asks Claude to classify a test
image so you know the whole path works before you open a browser. It tells you
what to fix if anything is missing.

Then:

```sh
npm start          # http://localhost:3457
```

If 3457 is taken it picks a free port and prints the real address, so nothing
fails just because something else is using it.

## Put it on a public URL

```sh
npm start          # leave this running
npm run share      # in a second tab
```

`npm run share` opens a Cloudflare quick tunnel and prints an
`https://….trycloudflare.com` address. No Cloudflare account. It downloads
`cloudflared` into `.cache/` the first time, so it needs no Homebrew, no sudo,
and no Xcode licence.

**The URL only lives while both commands run.** It is a lease on an open
connection, not a reservation:

- `cloudflared` dials **out** from your Mac to Cloudflare over QUIC and holds
  that connection open. Cloudflare never dials in, which is why this works
  behind a router with no port forwarding.
- Close the laptop and that connection dies. Requests have nowhere to go.
- On reconnect a quick tunnel gets a **new random name** — the old one is gone
  for good. A free Cloudflare account and a *named* tunnel keeps one hostname,
  but the Mac still has to be awake.

Nothing makes it answer while the Mac is off, because the credential doing the
authenticating only exists on that Mac. An always-on URL means a server, and a
server means an API key instead of this login.

## How it fits together

- `classifier.js` — one Agent SDK call per photo: no tools, a custom system
  prompt, and a `json_schema` output format, so the reply is always
  `{ verdict, confidence, saw }`.
- `server.js` — Express. The browser posts the image bytes raw with the file's
  type as `Content-Type`, so there is no multipart form to parse. JPEG, PNG,
  GIF or WebP up to 8 MB, held in memory, never written to disk.
- `public/index.html` — drop, click, paste, or use the camera. Photos are
  downscaled to 1568 px on the long edge before upload, since Claude does not
  use more than that.
- `scripts/` — `setup.sh`, `share.sh`, and `smoke.mjs` (`npm run smoke` re-runs
  the end-to-end check any time).

Two things worth knowing before changing them:

- `maxTurns` is 4. The model spends one turn describing the image and another
  calling `StructuredOutput`; at 1 it returns `error_max_turns` with no output.
- The model id carries its date: `claude-haiku-4-5-20251001`. The bare
  `claude-haiku-4-5` alias invoked two models per request and measured 10x the
  cost ($0.158 vs $0.015 per photo, both warm) for an identical verdict.

## Cost

Roughly **$0.013 of usage per photo** once it is warm, measured over repeated
calls. The **first call after a fresh install costs about 15x that** (~$0.22)
because nothing is cached yet — including the one `npm run setup` makes. That
is normal; it settles on the next photo.

On a Claude Code login this draws against your subscription's allowance rather
than arriving as a bill: heavy traffic gets you throttled, not invoiced. There
is no rate limiting, so treat a tunnel URL as something you hand to people you
know.

## The camera

The in-page viewfinder needs a secure context. It works on the `https://`
tunnel and on `localhost`, but not over plain `http://` to a LAN address — the
page detects this and hides the button rather than failing when you tap it. The
file picker offers the camera on phones either way.
