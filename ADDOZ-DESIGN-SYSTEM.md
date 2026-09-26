# ADDOZ Design System

**Directive:** 003  
**Date:** 2026-09-22  
**Status:** Complete — CSS visual system restored

---

## Philosophy

**Neo-Brutalism + Premium Editorial + African Digital Personality.**

ADDOZ uses hard edges, deliberate box-shadows with no blur, bold weight contrast, and a warm African-digital palette. There is no glassmorphism, no excessive border-radius, no decorative gradients. Confidence is expressed through mass and contrast — not softness.

---

## Colour Palette

| Token                | Value       | Usage                              |
|----------------------|-------------|-------------------------------------|
| `--addoz-cream`      | `#F7F4EA`   | Global background, cards            |
| `--addoz-black`      | `#111111`   | Text, borders, dark surfaces        |
| `--addoz-cobalt`     | `#3157FF`   | Primary brand, CTAs, links          |
| `--addoz-yellow`     | `#FFD23F`   | Highlights, hero spark, employer bg |
| `--addoz-orange`     | `#FF6B35`   | Secondary accent, badges            |
| `--addoz-green`      | `#20C878`   | Status, success, live dot           |
| `--addoz-cream-dark` | `#EFECE0`   | Alternate surface, toolbar bg       |
| `--addoz-cream-light`| `#FDFBF4`   | Card backgrounds                    |

### Opacity-derived neutrals
```css
--addoz-black-80: rgba(17,17,17,0.8)
--addoz-black-40: rgba(17,17,17,0.4)
--addoz-black-12: rgba(17,17,17,0.12)
--addoz-black-06: rgba(17,17,17,0.06)
```

---

## Typography

**Font:** Plus Jakarta Sans (loaded via `next/font/google` in `app/layout.tsx`)  
**Variable:** `--font-plus-jakarta-sans` → consumed as `--font-addoz: var(--font-plus-jakarta-sans, ...)`

### Fluid Type Scale

All sizes use `clamp()` for fluid scaling between mobile and desktop.

| Token           | Min        | Mid          | Max        |
|-----------------|-----------|--------------|-----------|
| `--text-xs`     | `0.65rem` | —            | `0.75rem` |
| `--text-sm`     | `0.75rem` | —            | `0.875rem`|
| `--text-base`   | `0.875rem`| —            | `1rem`    |
| `--text-md`     | `1rem`    | —            | `1.125rem`|
| `--text-lg`     | `1.125rem`| —            | `1.375rem`|
| `--text-xl`     | `1.375rem`| —            | `1.75rem` |
| `--text-2xl`    | `1.75rem` | —            | `2.5rem`  |
| `--text-3xl`    | `2.25rem` | —            | `3.75rem` |
| `--text-4xl`    | `3rem`    | —            | `5.5rem`  |
| `--text-5xl`    | `4rem`    | —            | `8rem`    |
| `--text-display`| `5rem`    | —            | `11rem`   |

### Typographic conventions
- **Headings:** Weight 900, `letter-spacing: -0.04em` to `-0.055em`, `line-height: 1` or `0.95`
- **Body:** Weight 400–500, `line-height: 1.6`
- **Labels / eyebrows:** Weight 700–800, `letter-spacing: 0.08em–0.15em`, `text-transform: uppercase`
- **Numbers / indexes:** Weight 900, `letter-spacing: 0.1em`

---

## Spacing Scale

```css
--sp-1:  0.25rem   (4px)
--sp-2:  0.5rem    (8px)
--sp-3:  0.75rem   (12px)
--sp-4:  1rem      (16px)
--sp-5:  1.25rem   (20px)
--sp-6:  1.5rem    (24px)
--sp-8:  2rem      (32px)
--sp-10: 2.5rem    (40px)
--sp-12: 3rem      (48px)
--sp-16: 4rem      (64px)
--sp-20: 5rem      (80px)
--sp-24: 6rem      (96px)
```

### Section spacing (fluid)
```css
--section-v: clamp(4rem, 2rem + 8vw, 10rem)   /* vertical section padding */
--section-h: clamp(1.25rem, 1rem + 3vw, 3rem)  /* horizontal page gutter  */
```

