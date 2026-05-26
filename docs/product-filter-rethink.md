# Product filter UX rethink

Status: **Plan — not yet implemented**
Branch: `product-filter-rethink`
Owner: Shane

## Goal

Make the product filter on the SEAM Standard clearly discoverable, clearly stateful, and conceptually distinct from product navigation. Today it lives at the bottom of the left side nav, which buries it, conflates navigation with filtering, and hides active state when users scroll.

## Today (baseline)

Filter controls are in `src/components/standard/SideNav.astro`:

- **Three product groups**, mutually exclusive (one active filter at a time)
  - **Certification** → 4 rating-system buttons: `B+I:D`, `B+I:O`, `O+M:D`, `O+M:O`
  - **SEALs** → one button per seal (sourced from Sanity via `listSeals()`)
  - **Marks** → single "Mark-eligible activities" button
- **"Hide non-applicable" toggle** (dim ↔ hide) lives separately, in the Standard section header
- **"Share view"** copies a `?filter=…` URL

State is persisted to `localStorage` (key `seam:filter`, mode key `seam:filter-mode`) and mirrored to `?filter=` in the URL. Filter applies to every `[data-seam-filterable]` container (sidenav tree + activity grid on `/standard`).

### Problems

1. **Buried.** Filter sits below a 4-level deep nav tree. Small laptops require scrolling the sidebar to find it; mobile hides it behind a drawer.
2. **Conceptual confusion.** Section headers ("Certification", "SEALs", "Marks") are also links to those product pages. Same word, two meanings.
3. **State invisible on scroll.** A small filled dot is the only "you are filtering" cue; it scrolls out of view.
4. **Mode toggle disconnected** from the filter buttons it modifies.
5. **No explicit "clear filter".** Toggling the active item off is the only way out — not discoverable.

## Proposal: top filter bar (two-row expanded)

A sticky bar between the existing `TopBar.astro` and the page content, present only on pages where filtering applies.

### Layout

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ SEAM   [search.....................]                                                  │  TopBar (unchanged)
├──────────────────────────────────────────────────────────────────────────────────────┤
│ Filter by:                                                                            │  Product filter bar (new)
│   ◉ Certification     B+I:D    B+I:O    O+M:D    O+M:O                                │
│   ○ SEAL              Community Development     Ethical Procurement                   │
│   ○ Mark              Mark-eligible                                                   │
│                                                                                       │
│   Mode: ● Dim   ○ Hide                                  [ Clear filter ]  [ Share ]   │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### Behavior

- **Product row labels** (Certification / SEAL / Mark) are *labels*, not links. The filled radio shows which product family has an active filter. Clicking a label does nothing — clicking an option in the row activates the filter.
- **One filter active at a time**, same as today. Clicking the active option de-selects it (equivalent to "Clear filter").
- **Mode toggle is inline** in the bar so its scope is unambiguous.
- **Active filter chip** persists in the bar even when scrolled past content (the whole bar is sticky).
- **Clear filter** button appears only when a filter is active.
- **Share** retains current `?filter=` URL behavior.

### Responsive

- **Desktop (≥ lg)**: two-row expanded layout as drawn.
- **Tablet (md – lg)**: same layout, with seal/RS options wrapping.
- **Mobile (< md)**: collapsed to a single pill in the TopBar — `[ Filter ▾ ]` (or `[ Filter: B+I:D ✕ ]` when active). Tap opens a bottom sheet showing the expanded layout. Better than today, which requires opening the hamburger drawer and scrolling.

### Pages that show the bar

Activity-bearing pages only:

- `/`
- `/standard`
- `/[pillar]`, `/[pillar]/[concept]`, `/[pillar]/[concept]/[objective]`, `/[pillar]/[concept]/[objective]/[activity]`
- `/marks`
- `/seals`, `/seals/[slug]`
- `/certification`, `/certification/[rs]`

Hidden on: `/help`, `/glossary`, `/bibliography`, `/appendix`, `/appendix/[slug]`, `/intro/*`.

Implemented as an opt-in prop on `StandardLayout.astro`: `<StandardLayout showProductFilter>…`.

