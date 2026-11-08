# Hacker Roadmap — 3D Journey

An interactive 3D scrollable website that walks you through a complete ethical-hacking learning roadmap. Scroll (or use arrow keys / the minimap) to travel the path; the HUD always tells you **where you are**, what the stage covers, and what to learn next.

## Run locally

No build step. Just serve the folder:

```bash
cd hacker-roadmap
python3 -m http.server 8080
# open http://localhost:8080
```

Or open `index.html` directly in a modern browser (Chrome/Edge/Firefox).

## Deploy

Static site — deploy anywhere:

- **Vercel:** `vercel` (config in `vercel.json`)
- **GitHub Pages:** push to a repo, enable Pages on the root folder
- **Netlify:** drag-and-drop the folder

## Features

- 3D path (Three.js) through 12 stages
- Scroll-driven camera with smooth easing
- "You are here" HUD + progress bar + minimap
- Per-stage resource chips
- Hover tooltips, click-to-jump, keyboard nav
- Progress saved to `localStorage`
- Responsive (mobile-friendly)

## Disclaimer

For **educational and authorized testing only**. Practice on systems you own or have written permission to test. Unauthorized access is illegal.

---

## Repository

- **Home:** https://github.com/anya12forger12-max/hacker-roadmap
- **License:** MIT (see `LICENSE`)
- **Issues:** https://github.com/anya12forger12-max/hacker-roadmap/issues
- **Security:** See `SECURITY.md` / `.github/SECURITY.md`
- **Contributing:** See `CONTRIBUTING.md` (or open an issue/PR)
