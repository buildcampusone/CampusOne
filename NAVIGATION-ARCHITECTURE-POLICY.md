# NAVIGATION-ARCHITECTURE-POLICY.md
### CampusOne — Locked Navigation Architecture Decisions

Companion to `ARCHITECTURE.md` §8. This file is the permanent record of the
Canonical Navigation Rule and the decisions made under it. Update this file
only when a new locked decision is made — never to relax one.

---

## 1. Canonical Navigation Rule (LOCKED — Phase 1.3C)

> Institution Owner is the reference implementation.
> Every shared navigation engine must evolve to match Institution Owner.
> Institution Owner must never be changed to accommodate shared engines.

**Scope of "Institution Owner" as reference:** Top Header, Sidebar, Bottom
Navigation, Motion, Press Effects, Ripple, Wave, Active States, Auto Hide,
Accessibility, Responsive Behavior — all of it, not just Bottom Nav.

**What this means in practice:**
- A shared engine (`shared/core/navigation/`, `shared/components/`) gains a
  capability by generalizing something Institution Owner already does, never
  by inventing a new behavior Institution Owner doesn't have.
- If a shared engine's current behavior conflicts with Institution Owner's,
  the shared engine is wrong and gets fixed — Institution Owner is not
  simplified, downgraded, or "made consistent" with the shared engine to
  resolve the conflict.
- The one exception is fixing an actual bug/gap in Institution Owner's own
  implementation (e.g. the ripple markup gap, §3 below) — that's correcting
  the reference itself, not changing it to accommodate anything else, and
  requires explicit sign-off per change since it's the one case where
  Institution Owner's own files are touched.
- Every other role (Platform Super Admin, Institution Admin, and future
  Department Admin / Faculty / Student / Parent dashboards) consumes the
  shared engines and inherits Institution Owner's behavior through them —
  it does not get its own parallel copy of navigation logic.

---

## 2. Active Tab Manager — Namespace-Aware Registry (Phase 1.3C)

**Problem:** `shared/core/navigation/tab-registry.js` was a single hardcoded
list of 5 tab ids — Institution Owner's own ids. Any other role's real
route/action ids mostly didn't match, so `active-tab.state.js`'s
`setActive()` would silently reject them (console.error, no-op — not a
throw), meaning most of that role's tabs would never paint as active if
Active Tab Manager were wired up. Documented in
`PHASE-1_3B-FEATURE-ACTIVATION-REPORT.md`.

**Decision:** `tab-registry.js` now maps `namespace -> tab list` instead of
holding one global list.

- `registerNamespaceTabs(namespace, tabs)` — a role registers its own
  `[{ id, kind }]` list.
- `isKnownTabId(id, namespace)` / `getTabKind(id, namespace)` — `namespace`
  is optional; omitted or unregistered, both fall back to the legacy global
  list (Institution Owner's ids), so any pre-1.3C call site behaves exactly
  as it did in Sub-Phase 1.3B.
- The `"institution-owner"` namespace is pre-seeded with the same
  `BOTTOM_NAV_TABS` array export — by reference, not a copy — so Institution
  Owner's behavior cannot silently drift from what this file has always
  exported.
- `createActiveTabManager({ namespace, tabs })` accepts the tab list
  directly and self-registers it — a role doesn't hand-roll its own
  validation logic or call the registry separately.

**Backward compatibility:** Institution Owner's controller
(`modules/institution-owner/components/bottom-nav/bottom-nav.controller.js`)
calls `createActiveTabManager({ namespace: "institution-owner", ... })` with
no `tabs` option, exactly as it did before this phase — it resolves against
its pre-seeded namespace and is unaffected.

**Activation for other roles is a separate decision.** This phase makes the
architecture *capable* of per-role tab lists; it does not itself wire
`activeTabManager`/`tabs` into Super Admin's or Institution Admin's
controllers. That is future work, tracked as its own phase.

---

## 3. Institution Owner Ripple Markup Gap — Fixed (Phase 1.3C)

`modules/institution-owner/components/bottom-nav/bottom-nav.page.js`
rendered `.io-bottomnav-ripple-layer` as an empty wrapper. The CSS
(`.io-bottomnav-ripple`) and controller
(`positionRipple()`/`restartAnimation()`) both already expected a
`.io-bottomnav-ripple` child element to exist inside it — without it, the
ripple circle silently never rendered (a graceful no-op, not an error).
Press/scale and the wave glow don't depend on this element and were
unaffected.

**Fix:** one child `<span class="io-bottomnav-ripple" aria-hidden="true">`
added inside the existing wrapper. No CSS or controller change — both
already had the correct logic waiting for this element. Institution Owner
now has a fully-correct reference ripple for any shared engine to match
going forward.

---

## 4. Premium Press Effects — Not Activated for Shared `bn-*` (STOPPED, Phase 1.3C)

**Requested:** replace Super Admin's / Institution Admin's native
`.bn-item:active{transform:scale(.94)}` press feedback with the JS-driven
press engine (`shared/core/navigation/bottom-nav-press.engine.js`), on the
condition that the result matches Institution Owner's reference exactly,
with no regressions.

**Finding — a real regression, not a cosmetic gap:** Institution Owner's
own markup deliberately keeps two transforms on two different elements so
they can never collide:
- Press/release scale (`is-pressed`) applies directly to
  `.io-bottomnav-item` and `.io-bottomnav-icon`.
- The active-state "lift" (`translateY(-8px) scale(1.08)`) applies to a
  *separate* wrapper element, `.io-bottomnav-content` — see the comment in
  `modules/institution-owner/components/bottom-nav/bottom-nav.css`
  ("Deliberately its own element ... so this transform/transition never
  shares a property with the item's own press-scale").

The shared `bn-*` markup (`shared/components/bottom-nav/bottom-nav.page.js`)
has no equivalent wrapper — `.bn-item.is-active` and would-be
`.bn-item.is-pressed` both write `transform` **directly onto `.bn-icon`**.
`.bn-item.is-active .bn-icon{transform:translateY(-1px)}` already exists.
Adding `.bn-item.is-pressed .bn-icon{transform:scale(.92)}` to match
Institution Owner's values would mean that pressing the *currently active*
tab — a routine interaction, not an edge case — has two rules of equal
specificity fighting over the same `transform` property on the same
element; CSS lets the later-declared one win outright rather than combining
them, so one of the two intended motions silently disappears depending on
declaration order.

**Per the approval condition — "if any regression is discovered: STOP,
document the issue, do not downgrade the Institution Owner experience" —
this phase stops here.** Super Admin's and Institution Admin's existing
native `:active{scale(.94)}` press feedback is untouched. Making this work
correctly requires the same architectural move Institution Owner already
made: a dedicated content wrapper element in the shared `bn-*` markup so
active-lift and press-scale never share a transform target. That's a markup
change to `shared/components/bottom-nav/bottom-nav.page.js` (and matching
CSS), which is more than "enable an opt-in feature" and needs its own
explicit sign-off — tracked as a follow-up alongside the already-deferred
Wave Animation work (see Next Phase Recommendation).

**Not blocked:** the underlying press engine itself
(`bottom-nav-press.engine.js`) is unchanged, verified working (Sub-Phase
1.3A), and remains ready to wire the moment the markup gap above is
resolved.

---

## 5. Keeping This File Accurate

Update this file only to add a new locked decision or a new documented
STOP. Do not remove or weaken a prior decision here without an explicit,
separately-approved policy change — this file is the audit trail for why
Institution Owner's parity surface looks the way it does.
