# Chiti — Design & Code Audit

_Generated March 2026. All issues addressed in the updated `src/chiti.jsx` and supporting files._

---

## Critical Fixes Applied

### 1. Accessibility
| Issue | Fix |
|---|---|
| No ARIA labels on buttons | Added `aria-label` to all interactive elements |
| `<div>` used for nav | Changed to semantic `<nav role="navigation">` |
| No focus-visible styles | Added `:focus-visible` outline in `tokens.css` |
| `prefers-reduced-motion` ignored | `useReducedMotion()` hook pauses ParticleField and all CSS animations |
| Colour contrast fail on body copy | Opacity bumped from 0.65 → 0.75 (`--color-text-muted`) |
| Footer links were `<p>` tags | Changed to `<a>` elements with proper `href` |
| No skip-to-content link | Added skip link at top of `<body>` |
| Product cards not keyboard accessible | Added `tabIndex={0}`, `role="link"`, `onKeyDown` |

### 2. Performance
| Issue | Fix |
|---|---|
| O(N²) particle loop at N=90 | Reduced to N=50 (1225 pairs/frame vs 4005) |
| Font loaded via CSS `@import` (render-blocking) | Moved to `<link rel="stylesheet">` in `index.html` with `display=swap` |
| One IntersectionObserver per card | Extracted `useInView()` hook — one observer per instance, properly cleaned up |

### 3. UX & Interaction
| Issue | Fix |
|---|---|
| Active nav state stale on scroll | Added `IntersectionObserver` in `ChitiApp` to track `activeSection` on scroll |
| `e.target` style mutation caused flicker | Changed to `e.currentTarget` — avoids child element event confusion |
| Mobile nav missing | Added hamburger button + dropdown drawer, responsive via CSS `@media` |
| CTA buttons had no handlers | Added `onClick` with routing intent + `mailto:` for contact |

### 4. Code Quality
| Issue | Fix |
|---|---|
| Hardcoded colours everywhere | Extracted to `src/tokens.css` CSS custom properties |
| Layer card RGB hack | Replaced with `rgb` field on each layer object |
| Footer links unclickable | Converted to real `<a href>` elements |
| Data arrays defined inside components | Moved `LAYERS`, `PRODUCTS`, `NODES`, `VISION_THEMES` to module scope |

### 5. GitHub / Deploy
| Addition | Purpose |
|---|---|
| `index.html` | Full meta tags, OG image, Twitter card, JSON-LD structured data, font preload |
| `vite.config.js` | Base path toggle for GitHub Pages vs custom domain |
| `.github/workflows/deploy.yml` | Auto-deploy on push to `main` |
| `public/favicon.svg` | Branded SVG favicon |
| `public/site.webmanifest` | PWA manifest for mobile home screen |

---

## Outstanding Items (not in scope for this pass)

- [ ] Replace console.log routing with React Router or Next.js routes
- [ ] Add `og-image.png` (1200×630) and `apple-touch-icon.png` (180×180) to `/public`
- [ ] Upgrade IntelligenceLayer diagram to interactive animated node graph
- [ ] Add E2E tests (Playwright) for nav and scroll behaviour
- [ ] Consider migrating to TypeScript for prop safety

---

## File Structure

```
chiti/
├── public/
│   ├── favicon.svg
│   └── site.webmanifest
├── src/
│   ├── main.jsx          ← React entry point
│   ├── chiti.jsx         ← Main app (updated)
│   └── tokens.css        ← Design tokens & global styles
├── .github/
│   └── workflows/
│       └── deploy.yml    ← GitHub Pages auto-deploy
├── index.html            ← Full head with meta/OG/fonts
├── package.json
└── vite.config.js
```
