# UNIVERSAL-SHELL-SPEC.md
### CampusOne — Universal Shell Specification (Phase 0 — Architecture Freeze)

Companion to `ARCHITECTURE.md`, `DESIGN-SYSTEM.md`, `MOTION-SYSTEM.md`,
and `CampusOne-Universal-Shell-Audit.md`. This document does not invent
new design. Every value below is either (a) an existing token/value
already in production in at least one role, or (b) explicitly marked
**CONFLICT — unresolved** where roles disagree and no winner is
declared yet. Resolving a CONFLICT is migration work (Phase 2+), not
this phase — Phase 0 only freezes what "correct" means so that work
has a target.

No code changes ship in this phase. This is a documentation-only
release.

---

## 1. Universal Header (Topbar)

| Property | Frozen value | Evidence |
|---|---|---|
| Height | `calc(72px + env(safe-area-inset-top, 0px))` | Institution Admin, Institution Owner topbar.css |
| **CONFLICT — unresolved** | Super Admin topbar.css uses a bare `height:72px` with no `env(safe-area-inset-top)` | `modules/super-admin/topbar/topbar.css:14`. On a notched device this clips under the status bar. Fix = adopt the calc() form; tracked for Phase 2 (Topbar engine migration). |
| Logo/avatar slot height | 44–48px | consistent across all three roles' topbar.css |
| Notification badge | 18–20px | consistent across all three roles |
| Overflow/panel max-height | 300–420px depending on panel type | Institution Admin topbar.css (richest panel implementation today) |
| Reference implementation | `shared/core/navigation/topbar-panel.engine.js`, proven by Institution Admin | per audit §12 |

## 2. Universal Bottom Navigation

| Property | Frozen value | Evidence |
|---|---|---|
| Min-height | 76px (80px at wider breakpoint) | `shared/components/bottom-nav/bottom-nav.css` — this is the file Super Admin and Institution Admin already consume |
| Blur | `backdrop-filter: blur(20px) saturate(160%)` with `@supports not` fallback | `shared/components/bottom-nav/bottom-nav.css:108-122` |
| Safe area | `padding: 0 20px calc(16px + env(safe-area-inset-bottom))` | same file |
| Active-state authority | `active-tab.manager.js` (single source of truth for `.is-active`) | proven only in Institution Owner today — audit §4, §12 |
| **CONFLICT — unresolved** | Institution Owner does **not** use the shared `bottom-nav.css` — it has its own local `modules/institution-owner/components/bottom-nav/bottom-nav.css` with a diverging `min-height:76px` block and no shared safe-area comment. So Owner leads on *behavior* (active-tab manager) but lags on *styling* (own CSS fork). Both must converge in Phase 2 — do not assume Owner is fully "ahead" on this component. | direct file comparison, this pass |
| Badge/label sizing | 15px badge, 22px icon | shared bottom-nav.css |
| Reference implementation | Behavior: Owner's `active-tab.manager.js` + `bottom-nav.engine.js`. Styling: `shared/components/bottom-nav/bottom-nav.css` (already the majority file — 2 of 3 roles). | this pass + audit §12 |

## 3. Universal Hero / Dashboard Card