---

## Border System

```css
--border:       1px solid #111111        /* standard hard neo-brutalist border */
--border-2:     2px solid #111111        /* emphasis border (cards, inputs)    */
--border-light: 1px solid rgba(17,17,17,0.12)  /* subtle dividers           */
--border-mid:   1px solid rgba(17,17,17,0.4)   /* medium dividers           */
```

### Border Radius

ADDOZ uses restrained radius — neo-brutalism prefers hard corners.

```css
--radius-sm:   2px    /* tags, chips, tiny badges */
--radius:      4px    /* small buttons, form elements */
--radius-md:   6px    /* search bar, toolbar */
--radius-lg:   10px   /* cards */
--radius-xl:   16px   /* feature cards */
--radius-full: 9999px /* pills, status dots, avatars */
```

---

## Shadow System (Neo-Brutalist)

Offset shadows with zero blur — creates a physical, printed-matter feel.

```css
--shadow-xs:     2px 2px 0 0 #111111    /* tiny controls */
--shadow-sm:     3px 3px 0 0 #111111    /* cards at rest */
--shadow:        4px 4px 0 0 #111111    /* cards hover, inputs */
--shadow-lg:     6px 6px 0 0 #111111    /* feature cards, modals */
--shadow-xl:     8px 8px 0 0 #111111    /* highest emphasis */
--shadow-cobalt: 4px 4px 0 0 #3157FF   /* brand primary */
--shadow-yellow: 4px 4px 0 0 #FFD23F   /* employer section */
--shadow-orange: 4px 4px 0 0 #FF6B35   /* secondary accent */
```

**Hover pattern:** cards lift `translate(-2px, -3px)` and shadow increases from `--shadow-sm` to `--shadow-lg`.  
**Active pattern:** elements press `translate(2px, 2px)` and shadow collapses to `0`.

---

## Button System

Base class: `.action-button`

| Class           | Background          | Color          | Border         | Shadow           |
|-----------------|---------------------|----------------|----------------|------------------|
| `.action-dark`  | `--addoz-black`     | `--addoz-cream`| `--addoz-black`| `--shadow`       |
| `.action-yellow`| `--addoz-yellow`    | `--addoz-black`| `--addoz-black`| `--shadow`       |
| `.action-blue`  | `--addoz-cobalt`    | `#fff`         | `--addoz-black`| `--shadow`       |
| `.action-orange`| `--addoz-orange`    | `#fff`         | `--addoz-black`| `--shadow`       |
| `.action-ghost` | transparent         | `--addoz-black`| `--addoz-black`| none             |
| `.brand-button` | `--addoz-cobalt`    | `#fff`         | `--addoz-cobalt`| `--shadow-cobalt`|

All buttons: `padding: 0.75em 1.5em`, `font-weight: 700`, `border-radius: --radius`.

---

## Z-Index Scale

```css
--z-base:    0
--z-above:   10
--z-sticky:  100
--z-nav:     200
--z-overlay: 300
--z-modal:   400
--z-curtain: 500
--z-toast:   600
```

---

## Breakpoints

| Name            | Width     | What changes                         |
|-----------------|-----------|--------------------------------------|
| Compact mobile  | < 480px   | Single-column everything, tight gutter|
| Large mobile    | 480–639px | Search fields inline                 |
| Small tablet    | 640–767px | 2-col grid, portraits hidden         |
| Tablet          | 768–899px | 2-col hero layout, portraits visible |
| Large tablet    | 900–1023px| Desktop nav visible                  |
| Desktop         | 1024–1279px| Full 3-col grids                    |
| Wide desktop    | 1280–1439px| Larger gutters                      |
| Capped          | 1440px+   | max-width: 1440px on content         |
| Ultra-wide      | 1920px+   | Increased section spacing            |

---

## GSAP Integration

All GSAP animations live in component `useGSAP()` hooks, registered in `lib/motion.ts`.

