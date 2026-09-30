# CHANGELOG.md
### CampusOne

All notable changes to this project are documented here, per `AI_CONSTITUTION.md` Chapter 20.

Format: `## [Date] — Short Title` followed by bullet points. Newest entries at the top.

---

## [2026-07-28] — Phase 0: Universal Shell Specification (Architecture Freeze)
- New `UNIVERSAL-SHELL-SPEC.md` — documentation-only release, zero application code changed. Freezes current-state values (not new design) for Header, Bottom Nav, Hero, Layout, Motion, and Accessibility across the three existing role shells (Super Admin, Institution Admin, Institution Owner), per `CampusOne-Universal-Shell-Audit.md`'s recommendation to finish extraction rather than start a parallel rewrite.
  - Adopts **480 / 768 / 1024 / 1440** as the sanctioned responsive breakpoint convention going forward, resolving `DESIGN-SYSTEM.md` pillar 10 (previously ⬜ "Not started as a system"). This is a documented convention only — existing off-convention breakpoints (340/360/420/560/640/900/992/1200px, found across current CSS) are **not retrofitted this phase**; they get reconciled component-by-component during Phase 2 migration.
  - Flags two conflicts the original audit did not catch at this granularity: (1) Super Admin's `topbar.css` uses a bare `height:72px` with no `env(safe-area-inset-top)`, unlike Institution Admin/Owner; (2) Institution Owner's Bottom Nav does not consume the shared `shared/components/bottom-nav/bottom-nav.css` that Super Admin and Institution Admin already share — it forks its own CSS, even though its `active-tab.manager.js` *behavior* is the most-evolved of the three. Both are migration targets for Phase 2, not fixed in this pass.
- No dead code removed, no guard changes, no new components — scope held strictly to documentation per this phase's definition.

---

## [Unreleased]
- **Phase 5.1.1 — Institution Admin Management Foundation.** New `modules/institution-owner/admin-management/` (admin-management.page.js, admin-management.controller.js, admin-management.css) — the architecture foundation for the Institution Owner to manage the admins delegated to run their institution (`ROLES.INSTITUTION_ADMIN`), reached two ways: the Dashboard's "Institution Admin Management" Quick Action, and Sidebar > Users & Roles. Both now dispatch to the same registered module id, `"users-roles"` (`router/modules.registry.js` flipped from `status: "soon"` to `"ready"`; `router/router.institution-owner.js`'s `LOADERS` gained one entry; `dashboard.controller.js`'s `QUICK_ACTIONS` `admin-management` entry's `moduleId` changed from `null` to `"users-roles"` — no second module id introduced for the same destination). Page renders: header (Title/Subtitle), four summary cards (Total/Active/Suspended/Pending — reusing `.io-kpi-grid`/`.io-kpi-card` verbatim from `dashboard.css`, no new CSS), a Search input and Filter Bar (Status/Department/Sort — production-ready UI, no backend search/filter/sort logic, per phase scope), and an Admin Directory container that always renders its Empty State ("No Institution Administrators Yet", disabled "Create First Administrator" CTA, "Available in Phase 5.1.2" badge) since no admin can exist yet this phase. Documents (comment only, no collection/document created) the future `users/{uid}` shape — `role` / `institutionId` / `status` / `permissions` / `department` / `createdBy` / `createdAt` / `updatedAt`.
  - No Firebase reads/writes, no admin create/edit/suspend/delete, no real search/filter/sort execution, no Permission Engine, no Departments data — all explicitly out of scope, deferred to Phase 5.1.2+.
  - Confirmed (not re-litigated) while scoping this: the naming/guard ambiguity the `[2026-07-XX]` Part 1.1 entry below flagged between `modules/institution-admin/` and Institution Owner-managed admins is already resolved in code — `shared/constants/roles.js` (Part 3.2) retired `INSTITUTION_SUPER_ADMIN` in favor of `INSTITUTION_OWNER`, and `modules/institution-admin/router/guards.js` (Part 3.9) now gates that module on `ROLES.INSTITUTION_ADMIN` only, with an explicit note that the Owner manages Institution Admin from the Owner Dashboard instead — i.e. this very page. `ROADMAP.md`'s naming-cleanup item is stale and should be closed out.
