# ADDOZ — Sleek Design Spec (Directive 008)

**Bold + restrained, not bold + busy.** ADDOZ keeps its Neo-Brutalist character (black strokes, hard
shadows, heavy Plus Jakarta Sans, strong colour) and applies it with discipline: one loud idea per
section, calm surfaces around it, and motion that explains rather than performs.

Reference roles: Chowdeck (personality, colour, African energy) · Wone (hero restraint, editorial
composition) · GRB + Graduate Job Search (job discovery, filters, candidate/employer IA) · Hakuhodo
(scroll storytelling) · Shopify Partners (hierarchy, spacing, section rhythm, product presentation).
Nothing is copied; the references set the bar.

Tokens live in `app/globals.css` (`:root`). Chrome (header, drawer, footer, curtain) lives in
`styles/navigation.css`; homepage sections in `styles/home.css`; marketplace cards, jobs browser and
job detail in `styles/marketplace.css`; shared components in `styles/patterns.css`.

---

## 1. Typography

One family: **Plus Jakarta Sans** (`--font-addoz`, loaded by `next/font` as `--font-jakarta`).
Seven levels. Large type is reserved; everything else earns its size.

| Role | Token | Size (390 → 1440) | Weight | Line height | Tracking | Measure | Use |
|---|---|---|---|---|---|---|---|
| Display | `--type-display` | 48 → 95px (hero column) | 800 | 0.88 | −0.055em | 2 set lines | Hero statement only |
| H1 | `--type-h1` | 40 → 77px | 800 | 0.96 | −0.05em | 14ch | Page headings |
| H2 | `--type-h2` | 32 → 58px | 800 | 1.02 | −0.04em | 16–20ch | Major sections |
| H2 statement | `--type-h2-statement` | 36 → 74px | 800 | 0.98 | −0.045em | 12–14ch | Max two per page (employer, community) |
| H3 | `--type-h3` | 18 → 22px | 750 | 1.2 | −0.02em | 28ch | Cards, sub-sections |
| Lead | `--type-lead` | 17 → 21px | 500 | 1.45 | −0.01em | 42ch | Intro beside/below a heading |
| Body | `--type-body` | 15 → 16.5px | 400–500 | 1.6 | −0.005em | 62ch | Supporting copy |
| Small | `--type-small` | 14px | 500 | 1.5 | 0 | — | Card meta, helper text |
| Label | `--type-label` | 12px | 700 | 1.2 | +0.1em, uppercase | — | Eyebrows, section labels, table heads |
| Micro | `--type-micro` | 11px | 600 | 1.35 | +0.04em | — | Captions, sample tags, legal |

Rules
- Display appears once per page. H2 statement at most twice. Every other section uses H2.
- Headlines use **set line breaks** (`<br>` / spans) on desktop and `text-wrap: balance` below 768px,
  so nothing strands a single word. Never let a headline run wider than its measure.
- Numbers use `font-variant-numeric: tabular-nums` (salaries, counts, steps).
- Purple inside a headline marks the one phrase that matters ("NEXT MOVE."), never decoration.
- Eyebrows: Label style, preceded by a 24px rule, colour `--addoz-black-60`; they decode once (GSAP).

## 2. Spacing

A 4px base (`--sp-1 … --sp-24`) and five rhythm tokens. No section gets its height from
`min-height: 100vh`; content and padding decide. The only full-viewport element is the pinned
Career Journey stage, where the pin itself is the design reason.

| Token | Value | Use |
|---|---|---|
| `--space-section` | clamp(4rem, 2.5rem + 4.6vw, 7rem) | Default section padding (block) |
| `--space-section-sm` | clamp(3rem, 2rem + 3vw, 5rem) | Bands, CTA strips, dense sections |
| `--space-heading` | clamp(2rem, 1.4rem + 2vw, 3.5rem) | Section heading → content |
| `--gap-card` | clamp(0.75rem, 0.5rem + 0.8vw, 1.25rem) | Card grids |
| `--gutter` | clamp(1rem, 0.25rem + 3.75vw, 4rem) | Page gutter (360 → 16px, 1440 → 58px) |