### Global motion constants (`lib/motion.ts`)
```ts
export const motion = {
  ease: "power3.out",
  duration: 0.65,
  stagger: 0.065,
}
```

### Reduced motion gate
```ts
gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
  // all animations here
})
```
CSS also provides reduced-motion fallback: `animation-duration: 0.01ms`, all GSAP targets at their final state via `[data-reveal] { opacity: 1; transform: none }`.

### GSAP targets — do not rename these classes

| Class / selector         | GSAP usage                                              |
|--------------------------|--------------------------------------------------------|
| `.hero-eyebrow`          | Fade + slide up on load                                 |
| `.hero-line`             | SplitText word mask, each word reveals up               |
| `.hero-spark`            | Scale pop after heading reveal                          |
| `.hero-description`      | Fade + slide up after heading                           |
| `.hero-search`           | Fade + slide up                                        |
| `.popular-searches`      | Fade + slide up (stagger)                              |
| `.portrait-card`         | Staggered scale + fade on scroll                       |
| `.chapter-sticker`       | Pop after portraits                                    |
| `.hero-scroll`           | Fade in last                                           |
| `[data-reveal]`          | ScrollTrigger: fade + translateY on all section h2s   |
| `[data-tool-card]`       | ScrollTrigger: staggered reveal on `.tools-grid` children|
| `[data-magnetic]`        | Pointer tracking magnetic buttons                      |
| `.job-card`              | GSAP Flip — requires `data-flip-id` attr               |
| `.category-panel`        | GSAP Flip on accordion open/close                      |
| `.journey-inner`         | ScrollTrigger `pin: true`, `scrub: 0.6`, desktop only  |
| `.journey-progress-fill` | width driven by scrub                                  |
| `.community-story`       | Slide transition y + opacity                           |
| `.mobile-nav a`          | Staggered reveal on menu open                          |
| `.newsletter-status`     | Fade in on form submit                                 |
| `.page-curtain`          | yPercent 100↔0 on navigation                          |
| `.ticker-track`          | Continuous x translate (opportunity ticker)            |

---

## Section Colour Coding

| Section              | Background              | Text                |
|----------------------|------------------------|---------------------|
| Hero                 | `--addoz-cream`        | `--addoz-black`     |
| Opportunity Ticker   | `--addoz-black`        | `--addoz-cream`     |
| Job Discovery        | `--addoz-cream`        | `--addoz-black`     |
| Explore              | `--addoz-black`        | `--addoz-cream`     |
| Career Journey       | `--addoz-cream`        | `--addoz-black`     |
| Employer             | `--addoz-yellow`       | `--addoz-black`     |
| Career Intelligence  | `--addoz-cream`        | `--addoz-black`     |
| Community            | `--addoz-cobalt`       | `--addoz-cream`     |
| Newsletter           | `--addoz-cream`        | `--addoz-black`     |
| Footer               | `--addoz-black`        | `--addoz-cream`     |
| Page Curtain         | `--addoz-cobalt`       | `#fff`              |

---

## Prototype Elements (to remove before production)

See `ADDOZ-PROTOTYPE-GAPS.md` → **PROTOTYPE ELEMENTS TO REMOVE BEFORE PRODUCTION** table.

Key items:
- `.prototype-dot` — remove once live jobs exist
- `.prototype-banner` — remove on job detail page once live
- `.save-notice` — replace with authenticated UX
- `.tools-note` — remove once AI tools are native
- `lib/demo-jobs.ts` — delete once database jobs are wired

---

## File Structure Reference

```
app/
  globals.css         ← This design system (all custom CSS)
  layout.tsx          ← Plus Jakarta Sans loaded, html class, PageTransition
  page.tsx            ← Mounts <Homepage />
lib/
  motion.ts           ← GSAP singletons, motion constants, reducedMotion()
  utils.ts            ← cn() utility (clsx + tailwind-merge)
  demo-jobs.ts        ← PROTOTYPE ONLY — hardcoded job data
components/
  addoz/              ← All ADDOZ components (do not refactor structure)
  ui/                 ← shadcn/Base UI primitives
```
