# ROADMAP.md
### CampusOne — Product & Engineering Roadmap

Companion to `AI_CONSTITUTION.md`, `ARCHITECTURE.md`, and `CHANGELOG.md`.

- **CHANGELOG.md** answers: *what already shipped.*
- **ROADMAP.md** answers: *what's next, and in what order.*

Update this file when priorities shift. Move an item to `CHANGELOG.md` once it ships — don't let it live in both.

---

## Now — In Progress

### Firebase Integration (replacing localStorage mock)
- [ ] Replace mock auth layer with real Firebase Auth
- [ ] Wire Firestore reads/writes into existing services (per `ARCHITECTURE.md` §7)
- [ ] Wire Firebase Storage for file/photo uploads
- [ ] Update `firestore.rules` / `storage.rules` to match real data shape

### Profile Module (super-admin)
- [ ] Photo sync with Firebase Storage
- [ ] Replace mock data with real Firebase data
- [ ] Dropdown fields wired to real options
- [ ] Save toast on successful update
- [ ] Unsaved changes warning (navigation guard)
- [ ] Change-photo UI (upload/crop/preview)

---

## Next — Planned

- [x] Institution Owner dashboard — Part 1.1 (shell scaffold only, see `CHANGELOG.md`)
- [ ] Institution Owner dashboard — Sidebar/Topbar/Activity Panel/Status Bar reuse, module router + guard, `main.js`/`router.js` registration
- [x] ~~Naming cleanup~~ — resolved: `shared/constants/roles.js` (Part 3.2) retired `INSTITUTION_SUPER_ADMIN` for `INSTITUTION_OWNER`, and `modules/institution-admin/router/guards.js` (Part 3.9) now gates that module on `ROLES.INSTITUTION_ADMIN` only — Owner manages Institution Admin from the Owner Dashboard instead (see Phase 5.1.1, `CHANGELOG.md`). This item predated both fixes; closing it here since it was never moved to `CHANGELOG.md` when resolved.
- [ ] Institution Admin role screens (against `ROLES.INSTITUTION_ADMIN` — dashboard/sidebar/topbar/shell scaffolding exists in `modules/institution-admin/`, but no admin can sign in yet since Phase 5.1.2+ hasn't built admin creation)
- [ ] Phase 5.1.2 — Create Institution Admin (wires `modules/institution-owner/admin-management/`'s Empty State CTA to a real create flow: Firestore write to `users/{uid}`, Firebase Auth account, email invitation, Admin Directory card rendering — foundation shipped Phase 5.1.1, see `CHANGELOG.md`)
- [ ] Notification/activity system wired to real Firestore data (currently in `activity-panel/`)
- [ ] Testing pass per `AI_CONSTITUTION.md` Chapter 19 across existing super-admin screens

---

## Later — Exploratory

- [ ] Department Admin, Faculty, Student, Parent role dashboards
- [ ] Desktop platform support
- [ ] Cloud Functions for server-side logic (invites, bulk operations, scheduled jobs)
- [ ] Multi-tenant billing/subscription layer

---

## Parked / Not Scheduled

Ideas worth keeping but not committed to a milestone yet. Move up when ready.

- [ ] AI-assisted modules (maps to Constitution v3.0 scope)

---

## How to Use This File

1. Before starting a new session, check **Now** to confirm what's actively being worked on.
2. When a checklist item ships, check it off, then move the line to `CHANGELOG.md` with a date.
3. When scope shifts (a feature is deprioritized, split, or merged), edit this file directly rather than leaving stale items — this file should always reflect current intent, not history.
