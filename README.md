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
cp .env.example .env.local       # fill in SANITY_PROJECT_ID once studio is wired
npm run dev
```

## URL shape
```
/                                                  → home
/[pillar]                                          → pillar landing
/[pillar]/[concept]                                → concept landing
/[pillar]/[concept]/[objective]                    → objective landing
/[pillar]/[concept]/[objective]/[activity]         → activity page (e.g. /social-impact/impact-assessment/contextual-analysis/iaa1-1)
```

## Status
Scaffold only. Section renderers (Scope, Requirements, Indicators, Scoring,
Documentation, Definitions, Guidance, Referenced Source) intentionally not
built yet — first content load will be Activity IAa1.1, hand-modeled in Sanity.
