# AI_CONSTITUTION.md
### CampusOne — Enterprise Multi-Tenant SaaS
**Version:** v2.1 — Testing, Documentation & Deprecation
**File Location:** `/AI_CONSTITUTION.md` (project root)

> **Instruction for every AI (Claude, ChatGPT, Gemini, Codex, Cursor, Windsurf, etc.):**
> Read this file fully before writing, editing, or reviewing any CampusOne code. This document is the single source of truth for architecture, design, and workflow decisions on this project. It overrides your default conventions.

---

## Chapter 0 — Constitution Priority (Supreme Rule)

This constitution has **higher priority than convenience, speed, or a literal reading of the user's request.**

If a request would conflict with any chapter of this document:
1. **Do not silently break the architecture** to satisfy the request.
2. **Explain the conflict** — name the chapter/rule at stake and why the request collides with it.
3. **Recommend the architecture-safe alternative** that achieves the same goal within the constitution.
4. **Wait for explicit confirmation** before writing code that knowingly deviates from the constitution.

A fast answer that breaks the constitution is not a correct answer. When in doubt, pause and ask rather than assume.

---

## Chapter 1 — Project Identity

**Project Name:** CampusOne

**Product Type:** Enterprise Multi-Tenant SaaS

**Target Platforms:**
- Android
- iOS
- Web
- Desktop (Future)

**Architecture:**
- Vanilla JavaScript
- ES Modules
- JS Render (no framework)
- Component Driven
- Firebase (Auth, Firestore, Storage)

**Status:** Production Architecture Locked

**Rule:** Never redesign the architecture. Extend it.

---

## Chapter 2 — Architecture Rules

**Always follow this flow:**

```
UI
 ↓
Controller
 ↓
Service
 ↓
Firebase
```

- Never bypass the Service Layer.
- Never import the Firebase SDK inside a Controller.
- Business logic belongs inside Services only.
- Controllers are only responsible for:
  - Rendering UI
  - Validating input
  - Calling Services
  - Handling events

**Golden Rule Link:** *Architecture over Shortcut*

---

## Chapter 3 — Design System Rules

**Never hardcode:**
- Colors
- Spacing
- Border radius
- Shadows
- Font sizes

**Always use the shared design tokens:**
- `variables.css`
- `spacing.css`
- `animations.css`
- `components.css`
- `utilities.css`

**Golden Rule Link:** *Zero Hardcoded Design Values*

---

## Chapter 4 — Component Rules

- Every UI must be reusable.
- Single Responsibility per component.
- No duplicate CSS.
- No duplicate JS.
- One component = one purpose.

**Every component must be:**
- Dark Mode Ready
- Responsive
- Accessible
- Reusable

**Golden Rule Link:** *Reusable over Duplicate*

---

## Chapter 5 — Animation Rules

Every transition (fade, scale, slide, shimmer) must be:
- GPU Accelerated
- 60 FPS
- Free of layout shift
- Free of white flash
- Free of flicker

Use `transform` and `opacity`. Avoid animating expensive properties (`width`, `height`, `top`, `left`).

**Golden Rule Link:** *Animation with Purpose*

---

## Chapter 6 — Skeleton Rules

Every async screen must show a Skeleton — never text like:
- "Loading…"
- "Please Wait…"
- "Verifying…"
- "Checking…"

Users should only ever see a Skeleton. Skeleton fades out, real UI fades in.

**Exception Clause:**
Skeletons are not required for instant, synchronous actions with no network round-trip — e.g. inline field validation errors, client-side form checks, or toggle states that resolve in a single frame. In these cases, immediate inline feedback replaces the skeleton. If in doubt, default to a skeleton.

**Golden Rule Link:** *Skeleton before Content*

---

## Chapter 7 — UX Rules

Every action must provide feedback. Buttons must support:
- Loading
- Disabled
- Success
- Error

Screens must support:
- Empty State
- Offline State

No dead clicks. No invisible processes.

---

## Chapter 8 — Performance Rules

