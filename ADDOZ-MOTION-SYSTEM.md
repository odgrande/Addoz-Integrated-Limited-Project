# ADDOZ — Motion System (Directive 006)

**Status:** Documents the existing architecture (built across Directives 002–005) and the Career Journey choreography rebuilt in Directive 006. This is the system, not a proposal to change it.

---

## 1. Why there is no `animations/` folder

Directive 006's brief asks for "a real motion architecture" and warns against "scattering random GSAP code throughout components." The existing structure already satisfies that intent — it just doesn't look like a separate `animations/` tree, because that's the wrong shape for this codebase's size:

- **One registration point.** `lib/motion.ts` (52 lines) calls `gsap.registerPlugin()` exactly once for the whole app and re-exports `gsap`, `ScrollTrigger`, `SplitText`, `Flip`, `DrawSVGPlugin`, `ScrambleTextPlugin`, `useGSAP`, plus the shared values `motion = { ease, duration, stagger }` and `reducedMotion()` and two icon helpers, `drawIcons()` and `redrawIcon()`. Every plugin ships in the public `gsap` package (3.15.0, the latest), so nothing extra is installed.
- **Every animation is colocated with the component it animates**, via `useGSAP(() => { ... }, { scope: root })`. `scope` auto-qualifies GSAP selectors to that component's DOM subtree and auto-reverts everything on unmount — this is the pattern the `@gsap/react` library is designed around, not an ad-hoc convention.
- **One reduced-motion gate, applied identically everywhere:** `gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => { ... })`, cleaned up with `return () => mm.revert()` in the outer `useGSAP` return. Nine components follow this exact shape.

Splitting this into `lib/animations/hero.ts`, `lib/animations/journey.ts`, etc. would separate each animation from the JSX and refs it targets, for a codebase where no component's animation logic exceeds ~25 lines. That's a real cost (two files to open instead of one, prop-drilling refs across a file boundary) for no corresponding benefit at this scale. Revisit only if a single component's motion logic grows large enough to warrant extraction on its own.

## 2. Reduced-motion contract (non-negotiable, already correct)

Every spatial animation in the app is gated behind `gsap.matchMedia("(prefers-reduced-motion: no-preference)")`. With reduced motion enabled:
- No ScrollTrigger pins, no scrub, no entrance timelines run.
- CSS fallback (`app/globals.css`) sets `[data-reveal] { opacity: 1; transform: none }` so content is never stuck invisible.
- Magnetic buttons, the opportunity ticker, and the Career Journey pin all check `reducedMotion()` or are wrapped in the same matchMedia gate.

This was audited and confirmed correct in Directive 004 (`ADDOZ-VISUAL-QA.md` §8) and re-verified for the Career Journey rebuild in this directive.

## 3. GSAP target registry

Do not rename these classes without updating the corresponding `useGSAP` call — they are the JS/CSS contract.

_Round 3 (2026-09-23): `[data-reveal]` moved to SplitText line masks; entrances added to the job board, explore, employer and community sections, all inside the same reduced-motion gate._

_Round 4 (2026-09-23): DrawSVGPlugin + ScrambleTextPlugin registered. Eyebrow labels decode, line icons trace in, and a hover layer covers arrows, card icons, job-card marks and the logo spark; the hero collage gets pointer depth and the journey mockups build with the scroll. Everything is inside the reduced-motion gate; the save pop checks `reducedMotion()`. Two pitfalls: DrawSVGPlugin renders after CSSPlugin, so a `clearProps` inside a `drawSVG` tween gets overwritten (clear the dash styles `onComplete`, as `drawIcons` does); and `gsap.set` rounds px `width`/`height` unless `autoRound: false`._

