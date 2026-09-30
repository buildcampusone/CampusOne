/**
 * ==========================================================
 * CampusOne
 * Navigation State Manager
 * ----------------------------------------------------------
 * Framework-free, namespaced "single source of truth" for
 * which route is currently active in a given shell.
 *
 * Why this exists:
 *   Before this file, "what's active" lived only inside
 *   router.super.js's private `activeModuleId` variable, and
 *   every surface that needed to reflect it (sidebar, bottom
 *   nav, and eventually breadcrumbs / tab bars in the future
 *   Institution Admin shell) had to be told explicitly, by
 *   hand, from shell.controller.js's onNavigate callback.
 *   That works, but it means every new nav surface requires
 *   another wire to be run from the shell outward.
 *
 *   NavigationState flips that: any router calls
 *   `setActive()` once, and any surface — now or in a shell
 *   that doesn't exist yet — can `subscribe()` to be told
 *   whenever it changes, without the router or shell needing
 *   to know that surface exists.
 *
 * Namespacing:
 *   Each shell owns its own namespace ("super-admin" today;
 *   "institution-admin" tomorrow) so two shells can never
 *   read or clobber each other's active route by accident.
 *
 * Zero Breaking Changes:
 *   This is purely additive. Nothing existing is required to
 *   call into this file for the app to keep working exactly
 *   as it does today — router.super.js and
 *   bottom-nav.controller.js opt in to it, but their existing
 *   public functions and call sites are unchanged.
 * ==========================================================
 */

const namespaces = new Map();

/**
 * Get (or lazily create) the navigation state for a namespace.
 *
 * @param {string} namespace - e.g. "super-admin"
 * @returns {{
 *   getActive: () => string|null,
 *   setActive: (routeId: string) => void,
 *   subscribe: (fn: (routeId: string|null, prevRouteId: string|null) => void) => () => void,
 *   reset: () => void
 * }}
 */
export function getNavigationState(namespace) {

    if (!namespace) {
        throw new Error("[NavigationState] A namespace is required.");
    }

    if (!namespaces.has(namespace)) {

        namespaces.set(namespace, createStore());

    }

    return namespaces.get(namespace);

}

/**
 * Tears down a namespace entirely (listeners + state). Mainly
 * useful for tests, or a future full shell teardown (logout
 * from one role's shell before mounting another's).
 */
export function destroyNavigationState(namespace) {

    namespaces.get(namespace)?.reset();
    namespaces.delete(namespace);

}

/* ==========================================================
   Store factory
========================================================== */

function createStore() {

    let activeRouteId = null;
    const listeners = new Set();

    function getActive() {

        return activeRouteId;

    }

    function setActive(routeId) {

        if (routeId === activeRouteId) return;

        const previous = activeRouteId;

        activeRouteId = routeId;

        listeners.forEach((listener) => {

            try {

                listener(activeRouteId, previous);

            } catch (error) {

                console.error("[NavigationState] Subscriber threw:", error);

            }

        });

    }

    function subscribe(listener) {

        if (typeof listener !== "function") return () => {};

        listeners.add(listener);

        return () => {

            listeners.delete(listener);

        };

    }

    function reset() {

        activeRouteId = null;
        listeners.clear();

    }

    return { getActive, setActive, subscribe, reset };

}
