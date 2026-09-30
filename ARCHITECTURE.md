# ARCHITECTURE.md
### CampusOne — Project Structure & Module Relationships

Companion to `AI_CONSTITUTION.md`. This file describes the *current, actual* structure of the codebase — update it whenever the structure changes, so it never drifts from reality.

Also see `UNIVERSAL-SHELL-SPEC.md` (Phase 0, added 2026-07-28) — the frozen reference for Header/Bottom Nav/Hero/Layout/Motion/Accessibility values across the three existing role shells, and the sanctioned 480/768/1024/1440 responsive breakpoint convention. Consult it before touching any shell-region file (`shell/`, `topbar/`, `components/sidebar/`, `components/bottom-nav/`, `dashboard/`) so new work doesn't reintroduce a value the spec already flagged as a conflict to resolve.

---

## 1. Top-Level Structure

```
/
├── firebase/          → Firebase SDK init (single source, imported only by Services)
├── router/             → Global app-level router
├── modules/            → Feature modules, isolated by domain
│   ├── auth/            (login, register, forgot-password)
│   ├── institution/      (registration wizard)
│   ├── splash/
│   └── super-admin/     (see §3 below)
├── shared/              → Cross-module reusable code
│   ├── components/       (auth-card, button, input, select, toast, skeleton, etc.)
│   ├── core/              (base-component, animation engine, loading manager)
│   ├── services/          (auth, session, storage, user, institution, time)
│   ├── guards/            (role.guard.js)
│   ├── config/, constants/, data/, styles/, utils/, validation/
├── public/
├── assets/
├── main.js              → App entry point
├── index.html
├── firestore.rules / firestore.indexes.json / storage.rules
└── firebase.json / .firebaserc
```

---

## 2. Architectural Flow (enforced — see Constitution Chapter 2 & 14)

```
UI (*.page.js)
   ↓
Controller (*.controller.js)
   ↓
Service (*.service.js)
   ↓
firebase/firebase.js  (only place Firebase SDK is imported)
```

- `*.page.js` — renders markup, no business logic, no Firebase imports.
- `*.controller.js` — wires events, validates input, calls services, updates page state.
- `*.service.js` — owns Firebase calls (Auth/Firestore/Storage) and business logic for its domain.
- `shared/services/` — cross-module services (`auth.service.js`, `session.service.js`, `session.store.js`, `storage.service.js`, `user.service.js`, `institution.service.js`, `time.service.js`) used by multiple modules.

---

## 3. `modules/super-admin/` — Current Module Map

```
super-admin/
├── shell/            → App shell (layout wrapper for all super-admin screens)
├── router/           → Module-scoped router
│   ├── router.super.js
│   ├── modules.registry.js   (registry-driven route declarations — Constitution Ch.13)
│   └── guards.js
├── login/            → login.page.js + login.controller.js + login.service.js
├── dashboard/         → dashboard.page.js + dashboard.controller.js
├── profile/           → profile.page.js + profile.controller.js + profile.service.js
├── topbar/            → topbar.page.js + topbar.controller.js
├── status-bar/        → status-bar.page.js + status-bar.controller.js
├── activity-panel/    → activity-panel.page.js + activity-panel.controller.js
└── components/        → components exclusive to super-admin (not shared module-wide)
```

**Pattern:** every screen-level feature is a folder with `.page.js` (view) + `.controller.js` (logic), and a `.service.js` only where the feature owns Firebase-backed data (e.g. `login`, `profile`). Screens without their own data ownership (`topbar`, `status-bar`, `activity-panel`) call into `shared/services/` instead of owning a service file.

---

## 4. Routing Flow

- Global router: `router/router.js` — top-level route dispatch (auth vs institution vs super-admin).
- Module router: `modules/super-admin/router/router.super.js` — internal routing within the super-admin shell.
- `modules.registry.js` — single source of truth for super-admin route definitions (path → module loader). No hardcoded route strings elsewhere (Constitution Ch.13).
- `guards.js` / `shared/guards/role.guard.js` — access control checks run before a route resolves.

