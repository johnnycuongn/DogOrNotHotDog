# SeeFood

A recreation of the SeeFood app from HBO's *Silicon Valley*: point it at
something, hit the shutter, and Claude rules on whether it is a hotdog.

## Run it

```sh
npm install
npm start          # http://localhost:3457
PORT=4000 npm start
```

## From your phone

The server listens on every interface, so open `http://<your-mac's-ip>:3457`
on a phone on the same wifi. Tap the photo area and the phone offers its
camera or camera roll.

The in-page camera viewfinder is the one thing that will not work there:
`getUserMedia` needs a secure context, and plain http to a LAN address is not
one. The page detects this and hides the camera button rather than failing
when you tap it. To get the viewfinder on a phone, put the app behind https
(a tunnel such as `cloudflared` or `ngrok` is enough).

No API key. The classifier goes through `@anthropic-ai/claude-agent-sdk`, which
picks up the Claude Code OAuth login from the macOS Keychain. If `claude` works
in your terminal, this works.

## How it fits together

- `server.js` — Express + multer. Holds the upload in memory, never writes it to
  disk. Accepts JPEG/PNG/GIF/WebP up to 8 MB.
- `classifier.js` — one Agent SDK call per photo: no tools, no settings sources,
  a custom system prompt, and a `json_schema` output format so the reply is
  always `{ verdict, confidence, saw }`.
- `public/index.html` — the page. Drop, click or paste a photo, or switch on
  the camera and take one. While Claude looks, a ring of dots steps round over
  a dimmed photo under "Evaluating…". The verdict then lands as a bar with a
  half-disc badge: green with a tick at the top of the frame for a hotdog, red
  with a cross at the bottom for anything else, matching the show.

`maxTurns` is 4 because the model spends one turn describing the image and
another calling `StructuredOutput`; one turn is not enough.

## API

```sh
curl -F "image=@lunch.jpg" http://localhost:3457/api/classify
# {"verdict":"hotdog","confidence":0.95,"saw":"sausage in bun","costUsd":0.045}
```