| Property | Frozen value | Evidence |
|---|---|---|
| Gradient token | `--primary-gradient: linear-gradient(135deg,#1D4ED8,#2563EB,#4F7EFF)` | `shared/styles/variables.css` |
| Status chips, avatar, date, greeting | Present in Institution Admin's dashboard ("Hero Section 2.0", Phase 5.4.1) | audit §4 — explicitly a staggered rollout, not yet ported to Super Admin/Institution Owner |
| **Not yet frozen** | Super Admin and Institution Owner dashboards have not received the Hero 2.0 pass. Their current hero markup is the *pre*-2.0 version. This spec adopts Hero 2.0 (Institution Admin's) as the target — porting it is Phase 2/5/6 work, not Phase 0. | audit §4 |

## 4. Universal Layout

| Property | Frozen value | Evidence |
|---|---|---|
| Spacing scale | `--space-4` through `--space-64` | `shared/styles/variables.css` — already ✅ complete per `DESIGN-SYSTEM.md` pillar 3 |
| Radius scale | `--radius-xs` (6px) → `--radius-full` (999px) | same file |
| Elevation | Flat shadow steps (`shadows.css`) + z-index scale (`elevation.css`) | `DESIGN-SYSTEM.md` pillar 5 — foundation laid, no "when to use which level" guidance yet (unresolved, not blocking) |
| **Responsive breakpoints — CONFLICT, this is the real gap** | Repo currently uses **11 different breakpoint values**: 340, 360, 420, 480, 560, 640, 768, 900, 992, 1024, 1200px, hand-rolled per component. `DESIGN-SYSTEM.md` pillar 10 itself rates this ⬜ "Not started as a system" and names it the top suggested priority. | grep across all `*.css`, this pass |
| **Frozen convention (this phase's actual deliverable)** | Adopt **480 / 768 / 1024 / 1440** as the only sanctioned breakpoints going forward, per `DESIGN-SYSTEM.md`'s own suggested convention. These are already the 3 most-used values in the repo (480: 18 uses, 768: 19 uses, 1024: 17 uses) — this is a documented convention, not a new token, since CSS custom properties can't be read inside `@media` conditions. | `DESIGN-SYSTEM.md` §10, grep counts this pass |
| Migration note | Existing off-convention breakpoints (340/360/420/560/640/900/992/1200) are **not changed in this phase**. They get reconciled component-by-component as each one is migrated in Phase 2+, so no visual regression risk ships today. | scope discipline, per audit |

## 5. Universal Motion

Already ✅ shipped as v1.0 per `MOTION-SYSTEM.md` — this section is a
pointer, not a re-spec, to avoid maintaining two sources of truth.

| Property | Frozen value | Evidence |
|---|---|---|
| Durations | `--duration-button-press` (80ms) through `--duration-page` (350ms) | `MOTION-SYSTEM.md` §1, `shared/styles/variables.css` |
| Full detail | See `MOTION-SYSTEM.md` directly | no duplication here per that doc's own instruction |

## 6. Universal Accessibility

Already has a real foundation — this section documents current state,
does not add new rules.

| Property | Frozen value | Evidence |
|---|---|---|
| Screen-reader-only pattern | `.sr-only` | `shared/styles/accessibility.css` |
| Skip link | `.co-skip-link`, off-screen until `:focus` | same file |
| Focus ring | Global `:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px }` fallback; richer per-component focus states layered on top | same file |
| Reduced motion | Master `@media (prefers-reduced-motion: reduce)` switch, co-located per-component overrides also exist | same file |
| **Not yet audited (unchanged from audit's finding)** | Color contrast ratios, full keyboard-nav trace through Sidebar/Topbar, ARIA on newer Phase 8 profile sections — no repository evidence exists either way. Not claimed done, not claimed broken. | `DESIGN-SYSTEM.md` pillar 9, audit §11 |

---

## What this phase changes

**Nothing in application code.** This file is additive documentation.
No `.js`/`.css` file is modified in Phase 0. The only frozen *decision*
with teeth is the 480/768/1024/1440 breakpoint convention — and that's
a convention for *future* code, not a retrofit of existing files.

## What "done" means for Phase 0

- [x] Every region (Header, Bottom Nav, Hero, Layout, Motion, Accessibility) has a documented current-state value pulled from real code.
- [x] Every cross-role conflict found is named explicitly, not silently resolved.
- [x] No new visual design invented — every frozen value already exists in the codebase today.
- [x] Zero application files modified — verified via `git diff` equivalent (file-by-file diff against source ZIP, this pass).

## Next phase dependency

Phase 2 (Universal Engine Migration, per audit §13 Step 1) can now
cite this document instead of re-deriving "which value wins" per
component during migration.