### Sidenav cleanup

The filter block in `SideNav.astro` (lines ~358–482) and the "Hide non-applicable" toggle (~207–249) are removed. Sidenav becomes a pure navigation tree. The filter scripts that bind to `data-seam-rs-toggle` etc. move with the controls into the new component.

## Implementation plan

### Step 1 — Extract filter state into a single component

Create `src/components/standard/ProductFilterBar.astro`:

- Renders the two-row bar with rating systems, seals (fetched via `listSeals()`), and the mark toggle.
- Hosts the inline mode toggle, "Clear filter", and "Share view" buttons.
- Owns the script that today lives at the bottom of `SideNav.astro` (the IIFE driving `localStorage` + `?filter=` + class painting). Move it verbatim — same storage keys, same data attributes — so existing shared `?filter=` links keep working.

### Step 2 — Mount it in `StandardLayout.astro`

Add a `showProductFilter` prop. When true, render `<ProductFilterBar>` directly below `<TopBar>`. Stick it at `top-12` (below the TopBar at `top-0`).

### Step 3 — Wire pages

In each activity-bearing page (`standard.astro`, the `[pillar]/...` dynamic routes, `/marks`, `/seals/*`, `/certification/*`), pass `showProductFilter`. Default is off, so non-filterable pages are unaffected.

### Step 4 — Remove duplicates from SideNav

Delete the filter block and the standalone mode toggle from `SideNav.astro`. Keep the `[data-seam-filterable]` attribute on the nav tree so it still responds to filter state from the new bar.

### Step 5 — Mobile sheet

Add a compact filter pill to `TopBar.astro` that's hidden on `≥ md`. Clicking opens a bottom sheet rendering the same `ProductFilterBar` content. State is shared (single source of truth via `localStorage` + DOM attribute on `<html>`).

### Step 6 — Visual polish

- Active filter chip in the bar: `Filtering: B+I:D ✕` — clicking ✕ clears.
- Disabled mode toggle when no filter active (so it's clear the toggle only matters when filtering).
- Subtle background so the bar reads as a control surface separate from content.

## Tradeoffs and risks

| Concern | Mitigation |
|---|---|
| +44–80px vertical on every filterable page | Bar is sticky and slim. Optionally auto-hide on scroll-down, show on scroll-up. |
| Sidenav users have to relearn | Filter is more findable, not less. Trade muscle memory for discoverability for new users. |
| Mobile bottom sheet adds a click vs. inline | Today's mobile path is worse (hamburger + scroll). Bottom sheet is one tap. |
| Existing `?filter=` shared links | Preserved exactly — same storage keys, same URL param syntax, same matcher regex. |

## Open follow-ups (not in this scope)

- Multi-filter (e.g. "Mark AND B+I:D"). Today it's strictly one. Possible v2 once the bar exists.
- A filter for activity type (Driver / Impact) — not currently filterable but visible in the data.
- Saved filter presets ("My configuration") — possible if customers ask.

## Reference: files touched in proposed implementation

- New: `src/components/standard/ProductFilterBar.astro`
- Modified: `src/layouts/StandardLayout.astro` (mount + prop)
- Modified: `src/components/standard/TopBar.astro` (mobile pill)
- Modified: `src/components/standard/SideNav.astro` (remove filter block + mode toggle, keep `data-seam-filterable` on tree)
- Modified per-page (pass `showProductFilter`): `src/pages/standard.astro`, `src/pages/marks.astro`, `src/pages/seals/index.astro`, `src/pages/seals/[slug].astro`, `src/pages/[pillar]/index.astro`, `src/pages/[pillar]/[concept]/index.astro`, `src/pages/[pillar]/[concept]/[objective]/index.astro`, `src/pages/[pillar]/[concept]/[objective]/[activity].astro`, `src/pages/certification.astro`, `src/pages/certification/[rs].astro`
- Unchanged: storage keys (`seam:filter`, `seam:filter-mode`), URL param (`?filter=`), the `[data-seam-filterable]` / `[data-filter-item]` / `[data-rs-*]` / `[data-mark]` / `[data-seals]` data attribute contract