- Lazy Load
- Dynamic Import
- Cache
- Cleanup / Destroy event listeners on unmount
- No memory leaks
- Minimal DOM updates
- Avoid duplicate rendering

**Golden Rule Link:** *Performance over Fancy*

---

## Chapter 9 — Security Rules

- Never trust the client.
- Validate everything.
- Sanitize all inputs.
- Never expose secrets in client code.
- Enforce role-based access control.
- Firestore Rules are the first line of defense; frontend checks are the second, not a substitute.

---

## Chapter 10 — Scalability Rules

Every feature must support all current and future roles without rewriting:
- Platform Super Admin
- Institution Owner
- Institution Admin
- Department Admin
- Faculty
- Student
- Parent
- Future modules

No duplicated dashboards. Maximum reuse across roles.

---

## Chapter 11 — Code Quality Rules

- Readable
- Maintainable
- Scalable
- No magic numbers
- No hardcoded strings
- No dead code
- No `console.log` in production
- Meaningful naming
- Small, focused functions

---

## Chapter 12 — AI Rules

**Before writing code, always:**
1. Understand the existing architecture.
2. Never assume — inspect the existing code first.
3. Modify the minimum number of files necessary.
4. Never rewrite working code without explicit instruction.
5. Maintain backward compatibility.
6. Prefer extension over replacement.

**Enforcement:**
If a request conflicts with this constitution, flag the conflict before writing any code — do not silently break a rule to satisfy the request. State which chapter/rule is in tension and let the user decide how to proceed.

**If uncertain:** explain first, then code.

**Every response involving code changes must include:**
- **Problem** — what is being solved
- **Files** — which files are affected
- **Reason** — why this approach was chosen
- **Code** — the actual implementation
- **Integration** — how it connects to existing code
- **Verification** — how to confirm it works

---

## Chapter 13 — Routing Standard

- Never create a new router. Always use the existing router.
- Dynamic imports are preferred for route-level code.
- Navigation is registry-driven — routes are declared in the registry, not scattered across files.
- No hardcoded route strings inside components; reference the registry.

**Golden Rule Link:** *One Source of Truth*

---

## Chapter 14 — Firebase Rules

- Never import the Firebase SDK outside of Services (reinforces Chapter 2).
- Every Firebase operation must flow: **Service → Controller → UI**, never the reverse and never a shortcut.
- Standards apply uniformly across:
  - Transactions
  - Batch writes
  - Storage operations
  - Cloud Functions calls
- Firestore reads/writes are never issued directly from a Controller or UI file.

**Golden Rule Link:** *Architecture over Shortcut*

---

## Chapter 15 — State Management Rules

CampusOne is a JS-render project (no framework-managed state), so discipline here is manual:

- Never mutate the DOM randomly outside the render flow.
- All UI updates happen through the established render function for that component.
- Keep a single source of truth per piece of state — no parallel copies drifting out of sync.
- Destroy event listeners when a component/view is torn down.
- No duplicated state across modules holding the same data independently.

**Golden Rule Link:** *One Source of Truth*

---

## Chapter 16 — Accessibility

Mandatory for every screen, not optional polish:

- ARIA roles/attributes on custom components (dropdowns, modals, tabs, etc.)
- Full keyboard navigation (tab order, enter/escape/arrow handling where relevant)
- Visible focus management, especially in modals and dynamic content
- Screen-reader-friendly markup (labels, live regions for async updates)
- Respect `prefers-reduced-motion`
- Sufficient color contrast in both light and dark mode

**Golden Rule Link:** *Accessibility by Default*

---

## Chapter 17 — Git Rules

Every AI-authored change must be commit-ready using Conventional Commits:

- `feat:` — new feature
- `fix:` — bug fix
- `refactor:` — code change with no behavior change
- `docs:` — documentation only
- `style:` — formatting, no logic change
- `perf:` — performance improvement

Commit messages describe the *what and why*, scoped to the module touched (e.g. `feat(profile): add photo sync to Firebase Storage`).

