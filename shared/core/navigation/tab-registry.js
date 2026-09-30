/**
 * ==========================================================
 * CampusOne
 * Bottom Navigation Tab Registry
 * ----------------------------------------------------------
 * Part 2.1: Active Navigation State — Foundation
 * Sub-Phase 1.3C: Namespace-Aware Registry
 *
 * Single source of truth for which tabs exist in the bottom
 * navigation and what "kind" each one is. Nothing here reads
 * or writes DOM, routes, or state — it only answers
 * "what tabs are there, and what kind is each one".
 *
 * kind:
 *   "route"  — tapping it navigates (Dashboard, Institution).
 *              Part 1's bottom-nav.engine.js already treats
 *              these as routeType === "route".
 *   "action" — tapping it opens a panel/sheet and never
 *              navigates (Actions, Alerts, Profile). Part 1
 *              deliberately never paints these as active (see
 *              active-route.detector.js's isRouteItemActive) —
 *              Part 2.x adds ephemeral active state for these
 *              via active-tab.manager.js instead.
 *
 * Part 2.1 needs a registry that knows about ALL five tabs
 * (not just the three routes) because its job is detecting
 * "which tab should look active" in a more general sense —
 * including an action tab whose panel/sheet is currently open.
 * Kept as its own file, separate from active-route.detector.js,
 * so Part 1's route-only behaviour is never touched.
 *
 * ----------------------------------------------------------
 * Sub-Phase 1.3C — why this file changed
 * ----------------------------------------------------------
 * Through Sub-Phase 1.3B this was a single, hardcoded,
 * module-level list — Institution Owner's own 5 tab ids. Any
 * other role sharing Active Tab Manager would have most of its
 * ids rejected as "unknown" (see PHASE-1_3B-FEATURE-ACTIVATION
 * -REPORT.md for the exact id-by-id breakdown). This phase
 * makes the registry namespace-aware: a Map of namespace ->
 * frozen tab list, instead of one global fixed list.
 *
 * Backward compatibility, by construction:
 *   - `BOTTOM_NAV_TABS` still exports the exact same 5 frozen
 *     objects it always did — nothing that imports it directly
 *     sees any change.
 *   - Those same 5 objects are what the "institution-owner"
 *     namespace is pre-registered with below (by reference, not
 *     a copy) — so Institution Owner's own
 *     createActiveTabManager({ namespace: "institution-owner" })
 *     call resolves to the identical list it always has.
 *   - `isKnownTabId(id, namespace)` / `getTabKind(id, namespace)`
 *     both take an OPTIONAL second argument. Any existing call
 *     site that only ever passed one argument still resolves
 *     against the legacy global list, unchanged.
 * ==========================================================
 */

export const BOTTOM_NAV_TABS = Object.freeze([
    Object.freeze({ id: "dashboard", kind: "route" }),
    Object.freeze({ id: "institution", kind: "route" }),
    Object.freeze({ id: "actions", kind: "action" }),
    Object.freeze({ id: "alerts", kind: "action" }),
    Object.freeze({ id: "profile", kind: "action" })
]);

/**
 * namespace -> Object.freeze([{ id, kind }, ...])
 *
 * "institution-owner" is seeded with BOTTOM_NAV_TABS itself
 * (same array, same objects — not a clone) so the reference
 * implementation's behaviour can never drift from the legacy
 * export by even an object-identity difference.
 */
const NAMESPACE_REGISTRIES = new Map([
    ["institution-owner", BOTTOM_NAV_TABS]
]);

/**
 * Registers (or replaces) a namespace's own tab list. Additive,
 * opt-in — a namespace that never calls this simply has no
 * registry of its own (see the fallback behaviour on
 * isKnownTabId/getTabKind below).
 *
 * Idempotent: calling this again for the same namespace fully
 * replaces its previous list rather than merging with it — the
 * same "always fully replaces" contract active-tab.state.js
 * already uses for setActive().
 *
 * @param {string} namespace - e.g. "super-admin".
 * @param {Array<{id: string, kind: "route"|"action"}>} tabs
 */
export function registerNamespaceTabs(namespace, tabs) {

    if (!namespace) {
        throw new Error("[TabRegistry] `namespace` is required.");
    }

    if (!Array.isArray(tabs) || tabs.length === 0) {
        throw new Error("[TabRegistry] `tabs` must be a non-empty array.");
    }

    const frozen = Object.freeze(
        tabs.map((tab) => Object.freeze({ id: tab.id, kind: tab.kind }))
    );

    NAMESPACE_REGISTRIES.set(namespace, frozen);

}

/**
 * @param {string} [namespace]
 * @returns {ReadonlyArray<{id: string, kind: "route"|"action"}>}
 *   The namespace's own list if one is registered, otherwise the
 *   legacy global BOTTOM_NAV_TABS — this is the one fallback
 *   rule every lookup in this file shares, so an un-migrated
 *   caller (or a caller that never passes a namespace) keeps
 *   Sub-Phase 1.3B behaviour exactly.
 */
export function getNamespaceTabs(namespace) {

    if (namespace && NAMESPACE_REGISTRIES.has(namespace)) {

        return NAMESPACE_REGISTRIES.get(namespace);

    }

    return BOTTOM_NAV_TABS;

}

/**
 * @param {string} id
 * @param {string} [namespace] - defaults to the legacy global list when omitted or unregistered.
 * @returns {boolean}
 */
export function isKnownTabId(id, namespace) {

    return getNamespaceTabs(namespace).some((tab) => tab.id === id);

}

/**
 * @param {string} id
 * @param {string} [namespace] - defaults to the legacy global list when omitted or unregistered.
 * @returns {"route"|"action"|null}
 */
export function getTabKind(id, namespace) {

    return getNamespaceTabs(namespace).find((tab) => tab.id === id)?.kind ?? null;

}
