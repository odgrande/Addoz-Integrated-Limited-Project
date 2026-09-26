# ADDOZ — Frontend Audit

**Directive:** 006 — V0 → Production-Grade Frontend Experience
**Date:** 2026-09-22
**Scope:** Re-audit of the codebase left by Directives 002–005, focused on what Directive 006 actually needs to change.

This document does not repeat the full component/GSAP/a11y/SEO inventory already recorded in `ADDOZ-CURRENT-STATE.md` (Directive 002) — that inventory is still accurate. This is the delta: what Directive 006 found, fixed, deliberately deferred, and why.

---

## 1. Starting point

The prototype was **not** a rough v0 export needing a redesign. By the time Directive 006 started, four prior sessions had already:

- Wired the real homepage, restored all component CSS (`ADDOZ-DESIGN-SYSTEM.md`)
- Fixed a critical hero grid-placement bug and a portrait-stacking bug (`ADDOZ-VISUAL-QA.md`)
- Verified GSAP cleanup, accessibility, contrast, and responsive behaviour at 360–1440px

The screenshot reviewed at the start of this directive was accurate: hero, category section, employer section, and community section were already strong. The one section that was visibly unresolved was **Career Journey** — and the brief was explicit that the fix should be *refinement*, not a rebuild of the design language.

## 2. Root cause found in Career Journey

Two structural bugs, not a content problem, were producing the "repetitive blocks with empty space" the brief described:

1. **CSS/JSX mismatch.** `app/globals.css` styled step titles via `.journey-step-body h3` / `.journey-step-body p`, but `career-journey.tsx` never rendered a `.journey-step-body` wrapper — the `<h3>`/`<p>` were direct children of `.journey-step`. Those selectors never matched, so step titles rendered with default browser heading margins instead of the design system's type scale.
2. **Static flow instead of a real stage.** `.journey-stage` was `display: flex; flex-direction: column`, and all three `.journey-step` panels sat in normal document flow. The GSAP timeline animated `autoAlpha`/`y` to crossfade panels, but fading a panel to `autoAlpha: 0` does not remove it from flow — its box still reserved vertical space. Scrolling through the pinned section produced three stacked, partially-transparent panels rather than one panel replacing another, which read as repetition and dead space.

Fix applied (see `ADDOZ-MOTION-SYSTEM.md` for the full choreography): at `≥900px` the three panels are `position: absolute; inset: 0` inside a `min-height`-bound `.journey-stage`, so only the active panel occupies visual space. Below `900px` — where the pin/scrub animation never activates — panels stay in normal static flow as a clean stacked list, which satisfies the brief's "mobile becomes a clean stacked experience" requirement without any separate mobile-only markup.

Each step also got a distinct visual mockup (search bar, shortlist rows, confirmation card) instead of three copies of the same generic "mini card," so the section now tells three different visual beats instead of repeating itself.

A regression was introduced and caught during this fix: an extra `return () => mm.revert()` inside the `gsap.matchMedia().add()` callback caused `MatchMedia.revert()` to call itself recursively (`RangeError: Maximum call stack size exceeded`), which Next.js's error boundary caught as "Unexpected error." Removed — `mm.revert()` belongs only at the outer `useGSAP` cleanup; GSAP's matchMedia already reverts everything created inside each `mm.add()` context automatically.

## 3. Component classification

| Component | Status | Action this directive |
|---|---|---|
| `career-journey.tsx` | Rebuilt | Structural fix + distinct per-step visuals (§2) |
| `hero.tsx`, `homepage.tsx`, `job-discovery.tsx`, `explore.tsx`, `community.tsx` | Production-worthy prototype code | Verified against current CSS; no structural issues found |
| `ecosystem.tsx` (Employer + Career Intelligence) | Production-worthy | Verified; yellow/cream rhythm preserved |
| `site-header.tsx`, `site-footer.tsx`, `page-transition.tsx` | Production-worthy | Verified; one a11y fix applied (see §4) |
| `lib/motion.ts` | Production-worthy | Documented in `ADDOZ-MOTION-SYSTEM.md`; kept as-is (see §5) |
| `lib/demo-jobs.ts` | Prototype-only, correctly labelled | Unchanged — superseded when live job data lands (`ADDOZ-PROTOTYPE-GAPS.md` GAP-001) |
| `app/jobs/[id]/page.tsx` | Prototype-only, correctly labelled | Unchanged |

