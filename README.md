# Nabin Kumar Rouniyar - Professional Portfolio

Static site (HTML + CSS + JS, no build step). GSAP, ScrollTrigger and Lenis load from CDNs.

```bash
python -m http.server 5180   # then open http://localhost:5180
```

**Deploy:** `npx vercel` from this folder (framework preset: Other, no build command).

- `index.html` - all content lives here
- `styles.css` - design tokens at the top (`:root`)
- `main.js` - animations, cursor, nav, ThoughtLoom video, contact form, visit alert, and the
  List / 3D views (file deck, contact drawer, research desk + PDF reader) with their switch animations and sounds
- `assets/` - what the site serves: photo, résumé, compressed ThoughtLoom film (3 MB),
  the MLESA-Net paper (`MLESA-Net.pdf`, shown on the desk computer) and the Spider-Verse web drawing
- `originals/` - full-size source files (git-ignored). To swap the résumé, replace
  `assets/Nabin-Kumar-Rouniyar-Resume.pdf` keeping that file name.

**Email:** uses its own Web3Forms key (in `main.js`). The contact form sends the
message, and each new browser session sends one "someone visited" email (skipped on localhost).
Web3Forms' free plan allows 250 submissions/month, shared by both.