- Content is capped at `--content-max: 1360px`; wider screens grow the margins, not the line length
  (`.container` / `padding-inline: var(--page-inline)`).
- Inside components use the 4px scale only: 8 between label and title, 12–16 between title and meta,
  24–32 between groups. No one-off pixel values.
- Two adjacent sections on the same background merge their padding (the second uses `--space-section-sm`
  on top) so light-on-light never produces a double gap.

## 3. Section rhythm

The homepage alternates attention deliberately:

| # | Section | Tone | Surface |
|---|---|---|---|
| 1 | Hero — FIND YOUR NEXT MOVE. | Quiet | Cream |
| 2 | Ticker | Bold (thin) | Near black |
| 3 | Opportunity board | Product | Cream |
| 4 | What's your thing? + locations | Bold | Near black |
| 5 | Career journey (pinned story) | Product | Cream-dark stage |
| 6 | Your next great hire? | Bold | Yellow (employer/opportunity) |
| 7 | Career Intelligence | Product, quiet | Cream |
| 8 | Real people. New chapters. | Editorial | Purple (community) |
| 9 | Don't miss your next thing | Quiet | Cream |
| 10 | Footer | Close | Near black |

Colour creates the rhythm; type size does not. Only sections 1, 6 and 8 get statement-scale type.

## 4. Colour usage

> **Implemented palette** (verified against `app/globals.css`): the primary colour is purple `#800CB6`
> (`--primary`, `--addoz-purple`). The other brand colours are cream `#FAF6EB`, ink `#0E0C11`,
> yellow `#FABA16` and orange `#FF943B`. There is no blue/cobalt primary, and one must not be reintroduced.

| Colour | Token | Role |
|---|---|---|
| Warm off-white `#FAF6EB` | `--addoz-cream` | Primary canvas |
| Cream dark `#F0EADB` | `--addoz-cream-dark` | Quiet bands, product stages, footers of cards |
| White `#FFFFFF` | `--addoz-white` | Surfaces: cards, inputs, panels |
| Near black `#0E0C11` | `--addoz-ink` | Dramatic sections (explore, ticker, footer) |
| Black `#000000` | `--addoz-black` | Type, strokes, hard shadows |
| Purple `#800CB6` | `--addoz-purple` | Brand, primary action, community moment, focus. |
| Yellow `#FABA16` | `--addoz-yellow` | Employer / opportunity moments, stickers — black text only |
| Orange `#FF943B` | `--addoz-orange` | Selective emphasis only (one mark per view) — black text only |

- Purple text only on cream/white (7.3:1+). On near black, purple is a shape or fill; text stays cream.
- One accent per component. A card never uses purple + yellow + orange at once.
- Hairlines: `--line` (black 12%) on light, `--line-inverse` (cream 16%) on dark.

## 5. Card system

Four levels. Related, never repetitive — pick the lowest level that does the job.

| Level | Class | Construction | Use |
|---|---|---|---|
| 0 Flat | `.card-flat` | No stroke, no shadow; optional tint | Editorial blocks, steps, resources |
| 1 Outline | `.card-outline` | 1px `--line`, white | Quiet containers, filters, secondary panels |
| 2 Frame | `.card-frame` | 1px black stroke, white; **hover** lifts 2px with a 4px hard shadow | Job cards, tool cards, company/category/location cards |
| 3 Raised | `.card-raised` | 2px black stroke + 4–6px hard shadow at rest | One or two per view: hero search, product stage, key CTA |
| Image-led | `.card-image` | Image fills a framed area (1px stroke), caption outside the image | Portraits, employer photo |

- Radius: cards `--radius-card` 8px; controls `--radius-control` 4px; tags 3px. No pills except
  status dots and avatars.
- Shadows only as black offsets (never blur); at rest only on level 3.
- Card content order: identity (mark + company) → title (H3) → meta (Small, separated by ·) →
  salary / key fact → footer action. Tags are plain text or 3px-radius outlines, never filled pills.

## 6. Button system

