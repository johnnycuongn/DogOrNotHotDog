# Backlog

Things deliberately not done yet, with enough detail to pick up cold.

---

## Named Cloudflare tunnel — a link that stops changing

**Why.** `npm run share` opens a *quick* tunnel. The hostname is a lease on a
live connection, not a reservation: close the laptop and the QUIC connection
drops, and on reconnect Cloudflare has already reclaimed the name. You get a
new random `….trycloudflare.com` every time, so any link you have shared is
dead. This happened in practice — a tunnel created at 12:13 was gone by 14:12
when the Mac slept, and kept retrying for 17 hours against a name that no
longer existed.

A **named** tunnel keeps one hostname across reconnects.

**What it does not fix.** The Mac still has to be awake. Nothing makes this
answer while the machine is off, because the Keychain credential doing the
authenticating only exists on it. An always-on URL means a server, and a server
means an API key instead of the Claude Code login.

**Prerequisite, and it is the real cost here: you need a domain on
Cloudflare.** Not just a free account — a domain you own, with its nameservers
pointed at Cloudflare. The free plan is fine once the domain is there. Keeping
your existing DNS provider and pointing a single subdomain by CNAME ("partial"
setup) is Business plan only, $200/month, so it is not an option. If you do not
own a domain, that purchase is step zero.

**Steps, once a domain is on Cloudflare.**

1. `cloudflared tunnel login` — opens a browser, pick the zone. Writes a
   certificate to `~/.cloudflared/cert.pem`. **That file is a credential:** it
   is already covered by the `*.pem` line in `.gitignore`, and it lives outside
   the repo anyway. Keep it that way.
2. `cloudflared tunnel create seefood` — writes
   `~/.cloudflared/<UUID>.json`, also a credential, also never in the repo.
3. `cloudflared tunnel route dns seefood seefood.yourdomain.com` — creates the
   CNAME to `<UUID>.cfargotunnel.com`. This does not happen on its own; without
   it the hostname does not resolve.
4. Config at `~/.cloudflared/config.yml`:
   ```yaml
   tunnel: <UUID>
   credentials-file: /Users/<you>/.cloudflared/<UUID>.json
   ingress:
     - hostname: seefood.yourdomain.com
       service: http://localhost:3457
     - service: http_status:404
   ```
5. `cloudflared tunnel run seefood`.

**Then:** teach `scripts/share.sh` to use the named tunnel when
`~/.cloudflared/config.yml` exists and fall back to a quick tunnel otherwise,
so a fresh clone with no domain still works unchanged. Document the choice in
the README's "Put it on a public URL" section, which currently only describes
quick tunnels.

**Worth it when** you want to hand the link to the same people more than once.
Not worth it for a one-off demo.

---

## Smaller items

**Rate limiting.** A tunnel URL has none. Every visitor's photo spends your
Claude subscription allowance (~$0.013 each), and heavy traffic gets you
throttled inside Claude Code itself, not just here. Fine while the link goes to
people you know; needed before it goes anywhere public. Cheapest useful version
is a per-IP counter in `server.js`; Cloudflare WAF rate limiting is the
tidier answer but its availability on the free plan was never confirmed.

**HEIC photos from iPhone.** Pictures chosen from the Files app can arrive as
HEIC, which Claude does not accept, so the server rejects them with a clear
message. Photos taken through the camera or picked from the camera roll are
transcoded to JPEG by Safari and work fine. A fix means decoding HEIC
server-side. Left alone because the common path already works and the
uncommon one fails legibly.

**Survive sleep / start on boot.** `caffeinate -s` alongside `npm start` stops
the sleep that kills the tunnel. A launchd agent would start both on login.
Only worth doing together with the named tunnel — a stable hostname that is
down half the time is not much better than a changing one.

**Verify the camera on a real phone.** The viewfinder and the touch-specific
copy ("Take or choose a photo", driven by
`(hover: none) and (pointer: coarse)`) have been checked in a desktop browser
at phone width and confirmed to appear over https, but never on an actual
device. The logic is one media query; it has just never been seen firing on
real hardware.