| Class / selector | Component | Behaviour |
|---|---|---|
| `.hero-eyebrow`, `.hero-line`, `.hero-spark`, `.hero-description`, `.hero-search`, `.popular-searches`, `.portrait-card`, `.chapter-sticker` | `hero.tsx` | Entrance timeline: SplitText word-mask heading, staggered reveals |
| `.hero-spark` (2nd usage) | `hero.tsx` | Scroll-scrubbed rotation parallax |
| `.portrait-card`s + `.chapter-sticker` (pointer depth) | `hero.tsx` | ≥900px, fine pointer: `quickTo` x/y drift with the pointer (6–18px by depth), then settle on `pointerleave`. Listening starts 1.7s after load, so it never fights the entrance's `y`. |
| `.ticker-track` | `hero.tsx` (`OpportunityTicker`) | Continuous `xPercent` marquee, pause/play via ref |
| `[data-reveal]` (+ `.reveal-line`, `.reveal-line-mask` while split) | `homepage.tsx` (global) | Every section `<h2>`: SplitText `mask: "lines"` + `autoSplit`; lines rise `yPercent: 110 → 0` (`expo.out`, 0.95s, stagger 0.1) at `top 88%`, `once: true`, then the split is reverted so the heading's DOM and accessible text are exactly what React rendered. `.reveal-line-mask` padding (globals.css §7) keeps ascenders/descenders from clipping. Never put React-updated text inside a `[data-reveal]` heading. |
| `[data-tool-card]` (+ `.tool-icon svg`, `.resume-lines > i`, `.resume-check svg`) | `homepage.tsx` (global) | Timeline once at `.tools-grid` `top 88%`: cards rise (props cleared, so the CSS hover lift works), tool icons trace in, the resume sketch builds line by line (`scaleX`), and the check-row icons draw |
| `[data-scramble]` (`<ScrambleLabel>`, `scramble-label.tsx`) | `homepage.tsx` (global) | `"view"`: eyebrow labels stay hidden until `top 92%`, then decode once (ScrambleTextPlugin, 0.9s, using the label's own letters). `"hover"`: tool-card labels decode again on hover (0.5s). While scrambled, the box is locked (`width`/`height`, `autoRound: false`) and clipped, so glyph widths never reflow the line; React's text node is put back afterwards. The real text is in an sr-only twin and the animated copy is `aria-hidden`. |
| `.section-heading > p`, `.section-heading-aside`, `.journey-heading > p` | `homepage.tsx` (global) | Fade up once beside their headline |
| hover layer on `a`, `button`, `.job-card` | `homepage.tsx` (global, fine pointers only) | One delegated `pointerover`/`pointerout` on the page root. Arrow icons (`lucide-arrow-*`, `lucide-move-up-right`; not `.category-arrow`) leave in their direction and return. `[data-tool-card]` re-traces its icon and re-decodes its label. `.category-trigger` re-traces `.category-icon`. `.job-card` tips `.job-mark` (−8°, 1.08) however the pointer enters and resets on leave. Links holding `.brand-spark` turn it +90°. |
| `[data-magnetic]` | `homepage.tsx` (global) | Pointer-tracked magnetic offset, `(hover: hover) and (pointer: fine)` gated |
| `.job-card` + `data-flip-id` | `job-discovery.tsx` | GSAP Flip on filter change (`flushSync` captures state pre-commit) |
| `.save-button svg` | `job-discovery.tsx` | The bookmark pops (`scale 0.55 → 1`, `back.out(3)`) on every save/unsave click, for any pointer |
| `.job-card` (entrance) | `job-discovery.tsx` | `ScrollTrigger.batch` at `top 92%`, `once`: cards fade up from `y: 36` (0.7s, stagger 0.08). A filter/search change first kills the batch and clears card props (`revealCards()`), so Flip never captures a half-hidden card. |
| `.category-panel` + `data-flip-id` | `explore.tsx` | GSAP Flip on accordion expand |
| `.category-icon`, `.location-discovery` pin | `explore.tsx` | Icons trace in with each batch of rows (`drawIcons`); the pin traces in with the location chips |
| `.category-panel` (entrance) | `explore.tsx` | `ScrollTrigger.batch` at `top 92%`, `once`: rows slide in from `x: -28` (0.65s, stagger 0.07). `expand()` kills the batch and clears row props before `Flip.getState`. |
| `.location-links button` | `explore.tsx` | Location chips pop in once at `.location-links` `top 92%` (`y: 12`, `scale: 0.92`, `back.out(1.6)`, stagger 0.05) |
| `.journey-step`, `.journey-stage`, `.journey-progress-fill` | `career-journey.tsx` | See §4 — rebuilt this directive |
| `.mockup-shortlist-check`, `.mockup-confirm-icon` (+ tick), `.journey-step-eyebrow svg`, `.mockup-search-bar svg` | `career-journey.tsx` | Desktop: inside the pinned scrub (ticks pop at 1.3, the confirmation pops at 2.25 and its tick draws at 2.3, step icons draw at index + 0.2; the timeline stays 3.1 long); step 1's icons draw once at section `top 65%`. Mobile (<900px): each step builds once at `top 80%`. |
| `.team-photo-label svg` | `ecosystem.tsx` (`EmployerSection`) | The asterisk spins in (`rotation −120`, `scale 0.4 → 1`) at 0.55 in the photo timeline |
| `.employer-copy > p`, `.employer-actions` | `ecosystem.tsx` (`EmployerSection`) | Fade up once at `.employer-copy` `top 78%`, after the headline reveal |
| `.employer-photo-card` (+ `img`), `.team-photo-label`, `.photo-index` | `ecosystem.tsx` (`EmployerSection`) | Timeline once at `.employer-visual` `top 80%`: the card unmasks bottom-up via `clipPath` (insets overshoot by 16px so the offset shadow is never cut; cleared on complete), the image settles `scale 1.3 → 1.1`, then the label slides up and the index fades in. ≥900px only: image parallax `yPercent -4 → 4`, scrubbed (the 1.1 scale covers the travel). |
| `.community-story` | `community.tsx` | Slide-fade transition between testimonials |
| `.story-source`, `.quote-mark`, `.quote-word`, `.story-person`, `.story-controls` | `community.tsx` | `.story-source` fades up once; a timeline once at `.community-quote` `top 75%` pops the quote mark (`back.out(1.8)`), lights the testimonial word by word (`opacity 0.12 → 1`, stagger 0.035), then fades up the person and controls. `.quote-word` spans are rendered by React, not SplitText, because the carousel swaps the quote text. |
| `.community-spark` | `community.tsx` | Rotates 180°, scrubbed across the section |
| `.mobile-nav a` | `site-header.tsx` | Staggered reveal on menu open |
| `.newsletter-status` | `site-footer.tsx` | Fade in on form submit |
| `.page-curtain` | `page-transition.tsx` | `yPercent` 100↔0 curtain on route change |

## 4. Career Journey choreography (rebuilt this directive)

**Structure:** `.journey-inner` is a 2-column grid at `≥900px` (sticky heading left, `.journey-visual-col` right). `.journey-visual-col` holds `.journey-stage` (the 3 `.journey-step` panels) and a persistent `.journey-progress` bar below it — the progress bar is a sibling of the stage, not part of the crossfading stack, so it never fades.

**Desktop (`≥900px`, motion enabled) — the only condition under which the pin/scrub activates:**
```
gsap.matchMedia().add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
  gsap.set(panels.slice(1), { autoAlpha: 0, y: 24 })   // panels 2 & 3 start hidden
  timeline: ScrollTrigger({ pin: ".journey-inner", start: "top top", end: "+=900", scrub: 0.6 })
  for each step transition:
    outgoing panel  → autoAlpha: 0, y: -16   (0.35s)
    incoming panel  → autoAlpha: 1, y: 0     (0.45s, starts 0.15 after outgoing)
    progress fill   → scaleX: (index+1)/3    (0.4s)
})
```
CSS makes the crossfade actually work: `.journey-stage { position: relative; min-height: clamp(320px, 26vw, 400px) }` and `.journey-step { position: absolute; inset: 0 }` **only inside this same `≥900px` media query**. This is the fix for the bug documented in `ADDOZ-FRONTEND-AUDIT.md` §2 — previously panels stayed in normal flow while fading, so an inactive panel still reserved its own vertical space.

**Mobile / reduced motion (`<900px`, or motion disabled at any width):** the `mm.add` condition never matches, so `gsap.set` and the ScrollTrigger timeline never run — panels keep their CSS defaults (`position: static`, full opacity, normal flow) and render as three stacked cards in document order. This is the "clean stacked experience" the brief asked for, achieved by *not* running the desktop animation rather than by writing separate mobile markup.

**Per-step visual distinction:** each step now renders a different mockup (`StepMockup` in `career-journey.tsx`) instead of three copies of the same generic preview card — a search-bar mockup for step 1, a shortlist-with-checkmarks mockup for step 2, a confirmation card for step 3. This directly addresses the "repetitive" complaint: the three states now look like three different moments in a product, not the same card three times.

**Known pitfall this directive hit and fixed:** `gsap.matchMedia()`'s `mm.add(query, callback)` — anything returned from `callback` is itself the revert function GSAP calls for that specific condition. Do not also call `mm.revert()` from inside that callback's return; that causes `MatchMedia.revert()` to invoke itself recursively (`RangeError: Maximum call stack size exceeded`, seen live in this session). `mm.revert()` belongs exactly once, in the outer `useGSAP` cleanup — see the corrected `career-journey.tsx` for the reference shape all other components already follow correctly.

## 5. Motion principles (confirmed, unchanged from Directive 002 ADR-004)

```
Hero:               SplitText + timeline (word masks)
Job filtering:      Flip (position capture before React commits)
Category explore:   Flip (accordion expand)
Career journey:     ScrollTrigger + timeline (desktop-pinned, absolute-stacked crossfade)
Career tools:       ScrollTrigger (reveal group)
Section headlines:  SplitText line masks (reveal once, then revert)
Card entrances:     ScrollTrigger.batch on job cards + explore rows (cleared before any Flip)
Employer photo:     clip-path reveal + desktop scrub parallax
Testimonial:        word-by-word light-up (React-rendered spans)
Eyebrow labels:     ScrambleText decode (sr-only twin, box locked)
Line icons:         DrawSVG trace-in; hover re-trace
Hover layer:        arrows out-and-back, card marks tip (fine pointers)
Hero collage:       pointer depth (desktop, after the entrance)
Page navigation:    GSAP curtain transition
Buttons (CTA):      Magnetic micro-interaction (pointer-only)
Ticker:             Continuous GSAP tween with accessible pause
```

No scroll hijacking anywhere — every ScrollTrigger either pins for a bounded, content-driven distance (Career Journey: `+=900`) or reveals once (`data-reveal`, `once: true`), or scrubs a purely decorative transform without pinning (hero and community sparks, employer photo parallax). No animation blocks a functional action; forms, links, and buttons remain operable mid-animation.

---

## Directive 008 update — smooth, quiet, intentional (24 Sep 2026)

Motion now clarifies hierarchy and continuity; it no longer decorates every element.
Full rules: ADDOZ-SLEEK-DESIGN-SPEC.md §10.

| Moment | Engine | Behaviour |
|---|---|---|
| Hero | SplitText + timeline | Words rise once; lead, search and portraits follow; portraits drift with the pointer (fine pointers) and their crop moves slightly as the hero scrolls away. |
| Opportunity board | Flip | The grid arrives as one group; tabs (All / Full-time / Remote / Entry level / Saved) reflow cards with Flip. Cards no longer animate individually. |
| Explore | Flip + DrawSVG | The accordion arrives as one piece, icons trace in once; opening a field reflows rows with Flip. |
| Career journey | ScrollTrigger pin | Desktop ≥1024×700: the section pins for ~2.4 viewports; scroll moves 01 Search → 02 Discover → 03 Apply → 04 Move forward. One product stage crossfades between four UI states, each state builds with a short timeline, a purple rail shows progress, step titles are clickable. Phones, tablets and reduced motion get the same story as tabs — no pin. |
| Employer | clip-path + scrub | The photograph unmasks once, then drifts slower than the page. |
| Tools | timeline | The bento arrives as one group; icons trace; the resume sketch builds. |
| Community | timeline | The quote lights up word by word once; the carousel crossfades. |
| Jobs browser | Flip | Filters, sort and paging reflow the grid; the URL keeps the state. |
| Card → job page | Flip | The card's mark and title fly into the job header. |
| Page curtain | GSAP | Shown only for curtain links, never on first load, instant links, back/forward or reduced motion. |
| Buttons | CSS + quickTo | Flat at rest; hover displaces a 3px hard shadow (the `translate` property, so GSAP's magnetic `transform` composes with it). Magnetic pull on one CTA per section. |

Removed: the footer "Motion, with purpose" dialog (prototype-only) and per-card entrance staggers.
