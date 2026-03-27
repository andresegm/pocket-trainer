# Pocket Trainer

Web-first, **local-only** gym app: an exercise library, programs made of daily routines, resistance blocks with sets (reps, weight, optional tempo, intensity, rest), and activities with duration and distance. Data stays in **IndexedDB** in this browser.

## Requirements

- **Node.js** 18+ (20.19+ recommended for latest tooling)

## Install and run

```bash
npm install
npm run dev
```

Open the printed local URL. To try on another device on the same network:

```bash
npm run dev -- --host
```

Then open `http://<your-computer-LAN-IP>:5173` on your phone (HTTP is fine on a trusted LAN).

## Build

```bash
npm run build
npm run preview
```

Output is in `dist/`.

## Deploy to Vercel

This repo includes [`vercel.json`](vercel.json) so client-side routes (React Router) fall back to `index.html`.

1. Sign in at [vercel.com](https://vercel.com) with the **Vercel account you want for this app** (not necessarily the same as your other projects).
2. **Add New Project** → import the `pocket-trainer` GitHub repo.
3. Preset should detect **Vite**. Confirm:
   - **Build Command:** `npm run build` (runs `tsc` + `vite build`)
   - **Output Directory:** `dist`
4. Deploy. `npm install` will respect [`.npmrc`](.npmrc) (`legacy-peer-deps`) on Vercel.

**Using a different Vercel account than another project:** Vercel ties each project to the team/account you’re logged into when you create it. Use a **private/incognito window** or another **browser profile**, log into Vercel with the **second account**, then import this repo—or use **Account / Team switcher** in the Vercel dashboard and create the project under the correct team. Same GitHub repo can be connected to multiple Vercel accounts as **separate projects** (each gets its own URL and settings).

## Use on iPhone when you are not at home

Safari needs a stable **HTTPS** origin (or your machine running with a tunnel) for a normal web app workflow. The practical options:

1. **Deploy the static build** to a free host (Vercel, Netlify, Cloudflare Pages, GitHub Pages). Set build command to `npm run build` and publish the `dist` folder (or the host’s Vite preset).
2. After it loads once, use **Share → Add to Home Screen** in Safari for a full-screen shortcut; the PWA service worker caches the shell for offline use after that.
3. **Back up** your data from **Settings → Export backup**—clearing site data or changing the site URL can strand data on one origin.

## Project structure

- `src/db/` — Dexie (IndexedDB), seed exercises, import/export
- `src/pages/` — Library, programs, editors, settings
- `src/types/` — Shared TypeScript models

## Tech

Vite, React, TypeScript, Tailwind CSS, React Router, Dexie, `vite-plugin-pwa`.

Dependency installs use `legacy-peer-deps` (see `.npmrc`) so `vite-plugin-pwa` works cleanly with the pinned Vite version.