- **Milestone 1, Part 1.1 — Owner Dashboard Shell Configuration.** New `modules/institution-owner/shell/` (shell.page.js, shell.controller.js, shell.css, shell.html) — layout-only scaffold mirroring `modules/institution-admin/shell/` and `modules/super-admin/shell/`'s region grid (Sidebar / Topbar / Content / Activity Panel / Status Bar / Bottom Nav via the shared `bn-root` mount), `io`-prefixed ids/classes. `shell.css` registered in `shared/styles/main.css`. Deliberately scoped: no Sidebar/Topbar/Activity Panel/Status Bar components, no guard, no module router, and **not yet registered in `main.js` / `router/router.js`** — those are separate later parts, same progression Institution Admin went through (its own Part 4.1/4.2/4.3/6.1 came after its Part 1).
  - Kept as a **separate module** from `modules/institution-admin/` rather than reusing/renaming it, per explicit decision — flagged because `institution-admin`'s guard actually gates on `ROLES.INSTITUTION_SUPER_ADMIN`, which is what `AI_CONSTITUTION.md` Chapter 10's role list calls **Institution Owner**, while `ROLES.ADMIN` (the Constitution's actual "Institution Admin") has no shell at all yet. Neither `institution-admin`'s existing shell nor this naming mismatch is documented in `ARCHITECTURE.md`/`CHANGELOG.md` prior to this entry — worth a deliberate cleanup pass before more role shells are added.
- Pending: Replace localStorage mock authentication with real Firebase Auth/Firestore/Storage integration.
- Pending: Profile module roadmap — photo sync, real Firebase data, dropdowns, save toast, unsaved changes warning, change photo UI.
- Pending (Design System follow-up, see `DESIGN-SYSTEM.md`): typography scale utilities; responsive breakpoint convention; component catalog doc; Page Transition Engine / Bottom Sheet / Pull-to-Refresh / Gesture Animations (each blocked on a component that doesn't exist yet); accessibility contrast/keyboard audit.

---

## [2026-07-17] — Design System v1.0: styles/ reorg + Phase 2 Premium Interaction System
- New `DESIGN-SYSTEM.md` — single index across all 11 design-system pillars (color, typography, spacing, motion, elevation, iconography, components, interaction, accessibility, responsive, tokens), each mapped to its real source of truth and an honest ✅/🟡/⬜ status — no pillar is marked done without code that actually implements it.
- `shared/styles/` reorganized by concern: new `colors.css` (color utility classes over the existing tokens), `elevation.css` (z-index utility scale — previously zero utility classes existed for the `--z-*` tokens — plus an `.co-elevated-surface` pattern for floating panels), `interaction.css` (`.co-interactive`/`.co-disabled`/`.co-focus-ring` for custom non-native tappables), `accessibility.css` (`.sr-only`, skip-link, global focus-visible fallback, and the reduced-motion master switch moved out of `motion.css`). `main.css` import order updated. `MOTION-SYSTEM.md` §2 documents the full split and why `motion.css` (timing/curves) and `interaction.css` (states) are separate files.
- **Ink Ripple** (Phase 2) — new `shared/core/ripple/` (engine/service/index, same architecture as `animation.engine.js`). A single delegated `pointerdown` listener spawns a click-positioned ink dot via WAAPI on any `.co-ripple-surface`; `button.js` now puts that class on every `.btn`, so it's live on every button app-wide via one side-effect import in `main.js` — no per-page wiring needed. `Ripple.attach(el)` remains for one-off custom surfaces.
- **Magnetic Buttons** (Phase 2) — new `shared/core/magnetic/`, deliberately **opt-in only** (not wired to every button — would read as gimmicky in a form-dense SaaS app). Skips itself on touch devices and under reduced-motion.
- **Staggered List Animation** (Phase 2) — `.co-stagger-item` added to `motion.css`, pure CSS, 40ms/step, capped at the first 12 children.
- Reviewed and intentionally deferred (documented with reasons in `MOTION-SYSTEM.md` §4): Spring Physics (bezier approximation already in place, true physics solver deferred), Shared Element Transitions, Page Transition Engine, Bottom Sheet Physics, Pull-to-Refresh, Gesture Animations — each either already adequately covered or blocked on a component that doesn't exist yet in this codebase. Skeleton Loading Engine needed no new work — it already existed pre-Phase-2.

---

## [2026-07-17] — Motion Design System v1.0
- New `MOTION-SYSTEM.md` — versioned spec: full duration/easing token scale, utility layer, and an honest per-component status table (what's wired vs. what's ready-but-unused vs. what has no component yet to wire into).
- `shared/styles/variables.css` — added the full named token scale (`--duration-button-press` through `--duration-skeleton-fade`, `--ease-standard`/`--ease-out`/`--ease-in`/`--ease-spring`) alongside the existing `--animation-*`/`--ease-premium` tokens (kept, not replaced — `animation.types.js` has a hardcoded fallback copy of those).
- New `shared/styles/motion.css` (imported in `main.css` right after `animations.css`) — additive utility classes (`.co-card-hover`, `.co-press`, `.co-spring-in`, `.co-shake`, `.co-toast-in`, `.co-page-in`/`.co-page-out`, `.co-modal-in`/`.co-drawer-in`/`.co-bottom-sheet-in`, `.co-touch-target`), transform/opacity only, each with a reduced-motion fallback.
- `shared/components/button/button.css` — base `.btn` now does idle → hover scale(1.02) → press scale(.97) → spring release per spec; removed the old per-variant `translateY(-2px)` hover hacks on primary/secondary so there's one button behavior everywhere, not several.
- `shared/components/toast/toast.css` — entrance retimed to 250ms/`--ease-out`, scale adjusted to 0.95→1 per spec; added a reduced-motion override.
- `shared/components/input/input.css` — focus transition retimed to `--duration-hover`/`--ease-standard`.
- `modules/super-admin/components/active-pill/active-pill.css` — added the spec's hover scale(1.02) to the shared active-pill surface.
- `shared/components/profile/*` (analytics-card, profile.css) — Quick Statistics cards now use `.co-card-hover`; nav-row/permission-row hover retimed to the new tokens.
- Scope note: Attendance, Notices, Faculty, and Student modules don't exist yet in this codebase, so nothing was touched there — see `MOTION-SYSTEM.md` §3 for the full "not yet applied" list (modal/drawer/bottom-sheet, tables, floating labels, ripple, sidebar retiming, haptics).

---

## [2026-07-14] — Active Navigation State Foundation (Part 2.1)
- Added a generalized "active tab" foundation under `shared/core/navigation/`, separate from Part 1's route-only NavigationState, so a future phase can reflect action tabs (Alerts, Activity) as active — not just route tabs (Dashboard, Institutions, Profile).
- New files: `tab-registry.js` (shared list of the 5 bottom-nav tabs + kind), `active-tab.state.js` (namespaced single-source-of-truth store, one active tab at a time), `active-tab.detector.js` (pure detection logic: ephemeral action override > route id), `active-tab.painter.js` (generic class/aria-current switching, not bottom-nav-specific), `active-tab.manager.js` (composed, opt-in factory tying the above together).
- `shared/core/navigation/index.js` updated to export the new pieces alongside Part 1's, clearly labeled by phase.
- Foundation only: nothing above is wired into `bottom-nav.controller.js` or any router by this phase. No DOM, CSS, animation, or routing changed. Adoption is a later phase.

---

## Template for future entries

```
## [YYYY-MM-DD] — Short Title
- What changed (feature/fix/refactor)
- Why it changed
- Files touched
- Migration notes (if anything was deprecated, per Chapter 21)
```