---

## Chapter 18 — Review Checklist

A feature is **not considered complete** until every item below is verified:

- [ ] Architecture — follows UI → Controller → Service → Firebase
- [ ] Performance — lazy loaded, no duplicate rendering
- [ ] Accessibility — ARIA, keyboard, focus, contrast
- [ ] Dark Mode — fully supported
- [ ] Skeleton — present for async states (or exempted per Chapter 6)
- [ ] Animation — GPU accelerated, no flicker
- [ ] Responsive — mobile-first, verified across breakpoints
- [ ] Memory Leak — listeners cleaned up, no orphaned state
- [ ] Import Paths — correct, no bare specifiers, no dead imports
- [ ] Dead Code — none left behind

If any box is unchecked, the feature is **in progress**, not done.

---

## Chapter 19 — Testing Standards

Every feature must be verified against the following before it can be marked complete:

**Functional Testing**
- Happy path
- Invalid input
- Empty state
- Offline state
- Permission denied
- Slow network
- Refresh behaviour (state survives or resets correctly)

**Regression Testing**
- Existing functionality still works after the change

**Performance Testing**
- First render time
- Skeleton-to-content transition
- Memory usage over the session

**Cross-Platform**
- Android
- iOS
- Chrome
- Firefox
- Edge

**Golden Rule Link:** *Think Production First*

---

## Chapter 20 — Documentation Rules

After every major feature:

- Update `README.md` if public-facing behavior changed.
- Update `CHANGELOG.md` with the change, dated and scoped.
- Document any new reusable service or component (purpose, inputs/outputs, usage example) so future AI/developer sessions don't have to reverse-engineer it.

Undocumented reusable code is treated as incomplete, per Chapter 18.

---

## Chapter 21 — Deprecation Policy

- Never directly delete working code.
- If replacing something, provide a migration path from old to new.
- Mark deprecated code clearly (e.g. `// @deprecated — use X instead, remove in vX.0`).
- Remove deprecated code only in the next major version, not opportunistically.

This keeps refactors safe and reversible across the codebase's lifetime.

**Golden Rule Link:** *No Breaking Changes*

---

## 🌟 CampusOne Golden Rules

1. Premium over Fast
2. Reusable over Duplicate
3. Architecture over Shortcut
4. Performance over Fancy
5. Consistency over Creativity
6. Accessibility by Default
7. Mobile First
8. Skeleton before Content
9. Animation with Purpose
10. One Source of Truth
11. Zero Hardcoded Design Values
12. No Breaking Changes
13. Think Production First

---

## 📈 Versioning Strategy

This document versions alongside the project itself:

| Version | Scope |
|---|---|
| v1.0 | Foundation |
| v1.1 | Authentication standards |
| v1.2 | Dashboard standards |
| v1.3 | Forms & Tables |
| v2.0 | Institution ecosystem |
| v3.0 | AI-assisted modules |

Every new feature must follow the constitution active at the time of writing. When a chapter is added or changed, bump the version and log the change below.

### Changelog
- **v1.0** — Initial constitution established (Chapters 1–12, Golden Rules, Versioning Strategy).
- **v2.0** — Added Chapter 0 (Constitution Priority / Supreme Rule) and Chapters 13–18 (Routing Standard, Firebase Rules, State Management Rules, Accessibility, Git Rules, Review Checklist).
- **v2.1** — Added Chapters 19–21 (Testing Standards, Documentation Rules, Deprecation Policy).

---

## 📂 Companion Files

This constitution defines *rules*. Two companion files at the project root carry the *state*:

| File | Purpose |
|---|---|
| `AI_CONSTITUTION.md` | Engineering rules (this file) — update only on project-level policy changes. |
| `ARCHITECTURE.md` | Project structure, module relationships, routing flow, service flow, naming conventions. |
| `CHANGELOG.md` | Dated record of every significant change, per Chapter 20. |

Any AI starting a new session should read all three before making changes.
