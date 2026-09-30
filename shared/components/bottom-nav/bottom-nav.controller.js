/**
 * ==========================================================
 * CampusOne
 * Shared Bottom Navigation — Controller Factory (Phase 7)
 * Sub-Phase 1.3: Bottom Nav Feature Parity Pass
 * ----------------------------------------------------------
 * The ONE piece of behaviour every role's Bottom Navigation is
 * built from. A role's own bottom-nav.controller.js (see
 * modules/super-admin/components/bottom-nav/ and
 * modules/institution-admin/components/bottom-nav/) is now just
 * a few lines: call createBottomNav() with that role's root
 * element id and what a "route" tap / "action" tap means for
 * that role, then re-export init/destroy/setActive so
 * shell.controller.js's contract never changes.
 *
 * What lives here (shared, never duplicated):
 *   - Wiring to the reusable click/active-state engine
 *     (shared/core/navigation/bottom-nav.engine.js).
 *   - Hiding the floating pill while the full-screen sidebar
 *     drawer is open, in sync with sidebar.controller.js's
 *     "sidebar:statechange" broadcast — both Super Admin and
 *     Institution Admin needed this exact behaviour, so it's
 *     implemented once instead of twice.
 *   - Sub-Phase 1.3 (all opt-in, OFF unless explicitly passed —
 *     Super Admin's and Institution Admin's existing calls are
 *     untouched by this pass and behave exactly as before):
 *       - Pass-through engine config (itemSelector, activeClass,
 *         routeType, iconSelector, tapClass, tapAnimation,
 *         datasetKeys) for roles whose markup doesn't use the
 *         "bn-*" classnames.
 *       - `activeTabManager` — swaps plain route-only active
 *         state for shared/core/navigation/active-tab.manager.js,
 *         adding setEphemeralActive()/clearEphemeralActive() for
 *         action tabs (Alerts/Actions/Profile) the way Institution
 *         Owner's own controller already does.
 *       - `pressEffects` — the premium press/ripple/wave tap
 *         feedback Institution Owner's dashboard has, now
 *         available via shared/core/navigation/bottom-nav-press.engine.js.
 *       - `autoHide` — the scroll-based show/hide Institution
 *         Owner's dashboard has, now available via
 *         shared/core/navigation/bottom-nav-autohide.engine.js.
 *     These exist so the shared engine has full Institution Owner
 *     feature parity available to opt into. Migrating Super Admin
 *     / Institution Admin onto any of them is a separate, later
 *     phase — see PHASE-1.3-FEATURE-PARITY-REPORT.md.
 *
 * What deliberately stays OUT of this file (role-specific glue,
 * owned by each role's own thin controller):
 *   - What a route id navigates to (each role's own router).
 *   - What an action id does (e.g. Institution Admin's
 *     "Profile" reusing the topbar's #profileButton).
 * ==========================================================
 */

import {
    createBottomNavEngine,
    createActiveTabManager,
    createBottomNavPressEffects,
    createBottomNavAutoHide
} from "../../core/navigation/index.js";

/**
 * @param {object} options
 * @param {string} options.rootId - id of this shell's `<nav>` mount (e.g. "saBottomNav").
 * @param {(id: string, item: HTMLElement) => void} [options.onRouteClick]
 * @param {(id: string, type: string, item: HTMLElement) => void} [options.onActionClick]
 * @param {boolean} [options.syncWithSidebar] - hide the pill while the mobile sidebar drawer is open. Default true.
 * @param {string} [options.hiddenClass] - class toggled by the sidebar-sync above. Default "bn-hidden" (unchanged default).
 * @param {string} [options.itemSelector] - passthrough to createBottomNavEngine; omit to keep today's "bn-*" defaults.
 * @param {string} [options.activeClass] - passthrough to createBottomNavEngine.
 * @param {string} [options.routeType] - passthrough to createBottomNavEngine.
 * @param {string} [options.iconSelector] - passthrough to createBottomNavEngine.
 * @param {string} [options.tapClass] - passthrough to createBottomNavEngine.
 * @param {boolean} [options.tapAnimation] - passthrough to createBottomNavEngine.
 * @param {{idKey: string, typeKey: string}} [options.datasetKeys] - passthrough to createBottomNavEngine.
 * @param {{namespace: string, tabs?: Array<{id: string, kind: "route"|"action"}>, itemSelector?: string, activeClass?: string, datasetKeys?: object}} [options.activeTabManager] -
 *   opt-in: when provided, setActive()/getActive() delegate to shared/core/navigation/active-tab.manager.js
 *   (createActiveTabManager) instead of the raw engine, and setEphemeralActive()/clearEphemeralActive() become
 *   available — the same mechanism Institution Owner's own controller uses for Alerts/Actions/Profile tabs.
 *   `namespace` must be unique per shell (do not reuse "institution-owner"). Sub-Phase 1.3C: pass this role's
 *   own `tabs` (id + kind for each of its bottom-nav items, e.g. derived from its own bottom-nav.config.js) so
 *   Active Tab Manager validates against this shell's real ids instead of Institution Owner's — see
 *   tab-registry.js's registerNamespaceTabs(). Omit `tabs` and it falls back to Institution Owner's ids, which
 *   is almost never what a non-Institution-Owner shell wants.
 * @param {true|object} [options.pressEffects] - opt-in: `true` for defaults, or an options object forwarded to
 *   createBottomNavPressEffects (itemSelector, iconSelector, labelSelector, rippleSelector, waveSelector, pressMs,
 *   releaseMs, pressEase, releaseEase).
 * @param {{scrollEl: HTMLElement|string, hideClass?: string, threshold?: number}} [options.autoHide] - opt-in:
 *   forwarded to createBottomNavAutoHide. `scrollEl` may be an element or an id string.
 * @returns {{
 *   init: () => void,
 *   destroy: () => void,
 *   setActive: (routeId: string) => void,
 *   getActive: () => string|null,
 *   setEphemeralActive: (id: string) => void,
 *   clearEphemeralActive: () => void
 * }}
 */
