# MOTION-SYSTEM.md
### CampusOne — Motion Design System v1.0

Companion to `AI_CONSTITUTION.md` Chapter 5 (Animation Rules) and
`ARCHITECTURE.md`. Chapter 5 already mandates transform/opacity-only,
60 FPS, no layout shift — this document is the concrete token scale
and component-by-component status that satisfies that mandate the
same way across every module, instead of each screen picking its own
timing.

**Philosophy:** Apple x Linear x Stripe x Vercel. Every interaction
responds. Nothing on screen ever feels dead.

---

## 1. Tokens (source of truth: `shared/styles/variables.css`)

### Durations

| Token | Value | Used for |
|---|---|---|
| `--duration-button-press` | 80ms | Button pressed state |
| `--duration-hover` | 150ms | Generic hover (buttons, rows, inputs) |
| `--duration-card-hover` | 180ms | Card lift on hover |
| `--duration-ripple` | 220ms | Ripple/tap feedback |
| `--duration-modal` | 260ms | Modal open |
| `--duration-drawer` | 300ms | Drawer slide |
| `--duration-bottom-sheet` | 320ms | Bottom sheet slide |
| `--duration-page` | 350ms | Page transition |
| `--duration-toast` | 250ms | Toast in/out |
| `--duration-skeleton-fade` | 500ms | Skeleton → content fade |

The pre-existing `--animation-fast/normal/slow` and `--ease-premium`
tokens (used by the Animation Engine, `shared/core/animation/`) are
kept as-is — they are not replaced, since `animation.types.js` has a
hardcoded fallback copy of them. `--duration-skeleton-fade` is a
same-value alias of `--animation-slow` under the spec's naming, for
discoverability.

### Easing

| Token | Curve | Feel |
|---|---|---|
| `--ease-standard` | `cubic-bezier(.2,.8,.2,1)` | Default for most transitions |
| `--ease-out` | `cubic-bezier(.16,1,.3,1)` | Entrances (settles in, no overshoot) |
| `--ease-in` | `cubic-bezier(.7,0,.84,0)` | Exits |
| `--ease-spring` | `cubic-bezier(.34,1.56,.64,1)` | The *only* curve allowed to overshoot — buttons, active pills, success ticks |

---

## 2. File layout (`shared/styles/`)

Split by concern, one file per pillar, so a new interactive
component only ever means picking classes from a small, obvious
set of files instead of guessing which giant stylesheet owns
what:

| File | Owns |
|---|---|
| `variables.css` | All raw tokens (color, spacing, radius, shadow, motion, z-index) |
| `colors.css` | Color utility classes built on the tokens above |
| `typography.css` | Base element type styles (`h1`-`h4`, `p`, `small`) |
| `spacing.css` | Padding/margin/gap utility classes |
| `shadows.css` | Flat shadow utility classes (`.co-shadow-sm/md/lg`) |
| `elevation.css` | z-index utility classes + the "elevated floating surface" pattern (dropdowns/popovers), distinct from an in-flow `.co-card` |
| `motion.css` | **Timing/curves** — keyframes + utility classes for hover/press/entrance/stagger/ripple markup |
| `interaction.css` | **States** — `.co-interactive`/`.co-disabled`/`.co-focus-ring` for custom (non-native) tappable surfaces |
| `accessibility.css` | `.sr-only`, skip-link, global focus-visible fallback, and the reduced-motion master switch for every `motion.css` utility |
| `components.css` | Base composable surfaces (`.co-card`, `.co-panel`, `.co-container`, `.co-divider`) |
| `utilities.css` | Layout utility classes (flex/display/position/text-align) |
| `main.css` | Import order for all of the above + every module's own CSS |

`motion.css` vs `interaction.css`, concretely: hovering a custom
row needs both a *state* rule (interaction.css: does it even
have a hover-visible affordance) and a *timing* rule (motion.css:
how fast, what curve) — they're separate files because they
change for different reasons (a designer changing a duration
never needs to touch which elements are focusable).

## 3. Utility layer (`shared/styles/motion.css`)

Additive classes, same convention as `sa-active-pill.css` — add
alongside a component's existing classes, never as a replacement:

- `.co-card-hover` — translateY(-2px) + scale(1.01, hard ceiling) + shadow step-up, 180ms
- `.co-press` — scale 1 → 1.02 (hover, 150ms) → .97 (press, 80ms) for non-`.btn` tappables
- `.co-spring-in` — 0 → 1.2 → 1, for success ticks / icon pops
- `.co-shake` — 4px → -4px → 4px, 240ms, for form/field errors
- `.co-toast-in` / `.co-page-in` / `.co-page-out` / `.co-modal-in` / `.co-drawer-in` / `.co-bottom-sheet-in` — entrance/exit primitives
- `.co-touch-target` — forces a 48×48 minimum hit area

Every utility has a reduced-motion fallback in the file's own
`@media (prefers-reduced-motion: reduce)` block, and `motion.css` adds
a second belt-and-suspenders override at the bottom covering all of
them at once.

---

## 4. Phase 2 — Premium Interaction System

Status against the Phase 2 checklist:

| Item | Status |
|---|---|
| Ink Ripple | ✅ Built — `shared/core/ripple/`. Delegated `pointerdown` listener spawns a click-positioned dot via WAAPI. `button.js` puts `.co-ripple-surface` on every `.btn`, so it's live on every button app-wide the moment `main.js`'s side-effect import runs — no per-page wiring needed. `Ripple.attach(el)` for one-off custom surfaces. |
| Magnetic Buttons | ✅ Built, **opt-in only** — `shared/core/magnetic/`. Deliberately NOT wired to every button (would read as gimmicky in a form-dense SaaS app); call `Magnetic.attach(el)` on the specific CTAs that should get it. Skips itself entirely on touch devices and under reduced-motion. |
| Staggered List Animation | ✅ Built, CSS-only — `.co-stagger-item` in `motion.css`, 40ms/step, capped at the first 12 children. No JS needed; add the class to list markup. |
| Spring Physics | 🟡 Partially covered — `--ease-spring` (cubic-bezier approximation) already drives Button release, the Active Pill, and Bottom Sheet's utility. A true physics-simulated spring (mass/stiffness/damping, e.g. via a spring solver rather than a fixed bezier) is a bigger lift and deferred until a concrete case needs it (the bezier reads as "springy enough" for buttons/pills). |
| Skeleton Loading Engine | ✅ Already existed pre-Phase-2 — `shared/components/skeleton/*` + `shared/core/animation/` (fade/cross-fade, shimmer pause/resume). Nothing new needed here. |
| Shared Element Transitions | ⬜ Deferred — needs a router/page-transition hook to attach to; see Page Transition Engine below. |
| Page Transition Engine | ⬜ Deferred — `.co-page-in`/`.co-page-out` keyframes exist in `motion.css`, but no router lifecycle hook calls them yet (the current router does a hard swap, no transition phase). Wiring this means touching `router/router.js`'s render path — a deliberate, separate change, not bundled into a styling pass. |
| Bottom Sheet Physics | ⬜ Deferred — no Bottom Sheet component exists in the codebase yet (see `ARCHITECTURE.md`). `.co-bottom-sheet-in` utility is ready the moment one is built. |
| Pull-to-Refresh | ⬜ Deferred — no list/feed screen with a refresh gesture exists yet to attach it to. |
| Gesture Animations | ⬜ Deferred — same reason: no swipeable/draggable component exists yet. |

## 5. Status — where the Motion System (Phase 1) is actually wired in today

Applied (systemic — every module gets this for free since these are
shared components imported everywhere):

- **Button** (`shared/components/button/button.css`) — idle → hover
  scale(1.02) → press scale(.97) → spring release, exactly per spec.
  Per-variant `translateY` hover hacks removed so this is now the one
  behavior for every `<button class="btn">` in the app.
- **Toast** (`shared/components/toast/toast.css`) — 250ms, ease-out,
  0.95→1 scale entrance.
- **Input focus** (`shared/components/input/input.css`) — border +
  glow transition retimed to `--duration-hover`/`--ease-standard`.
- **Active Pill** (`modules/super-admin/components/active-pill/`) —
  hover now scales to 1.02 per the Navigation spec.
- **Quick Statistics cards / any `.co-analytics-card`** — `.co-card-hover`
  applied, so every role's Profile module gets the card-hover treatment
  automatically.
- **Profile nav rows / permission rows** — hover retimed to
  `--duration-hover`/`--ease-standard`.

Utilities exist and are ready, but **not yet applied anywhere** because
the underlying component doesn't exist in the codebase yet:

- Modal, Drawer, Bottom Sheet — no such component is built yet (see
  `ARCHITECTURE.md`); `.co-modal-in` / `.co-drawer-in` /
  `.co-bottom-sheet-in` are ready the moment one is, so a second motion
  convention doesn't get invented later.
- Table row hover — only skeleton tables exist today, no real
  data-table component yet.
- Floating labels — current inputs use a static label above the
  field, not a float-up label; that's a markup/behavior change per
  input, not a token/timing change, so it's out of scope for this pass.
- Ripple — see §4 (Phase 2), now built.
- Sidebar collapse / icon-fade / label-fade timing — not audited in
  this pass; `institution-admin` and `super-admin` sidebars each have
  their own existing transitions that should be retimed to
  `--duration-drawer` (300ms) / `--duration-hover` (icons)/ 150ms
  (labels) in a follow-up pass.
- Haptics — this is a JS/native-bridge concern (Android vibration
  API), not CSS; no haptics wiring exists in this web codebase.

**Modules that don't exist yet in this codebase** (so nothing was
touched here, since there's nothing to touch): Attendance, Notices,
Faculty, Student. When those modules are built, they should reuse the
tokens/utilities above rather than inventing their own durations —
that's the entire point of this file existing.

---

## 6. Golden Rules (enforced by the tokens/utilities above)

- Animate only `transform` and `opacity` — nothing here touches
  `width`, `height`, `top`, `left`, or triggers layout.
- No curve overshoots except `--ease-spring`, and only on the specific
  utilities listed above (buttons, active pills, success ticks) — not
  the default anywhere.
- Every scale utility caps at 1.02 (hover) / 1.01 (card hover) / .97
  (press) — never a "large zoom."
- Every animated utility has a `prefers-reduced-motion` fallback.
- 60 FPS target; nothing here should ever visibly stutter on a
  mid-range Android device.