No dead or duplicate components were found. No parallel implementations were created.

## 4. Fixes applied

- **Career Journey** — structural rebuild (§2).
- **Accessibility** — `ArrowUpRight` icons inside the hero's "Try searching" pills now carry `aria-hidden="true"` (previously announced as "Development & IT ↗" to screen readers; flagged as A-002 in `ADDOZ-VISUAL-QA.md`).

## 5. Deliberate non-changes, and why

Directive 006 asks for several things that this session evaluated and chose **not** to do wholesale, because doing them would have worked against the brief's own instruction to chase *better* design, not *more* of it:

- **No `animations/` folder reorg.** `lib/motion.ts` is a single 23-line plugin-registration module; every component owns its own `useGSAP()` call scoped to itself, gated by the same `matchMedia` convention. This is the idiomatic GSAP+React pattern (colocation, automatic cleanup via `scope`), not "scattered random GSAP code." Moving animation logic out of components into a parallel `animations/` tree would fragment component/behaviour locality for no functional gain. See `ADDOZ-MOTION-SYSTEM.md` for why this already satisfies the directive's intent.
- **No wholesale route scaffolding.** The directive lists ~14 target routes (`/companies`, `/career-tools/*`, `/for-employers`, etc.). Only `/jobs/[id]` exists today; there is no standalone `/jobs` listing route because job discovery currently lives as a homepage section. Generating a dozen near-empty placeholder pages would add dead weight without content, which conflicts with "no half-finished implementations." The target structure is already recorded in `ADDOZ-ARCHITECTURE-DECISIONS.md` (ADR-013); this directive did not re-scaffold it. Flagged here as an open decision — see §6.
- **No broad primitive extraction.** `.eyebrow`, `.action-button`, `.section-heading` etc. are already shared CSS classes reused across every section — that's real reuse at the styling layer. Wrapping them in React components (`<Eyebrow>`, `<ActionButton>`) would touch 8+ files for a cosmetic win. Not done in this pass; noted as a candidate if a future directive wants to reduce JSX duplication specifically.

## 6. Open items for the next directive

Concrete, unresolved, worth prioritizing explicitly rather than guessing at scope:

1. **`/jobs` listing route.** Decide whether job discovery should get its own route (directive's routing plan) or stay a homepage section with the existing `/jobs/[id]` detail route. This is a product decision, not a technical one.
2. **Mobile viewport screenshots.** This session's browser automation tool did not reliably emulate a narrow viewport (`resize_window` did not change the rendered layout in this environment) — mobile correctness for the Career Journey rebuild was verified by code review (same `@media` convention already validated at 360–1440px in Directive 004/005) but not re-screenshotted live. Worth a manual check.
3. Everything already tracked as open in `ADDOZ-PROTOTYPE-GAPS.md` and the "Known Limitations" table in `ADDOZ-VISUAL-QA.md` (real job data, live search, auth, portrait card 03 edge clip, nav wrap at 768px) is unchanged by this directive.

## 7. Validation performed

| Check | Result |
|---|---|
| `tsc --noEmit` | Clean, zero errors |
| `next build` (production) | Successful, zero warnings |
| Dev server browser pass (1440px, 1536px effective) | Career Journey crossfades correctly through all 3 steps; no layout gaps; progress bar tracks step index |
| Full homepage scroll-through | Section-to-section rhythm (cream → black → cream → yellow → cream → cobalt → cream → black) reads as intentional, matches `ADDOZ-DESIGN-SYSTEM.md` §"Section Colour Coding"; no changes needed beyond Career Journey |