export function createBottomNav({
    rootId,
    onRouteClick,
    onActionClick,
    syncWithSidebar = true,
    hiddenClass = "bn-hidden",
    itemSelector,
    activeClass,
    routeType,
    iconSelector,
    tapClass,
    tapAnimation,
    datasetKeys,
    activeTabManager = null,
    pressEffects = null,
    autoHide = null
}) {

    const state = {
        initialized: false,
        rootEl: null,
        engine: null,
        activeTab: null,
        press: null,
        autoHide: null,
        onSidebarStateChange: null
    };

    function init() {

        if (state.initialized) destroy();

        state.rootEl = document.getElementById(rootId);

        if (!state.rootEl) {

            console.error(`[CampusOne] Bottom nav root (#${rootId}) not found.`);

            return;

        }

        state.engine = createBottomNavEngine({
            rootEl: state.rootEl,
            onRouteClick,
            onActionClick,
            ...(itemSelector !== undefined ? { itemSelector } : {}),
            ...(activeClass !== undefined ? { activeClass } : {}),
            ...(routeType !== undefined ? { routeType } : {}),
            ...(iconSelector !== undefined ? { iconSelector } : {}),
            ...(tapClass !== undefined ? { tapClass } : {}),
            ...(tapAnimation !== undefined ? { tapAnimation } : {}),
            ...(datasetKeys !== undefined ? { datasetKeys } : {})
        }).init();

        if (activeTabManager) {

            state.activeTab = createActiveTabManager({
                rootEl: state.rootEl,
                ...activeTabManager
            }).init();

        }

        if (pressEffects) {

            state.press = createBottomNavPressEffects({
                rootEl: state.rootEl,
                ...(pressEffects === true ? {} : pressEffects)
            }).init();

        }

        if (autoHide) {

            state.autoHide = createBottomNavAutoHide({
                navEl: state.rootEl,
                ...autoHide
            }).init();

        }

        if (syncWithSidebar) initSidebarSync();

        state.initialized = true;

    }

    function destroy() {

        if (!state.initialized) return;

        state.engine?.destroy();
        state.activeTab?.destroy();
        state.press?.destroy();
        state.autoHide?.destroy();

        if (state.onSidebarStateChange) {

            window.removeEventListener("sidebar:statechange", state.onSidebarStateChange);

        }

        state.initialized = false;
        state.rootEl = null;
        state.engine = null;
        state.activeTab = null;
        state.press = null;
        state.autoHide = null;
        state.onSidebarStateChange = null;

    }

    function setActive(routeId) {

        if (state.activeTab) {

            state.activeTab.setRouteActive(routeId);

            return;

        }

        state.engine?.setActive(routeId);

    }

    function getActive() {

        if (state.activeTab) return state.activeTab.getActive();

        return state.engine?.getActive() ?? null;

    }

    /**
     * Marks an action tab (e.g. Alerts, Actions, Profile) active
     * while its panel/sheet is open. No-op unless `activeTabManager`
     * was configured. Mirrors Institution Owner's own handleActionClick().
     */
    function setEphemeralActive(id) {

        state.activeTab?.setEphemeralActive(id);

    }

    /**
     * Call when the action tab's panel/sheet closes. No-op unless
     * `activeTabManager` was configured.
     */
    function clearEphemeralActive() {

        state.activeTab?.clearEphemeralActive();

    }

    function initSidebarSync() {

        state.onSidebarStateChange = (event) => {

            const { isOpen, isMobile } = event.detail || {};

            state.rootEl?.classList.toggle(
                hiddenClass,
                Boolean(isMobile && isOpen)
            );

        };

        window.addEventListener("sidebar:statechange", state.onSidebarStateChange);

    }

    return {
        init,
        destroy,
        setActive,
        getActive,
        setEphemeralActive,
        clearEphemeralActive
    };

}
