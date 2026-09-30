# DESIGN-SYSTEM.md
### CampusOne — Design System v1.0 (Roadmap + Status)

Companion to `AI_CONSTITUTION.md`, `ARCHITECTURE.md`, and
`MOTION-SYSTEM.md`. This is the single index across all 11
pillars of a real design system — where each one already lives
in the codebase, and how complete it actually is today. Update
this file whenever a pillar's status changes; it should never
claim something is done that isn't wired into real code.

| # | Pillar | Status | Source of truth |
|---|---|---|---|
| 1 | Color System | ✅ Tokens complete, utilities added | `shared/styles/variables.css` (tokens) + `colors.css` (utilities). Dark mode via `[data-theme="dark"]` override. |
| 2 | Typography System | 🟡 Tokens + base elements only | `variables.css` (`--text-*`/`--weight-*`) + `typography.css` (h1-h4/p/small). No named type-scale utility classes yet (e.g. `.co-text-heading-lg`) — every component reaches for the raw size/weight tokens directly today. |
| 3 | Spacing System | ✅ Complete | `variables.css` (`--space-*`) + `spacing.css` (utilities). |
| 4 | Motion System | ✅ v1.0 shipped, Phase 2 in progress | `MOTION-SYSTEM.md` — full detail, don't duplicate here. |
| 5 | Elevation System | 🟡 Foundation laid this pass | `shadows.css` (flat shadow steps) + new `elevation.css` (z-index scale + floating-surface pattern). No documented "when to use which elevation level" guidance yet beyond the code comments. |
| 6 | Iconography | ✅ Solid | `shared/components/icons/` — ~40 icons, one file each, all `currentColor`/`24x24`, single `index.js` barrel. Consistent enough to call done; grows by adding a file, not a convention change. |
| 7 | Components | 🟡 Substantial, uncatalogued | `shared/components/*` (button, input, avatar, badge, toast, select, skeleton family, profile family, bottom-nav, etc.) are real and reused across roles. What's missing: a single catalog/index doc listing every component + its props, and some common surfaces don't exist yet (Modal, Dialog, Drawer, Table, Toggle/Switch — see `ARCHITECTURE.md` for what's actually built). |
| 8 | Interaction Rules | 🟡 Foundation laid this pass | New `interaction.css` (`.co-interactive`/`.co-disabled`/`.co-focus-ring`) + Phase 2 engines (Ripple, Magnetic). Per-component hover/press states still live inside each component's own CSS (button.css, profile.css) rather than fully centralized — intentional for now, since forcing every component onto the same 3 utility classes today would be a large, risky rewrite for marginal gain. |
| 9 | Accessibility Rules | 🟡 Foundation laid this pass | New `accessibility.css` (`.sr-only`, skip-link, global focus-visible, reduced-motion master switch) + existing per-component reduced-motion blocks + `AI_CONSTITUTION.md` Chapter 5. Not yet audited: color contrast ratios, full keyboard-nav trace through Sidebar/Topbar, ARIA on the newer Phase 8 profile sections. |
| 10 | Responsive Rules | ⬜ Not started as a system | Every component hand-rolls its own `@media (max-width:...)` breakpoints today (480/768/1024 show up most often) — there's no shared breakpoint convention or token for it. **Technical note:** CSS custom properties can't be read inside an `@media` condition, so a `--bp-*` variable the way `--space-*` works for spacing doesn't actually work here — the fix is a documented convention (agree on 480/768/1024/1440 and use those literals everywhere) or a build-time preprocessor step, not a runtime CSS token. Not attempted yet. |
| 11 | Design Tokens | ✅ Complete for what exists | `variables.css` is already the single source of truth for every token category that has one (color/spacing/radius/shadow/motion/z-index/font). Typography scale and responsive breakpoints (pillars 2 and 10 above) are the two categories without a formalized token/utility layer yet. |

---

## What "done" means here

A pillar is only marked ✅ if there's real code implementing it
that other code actually imports/uses — not a written spec. Where
a pillar is 🟡, the gap is named explicitly above rather than
glossed over, so the next session can pick it up without
re-auditing the whole codebase first.

## Suggested next priority (in order)

1. **Typography scale utilities** (pillar 2) — cheapest of the
   remaining gaps: a handful of `.co-text-*` classes over tokens
   that already exist, same pattern as `colors.css` this pass.
2. **Responsive breakpoint convention** (pillar 10) — write down
   the 480/768/1024/1440 convention explicitly (a comment block
   in `variables.css` even though it can't be a real token) so
   new components stop picking arbitrary breakpoints.
3. **Component catalog** (pillar 7) — an index doc, not new code:
   list every existing shared component + its options, so "does
   a Modal exist" stops requiring a repo search.
4. **Phase 2 remainder** (Page Transition Engine, Bottom Sheet,
   Pull-to-Refresh, Gesture Animations) — each blocked on a
   component that doesn't exist yet; build the component and its
   motion in the same pass, not motion first.
5. **Accessibility audit** (pillar 9) — contrast + keyboard trace,
   once the component surface stops changing as fast as it is
   right now (Phase 8 is still active).
