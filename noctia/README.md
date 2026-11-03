# Noctia

A static marketing site modeled on polsia.com, renamed to Noctia. Plain HTML, CSS and JavaScript, no build step.

## Pages

- `index.html` — homepage: terminal strip, orange live banner, empty-office hero, "Never hire again", "One platform. Every role.", "Start a company tonight".
- `live.html` — the public live dashboard (simulated feed; swap `assets/live.js` generators for a real API).
- `new.html` — onboarding: create a new company (surprise me / build my idea) or grow an existing one.
- `about.html`, `terms.html`, `privacy.html`, `acceptable-use.html`.

## Hero photo

The hero paints `assets/hero.svg` (a drawn, grayscale empty office). Drop a black-and-white photo at `assets/hero.jpg` and it will paint over the drawing automatically, no code change needed.

## Deploy

Any static host works. On Vercel, create a project with the root directory set to `noctia/`; `vercel.json` already enables clean URLs. Locally:

```
cd noctia && python3 -m http.server 8080
```