Rectangular, 4px radius, 2px black stroke, weight 700. Tactility comes from **shadow displacement**:
at rest flat; hover lifts `translate(-2px,-2px)` with a 3px hard shadow; press returns to 0.

| Variant | Fill / text | Use |
|---|---|---|
| `primary` | Purple / white | The single primary action per view |
| `dark` | Black / cream | Secondary strong action, header CTA |
| `light` | White / black | Tertiary, on colour |
| `yellow` | Yellow / black | Employer actions on cream |
| `invert` | Cream stroke / cream | On near black / purple |
| `ghost` | Text + underline | Inline actions |

Sizes: `sm` 40px · `md` 48px · `lg` 56px (hero search). Icon (arrow) trails the label and travels
out-and-back on hover. Magnetic pull (GSAP) only on one primary CTA per section, fine pointers only.

## 7. Imagery

- Authentic, editorial portraits of Nigerian professionals (`/images/talent-editorial*.png`,
  `/images/team-editorial.png`) — cropped with intent: tall 4:5 frames, faces on the upper third,
  single-colour grounds (white/purple/orange) that echo the palette.
- Frames: 1px black stroke, 8px radius, no drop shadows on photos; overlap two frames at most.
- Movement: slow scroll crop (image scale 1.08 → 1, object-position drift) and pointer depth on desktop.
  Never autoplaying loops.
- Mobile keeps imagery: the hero portraits become a three-frame strip under the search.
- Not every section gets a photo. Whitespace, type and product UI carry the rest.

## 8. Navigation

- Desktop: logo · Jobs · Career Intelligence (AI) · For Employers · About — then **Log in** (text) and
  **Get started** (dark button). Dropdown panels are flat cream sheets with hairline dividers:
  intro on the left, links as text rows (title + one line) on the right. No cards, no shadows.
- Header: 64px, cream, hairline bottom border that appears after scrolling.
- Below 1024px: logo + menu button only (phones), plus Log in/Get started on tablets. The drawer is a
  full-height cream sheet: large group titles as an accordion, account actions pinned to the bottom.

## 9. Responsive principles

Validated at 360 · 390 · 430 · 768 · 1024 · 1280 · 1440 · 1920.
- Phones get their own composition: search first, portraits as a strip, one-column cards with
  generous tap targets (≥44px), filter sheet instead of a sidebar, sticky apply bar on job detail.
- Tablets (768–1023) use two-column grids and the drawer navigation; no pinned scrolling.
- Desktop pins the journey only when the viewport is ≥1024px wide **and** ≥700px tall.
- ≥1440 grows margins, not measure. Nothing scrolls horizontally, ever.

## 10. GSAP principles

Smooth · quiet · intentional. Motion clarifies hierarchy and continuity; it is never the content.

| Tool | Where | Why |
|---|---|---|
| SplitText | Hero statement (words), section H2 (lines, once) | Establish hierarchy on arrival |
| ScrollTrigger | Journey pin + progress; lazy reveals of groups (not every card) | Storytelling, pacing |
| Flip | Board tabs, jobs filters, card → job detail title/mark | Continuity of objects |
| Timelines | Hero entrance, journey stage states | One authored sequence per moment |
| quickTo / magnetic | Hero search button, one CTA per section | Tactile response |
| Page transition | Curtain between pages; instant for search/filters | Continuity without delay |

Rules: animate transforms and opacity only; durations 0.35–0.9s, `power3.out` / `expo.out`; stagger
≤ 0.08s; reveal groups, not every element; no infinite motion except the pausable ticker; every
effect behind `prefers-reduced-motion: no-preference`; content is complete without JavaScript motion.

## 11. Visual hierarchy checklist (run before shipping any view)

1. Is there exactly one loudest thing, and is it the right one?
2. Does every heading have the right level — or is it just big?
3. Does each component use one treatment (stroke **or** fill **or** shadow), not all three?
4. Is every large gap explained by the rhythm, not by `min-height`?
5. Can a candidate read a job card's title, company, location, type and salary in two seconds?
6. Does it still feel ADDOZ — African, Neo-Brutalist, recruitment-first — at 390px?