---

## 5. Shared Core Systems

- `shared/core/base-component.js` — base class/pattern all components extend for consistent lifecycle (render, destroy, cleanup).
- `shared/core/animation/` — `animation.engine.js`, `animation.service.js`, `animation.types.js` — the only sanctioned way to animate (Constitution Ch.5).
- `shared/core/loading/` — `loading.manager.js`, `loading.service.js`, `loading.types.js` — backs the Skeleton system (Constitution Ch.6).

---

## 6. Naming Conventions

| File suffix | Role |
|---|---|
| `*.page.js` | View / render logic |
| `*.controller.js` | Event wiring, validation, orchestration |
| `*.service.js` | Firebase/business logic for a domain |
| `*.registry.js` | Central declarative config (routes, modules) |
| `*.guard.js` | Access-control checks |
| `*.store.js` | In-memory state holder (e.g. `session.store.js`) |

Folders are named after the feature/domain they own (`profile/`, `dashboard/`, `topbar/`), never generic terms like `misc/` or `utils2/`.

---

## 7. Current State (as of last sync)

- Authentication is currently **mocked via localStorage** — real Firebase Auth/Firestore/Storage integration is the next major work item (see `CHANGELOG.md` → Unreleased).
- `firebase/firebase.js` exists and is initialized, but most services haven't been switched over from mock data yet.
- Module-based architecture migration (role-based → module-based) is complete as of early July 2026.

---

## 8. Navigation Architecture — Canonical Reference & Active Tab Manager (Sub-Phase 1.3C)

**Full policy detail lives in `NAVIGATION-ARCHITECTURE-POLICY.md` — this section is the short summary every future navigation change should read first.**

### Canonical Navigation Rule (LOCKED)

Institution Owner (`modules/institution-owner/components/`) is the permanent
reference implementation for every navigation surface — Top Header, Sidebar,
Bottom Navigation, motion, press effects, ripple, wave, active states,
auto-hide, accessibility, and responsive behavior. Shared navigation engines
(`shared/core/navigation/`, `shared/components/bottom-nav/`) evolve to match
Institution Owner. **Institution Owner is never simplified or changed to
accommodate a shared engine** — the direction of change only ever runs one
way.

### Active Tab Manager is namespace-aware (`shared/core/navigation/tab-registry.js`)

Through Sub-Phase 1.3B, `tab-registry.js` was a single hardcoded list of
Institution Owner's own 5 tab ids — any other role's ids would be silently
rejected by `active-tab.state.js`'s `setActive()`. Sub-Phase 1.3C replaced
the single list with a `namespace -> tab list` map:

- `registerNamespaceTabs(namespace, tabs)` — a role registers its own
  `{ id, kind }` list once.
- `isKnownTabId(id, namespace)` / `getTabKind(id, namespace)` — namespace is
  an **optional** second argument; omitted, it resolves against the legacy
  global list, so nothing that pre-dates this phase changes behavior.
- The `"institution-owner"` namespace is pre-seeded with the exact same
  frozen `BOTTOM_NAV_TABS` array that always existed — same object
  references, not a copy — so the reference implementation cannot drift.
- `createActiveTabManager({ namespace, tabs, ... })` accepts an optional
  `tabs` array and self-registers it, so a role opting in doesn't need to
  call `registerNamespaceTabs()` separately (no duplicated wiring logic).

This unblocks Active Tab Manager for Platform Super Admin, Institution
Admin, and future dashboards (Department Admin, Faculty, Student, Parent)
without any of them touching Institution Owner or each other's tab ids.
Activation for any specific role is a separate, later decision — this phase
only makes the architecture capable of it.

## 9. Keeping This File Accurate

Update this file when:
- A new top-level module or shared system is added.
- The routing pattern changes.
- A new architectural layer/convention is introduced.

Do **not** update this file for routine feature work inside an existing pattern — that goes in `CHANGELOG.md` instead.
