# benwolfram.com

Personal site. React + Vite, with a hand-written WebGL background (`src/Gradient.jsx`). It renders slow-moving folds of dark green silk.

## Develop

```bash
npm install
npm run dev
```

## Content

Copy, projects, company logos and work history live in `src/content.js`. Projects with `name: null` render as a redaction bar until they're announced. Logos are single-colour SVGs in `public/logos/`, tinted via CSS masks.

## Deploy

Pushing to `main` builds and deploys to GitHub Pages via `.github/workflows/deploy-pages.yml`.
