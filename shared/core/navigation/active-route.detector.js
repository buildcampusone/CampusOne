/**
 * ==========================================================
 * CampusOne
 * Active Route Detection
 * ----------------------------------------------------------
 * Small, framework-free helpers for two recurring jobs every
 * router + nav surface in this codebase needs:
 *
 *   1. Pull a route id out of `location.hash` for a given
 *      shell prefix (router.super.js used to hand-roll this
 *      regex itself; it's now shared so a future
 *      router.institution-admin.js doesn't have to).
 *
 *   2. Decide whether a given nav item (button/link element,
 *      or a plain descriptor) represents the currently active
 *      route — used by bottom-nav.engine.js, and safe for a
 *      sidebar or breadcrumb to call too.
 *
 * Nothing here touches the DOM's active-state classes — that
 * stays with whichever engine/controller owns those elements.
 * This file only answers "what is active" and "does this item
 * match", never "how should that be painted".
 * ==========================================================
 */

/**
 * Parses the current (or a given) hash string for a route id
 * under a shell prefix.
 *
 * @param {string} shellPrefix - e.g. "super-admin" matches
 *   "#/super-admin/<id>".
 * @param {string} [hash] - defaults to window.location.hash.
 * @returns {string|null}
 */
export function parseHashRoute(shellPrefix, hash = window.location.hash) {

    if (!shellPrefix) return null;

    const pattern = new RegExp(`^#\\/${escapeForRegExp(shellPrefix)}\\/([a-z0-9-]+)`, "i");

    const match = hash.match(pattern);

    return match ? match[1] : null;

}

/**
 * Whether a nav item descriptor represents the active route.
 *
 * A "route" item is only ever active if its type matches
 * `routeType` (default "route") AND its id matches the active
 * id — "action" items (things that trigger a panel/sheet
 * rather than navigate) never receive active state, matching
 * the existing bottom-nav behaviour.
 *
 * @param {{ id: string, type?: string }} item
 * @param {string|null} activeRouteId
 * @param {string} [routeType]
 */
export function isRouteItemActive(item, activeRouteId, routeType = "route") {

    if (!item || !activeRouteId) return false;

    const type = item.type ?? routeType;

    return type === routeType && item.id === activeRouteId;

}

/**
 * Reads a nav item's { id, type } off a DOM element's dataset,
 * given the dataset key names used by that markup. Centralized
 * so bottom-nav.engine.js (and any future engine) can resolve
 * items without every consumer re-deriving `el.dataset.foo`
 * by hand.
 *
 * @param {HTMLElement} el
 * @param {{ idKey?: string, typeKey?: string }} [keys]
 */
export function readRouteItemFromDataset(el, { idKey = "bottomnavId", typeKey = "bottomnavType" } = {}) {

    return {
        id: el?.dataset?.[idKey] ?? null,
        type: el?.dataset?.[typeKey] ?? null
    };

}

function escapeForRegExp(value) {

    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

}
