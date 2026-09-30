/**
 * ==========================================================
 * CampusOne
 * Active Tab Manager — Composed Foundation
 * ----------------------------------------------------------
 * Part 2.1: Active Navigation State — Foundation
 *
 * Wires the Part 2.1 building blocks — tab registry, state,
 * detection, and the class-switching painter — into one
 * ready-to-use instance, the same createX({...}).init() shape
 * as Part 1's createBottomNavEngine(), so a future controller
 * (Super Admin's bottom-nav.controller.js, or an Institution
 * Admin equivalent that doesn't exist yet) can adopt this
 * instead of hand-wiring state + painting + subscriptions
 * itself.
 *
 * NOT wired into bottom-nav.controller.js by this phase. This
 * file is the reusable factory; adoption — deciding when
 * setRouteActive()/setEphemeralActive() get called from real
 * router/sheet events — is deliberately left to a later phase,
 * per "foundation only, no routing changes, no UI redesign".
 *
 * Usage (future):
 *
 *   const activeTab = createActiveTabManager({
 *       namespace: "super-admin",
 *       rootEl: document.getElementById("saBottomNav")
 *   });
 *
 *   activeTab.init();
 *   activeTab.setRouteActive("dashboard");     // route tabs
 *   activeTab.setEphemeralActive("activity");  // sheet opened
 *   activeTab.clearEphemeralActive();          // sheet closed
 *   activeTab.destroy();
 * ==========================================================
 */

import { getActiveTabState, destroyActiveTabState } from "./active-tab.state.js";
import { detectActiveTab } from "./active-tab.detector.js";
import { paintActiveTab } from "./active-tab.painter.js";
import { registerNamespaceTabs } from "./tab-registry.js";

const DEFAULTS = {
    itemSelector: ".bn-item",
    activeClass: "is-active",
    datasetKeys: { idKey: "bottomnavId" }
};

/**
 * @param {object} options
 * @param {string} options.namespace - matches the shell's NavigationState namespace, e.g. "super-admin".
 *   Also the key Active Tab Manager resolves this shell's own tab registry under (see tab-registry.js) —
 *   do not reuse "institution-owner" for another shell.
 * @param {HTMLElement} options.rootEl - container the nav items live in.
 * @param {string} [options.itemSelector]
 * @param {string} [options.activeClass]
 * @param {{ idKey: string }} [options.datasetKeys]
 * @param {Array<{id: string, kind: "route"|"action"}>} [options.tabs] - Sub-Phase 1.3C: this namespace's own
 *   tab list. Optional, opt-in — when provided, it's registered into the shared tab registry (tab-registry.js's
 *   registerNamespaceTabs()) before this manager's state is created, so a role never has to hand-roll its own
 *   copy of isKnownTabId()/getTabKind() logic to get namespace-correct validation. Omit entirely to fall back to
 *   the legacy global registry (Institution Owner's own ids) — this is what keeps Institution Owner's existing
 *   `createActiveTabManager({ namespace: "institution-owner", ... })` call (no `tabs`) behaving exactly as before.
 */
export function createActiveTabManager(options) {

    const config = { ...DEFAULTS, ...options };

    if (!config.namespace) {
        throw new Error("[ActiveTabManager] `namespace` is required.");
    }

    if (!config.rootEl) {
        throw new Error("[ActiveTabManager] `rootEl` is required.");
    }

    if (config.tabs) {

        registerNamespaceTabs(config.namespace, config.tabs);

    }

    const state = getActiveTabState(config.namespace);

    let routeId = null;
    let ephemeralActiveId = null;
    let unsubscribe = null;

    function init() {

        unsubscribe = state.subscribe(paint);

        paint();

        return api;

    }

    function destroy() {

        unsubscribe?.();
        unsubscribe = null;

    }

    /**
     * Reflects the shell's currently active route (Dashboard,
     * Institutions, Profile). Safe to call before init().
     */
    function setRouteActive(id) {

        routeId = id;

        recompute();

    }

    /**
     * Marks an action tab (Alerts, Activity) as active while
     * its panel/sheet is open. Takes priority over routeId
     * until cleared — see active-tab.detector.js.
     */
    function setEphemeralActive(id) {

        ephemeralActiveId = id;

        recompute();

    }

    /**
     * Call when the action tab's panel/sheet closes, so active
     * state falls back to whatever route is current.
     */
    function clearEphemeralActive() {

        ephemeralActiveId = null;

        recompute();

    }

    function recompute() {

        const resolved = detectActiveTab({ routeId, ephemeralActiveId, namespace: config.namespace });

        state.setActive(resolved);

    }

    function paint() {

        const entries = [...config.rootEl.querySelectorAll(config.itemSelector)].map((el) => ({
            id: el.dataset[config.datasetKeys.idKey],
            el
        }));

        paintActiveTab(entries, state.getActive(), { activeClass: config.activeClass });

    }

    function getActive() {

        return state.getActive();

    }

    const api = {
        init,
        destroy,
        setRouteActive,
        setEphemeralActive,
        clearEphemeralActive,
        getActive
    };

    return api;

}

/**
 * Tears down a namespace's underlying ActiveTabState entirely.
 * Mainly useful for tests or a future full shell teardown.
 */
export function destroyActiveTabManagerNamespace(namespace) {

    destroyActiveTabState(namespace);

}
