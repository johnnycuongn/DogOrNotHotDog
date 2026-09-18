# SeeFood

A recreation of the SeeFood app from HBO's *Silicon Valley*: point it at
something and Claude rules on whether it is a hotdog.

## Run it

```sh
npm install
npm start          # http://localhost:3457
PORT=4000 npm start
```

**No API key.** The classifier goes through `@anthropic-ai/claude-agent-sdk`,
which picks up the Claude Code OAuth login from the macOS Keychain. If `claude`
works in your terminal, this works.

## Share it

That Keychain login only exists on this machine, so this app is not deployable
to a normal host — it runs here and you expose it with a tunnel:

```sh
cloudflared tunnel --url http://localhost:3457
```

That prints an `https://….trycloudflare.com` address, no Cloudflare account
needed. It lives as long as the command runs, and the app only answers while
your machine is awake. The https is what makes the in-page camera work on a
phone; over plain http to a LAN address the browser blocks `getUserMedia` and
the page hides that button.

## How it fits together

- `classifier.js` — one Agent SDK call per photo: no tools, no settings
  sources, a custom system prompt, and a `json_schema` output format, so the
  reply is always `{ verdict, confidence, saw }`.
- `server.js` — Express. The browser posts the image bytes raw with the file's
  type as `Content-Type`, so there is no multipart form to parse. JPEG, PNG,
  GIF or WebP up to 8 MB, held in memory, never written to disk.
- `public/index.html` — drop, click, paste, or use the camera. Photos are
  downscaled to 1568 px on the long edge before upload, since Claude does not
  use more than that.

Two things worth knowing before you change them:

- `maxTurns` is 4. The model spends one turn describing the image and another
  calling `StructuredOutput`; at 1 it returns `error_max_turns` with no output.
- The model id carries its date: `claude-haiku-4-5-20251001`. The bare
  `claude-haiku-4-5` alias invokes two models per request and measured 10x the
  cost ($0.158 vs $0.015 per photo) for the same verdict.

## Cost

Roughly **$0.015 per photo**, most of it the one-off system prompt. There is no
rate limiting, so treat a tunnel URL as something you hand to people you know
rather than something you post publicly — every visitor spends your credits.
