/**
 * ==========================================================
 * CampusOne
 * Active Tab State Manager
 * ----------------------------------------------------------
 * Part 2.1: Active Navigation State — Foundation
 *
 * Namespaced, single-source-of-truth store for "which of the
 * bottom-nav tabs is currently active" — generalized beyond
 * Part 1's NavigationState (navigation-state.manager.js),
 * which only ever tracks route ids. This store accepts any id
 * registered in tab-registry.js, route or action, so a future
 * phase can reflect Alerts/Activity as "active" while their
 * panel/sheet is open, without inventing a second parallel
 * system per tab kind.
 *
 * Only one tab can ever be active at a time — setActive()
 * always fully replaces the previous value, it never adds to
 * a set. Same shape as Part 1's store (getActive / setActive /
 * subscribe / reset) on purpose, so it's immediately familiar.
 *
 * Zero Breaking Changes:
 * This is purely additive scaffolding. It does not touch the
 * DOM, does not import a router, and is not wired into
 * bottom-nav.controller.js by this phase — a later phase opts
 * in, exactly like Part 1's NavigationState was additive when
 * it shipped.
 * ==========================================================
 */

import { isKnownTabId } from "./tab-registry.js";

const stores = new Map();

/**
 * Get (or lazily create) the active-tab state for a namespace.
 *
 * @param {string} namespace - e.g. "super-admin"
 * @returns {{
 *   getActive: () => string|null,
 *   setActive: (tabId: string|null) => void,
 *   isActive: (tabId: string) => boolean,
 *   subscribe: (fn: (tabId: string|null, prevTabId: string|null) => void) => () => void,
 *   reset: () => void
 * }}
 */
export function getActiveTabState(namespace) {

    if (!namespace) {
        throw new Error("[ActiveTabState] A namespace is required.");
    }

    if (!stores.has(namespace)) {

        stores.set(namespace, createStore(namespace));

    }

    return stores.get(namespace);

}

/**
 * Tears down a namespace entirely (listeners + state). Mainly
 * useful for tests, or a future full shell teardown.
 */
export function destroyActiveTabState(namespace) {

    stores.get(namespace)?.reset();
    stores.delete(namespace);

}

/* ==========================================================
   Store factory
========================================================== */

function createStore(namespace) {

    let activeTabId = null;
    const listeners = new Set();

    function getActive() {

        return activeTabId;

    }

    function setActive(tabId) {

        if (tabId !== null && !isKnownTabId(tabId, namespace)) {

            console.error(`[ActiveTabState] Unknown tab id "${tabId}" ignored.`);

            return;

        }

        if (tabId === activeTabId) return;

        const previous = activeTabId;

        activeTabId = tabId;

        listeners.forEach((listener) => {

            try {

                listener(activeTabId, previous);

            } catch (error) {

                console.error("[ActiveTabState] Subscriber threw:", error);

            }

        });

    }

    function isActive(tabId) {

        return tabId !== null && tabId === activeTabId;

    }

    function subscribe(listener) {

        if (typeof listener !== "function") return () => {};

        listeners.add(listener);

        return () => {

            listeners.delete(listener);

        };

    }

    function reset() {

        activeTabId = null;
        listeners.clear();

    }

    return { getActive, setActive, isActive, subscribe, reset };

}
