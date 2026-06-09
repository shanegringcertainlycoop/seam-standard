# seam-standard

The digital reference for the SEAM Standard. Reads structured content from Sanity, renders activity pages organized by pillar → concept → objective → activity.

Sibling repo: [`studio-seam-standard`](../studio-seam-standard) (Sanity studio).
Related: [`SEAM`](../SEAM) (marketing site — separate domain, separate codebase).

## Stack
- Astro 5 + Tailwind v4
- TypeScript strict
- `@sanity/client` for content
- Netlify deploy (target: `standard.seamcertification.org`)

## Setup
```bash
npm install
cp .env.example .env.local       # SANITY_PROJECT_ID=2eylxib9, SANITY_DATASET=production
npm run dev
```

## Scripts
```bash
npm run dev       # local dev server
npm run build     # production build → dist/
npm run preview   # serve the production build locally
```

## URL shape
```
/                                                  → home
/standard                                          → standard overview
/[pillar]                                           → pillar landing
/[pillar]/[concept]                                 → concept landing
/[pillar]/[concept]/[objective]                     → objective landing
/[pillar]/[concept]/[objective]/[activity]          → activity page (e.g. /social-impact/impact-assessment/contextual-analysis/iaa1-1)
/marks, /seals, /seals/[slug]                       → SEAM Marks + Seals product pages
/intro, /appendix, /glossary, /bibliography         → front/back matter
/certification, /certification/[rs]                 → rating-system / certification pages
```

## JSON APIs
```
/api/activities.json     /api/marks.json     /api/seals.json     /api/search-index.json
```

## Content sections
Activity pages render from Sanity via discrete section components in
`src/components/standard/` — Scope, Requirements, Indicators, Scoring,
Documentation, Definitions, Guidance, ReferencedSources — plus navigation
chrome (SideNav, Breadcrumb, PrevNextNav, SiteSearch, ProductFilterBar).
