/**
 * ==========================================================
 * CampusOne
 * Shared Sidebar — Controller Factory
 * ----------------------------------------------------------
 * The ONE piece of behaviour every role's Sidebar is built
 * from. A role's own sidebar.controller.js (see
 * modules/institution-admin/components/sidebar/ and, going
 * forward, any other role) is now just a thin wrapper: call
 * createSidebar() with that role's ids/selectors and what a
 * nav-item click / logout means for that role, then re-export
 * init/destroy/open/close/toggle/isOpen/setActive under
 * whatever names that role's shell.controller.js and
 * topbar.controller.js already expect
 * (initSidebar/destroySidebar/openSidebar/closeSidebar/
 * toggleSidebar/isSidebarOpen/setActiveModule), so neither of
 * those files' import contracts ever change.
 *
 * Mirrors shared/components/bottom-nav/bottom-nav.controller.js
 * 1:1 in spirit — this file is the stable "component" layer,
 * shared/core/navigation/sidebar.engine.js underneath it is the
 * reusable "engine" layer. Every role's own controller should
 * import from HERE, not reach into the engine directly, so this
 * file stays the one seam every Sidebar consumer goes through.
 *
 * What lives here (shared, never duplicated):
 *   - Wiring to the reusable state-machine engine
 *     (shared/core/navigation/sidebar.engine.js): collapse,
 *     mobile drawer, keyboard nav, focus trap, active state,
 *     tooltips-on-collapse (CSS + aria), a11y, motion/reduced-
 *     motion (CSS-driven, untouched), responsive breakpoints.
 *
 * What deliberately stays OUT of this file (role-specific glue,
 * owned by each role's own thin controller):
 *   - What a route id navigates to (each role's own router).
 *   - What logout does (session clearing, router teardown,
 *     which login route to land on afterwards).
 *   - DOM ids/classes/storage keys/labels — all passed in as
 *     config, never hardcoded here.
 * ==========================================================
 */

import { createSidebarEngine } from "../../core/navigation/index.js";

/**
 * @param {object} options
 * @param {string} options.rootId - id of this role's sidebar root element (e.g. "iaSidebar").
 * @param {string} options.overlayId - id to create/reuse for the mobile drawer scrim (e.g. "iaSidebarOverlay").
 * @param {string} options.overlayClass - className for the overlay element (role-namespaced CSS, e.g. "ia-sidebar-overlay").
 * @param {string} options.storageKey - localStorage key for the desktop collapsed preference.
 * @param {string} options.noScrollClass - body class toggled while the mobile drawer is open (e.g. "ia-no-scroll").
 * @param {string} options.navItemSelector - selector (scoped to root) for nav item buttons (e.g. ".ia-nav-item").
 * @param {string} options.ariaLabel - aria-label applied to the sidebar root.
 * @param {(route: string, item: HTMLElement) => void} options.onRouteSelect
 * @param {() => (void | Promise<void>)} options.onLogout
 * @param {string} [options.collapseBtnId]
 * @param {string} [options.mobileCloseBtnId]
 * @param {string} [options.logoutBtnId]
 * @param {string} [options.innerSelector]
 * @param {string} [options.logoutConfirmMessage]
 * @param {string} [options.mobileQuery]
 * @param {string} [options.activeClass]
 * @param {string} [options.routeDatasetKey]
 * @returns {{ init: () => void, destroy: () => void, open: (triggerEl?: HTMLElement) => void, close: () => void, toggle: (triggerEl?: HTMLElement) => void, isOpen: () => boolean, setActive: (route: string) => void, getActive: () => string|null }}
 */
export function createSidebar(options) {

    const state = {
        initialized: false,
        engine: null
    };

    function init() {

        if (state.initialized) destroy();

        state.engine = createSidebarEngine(options).init();

        state.initialized = true;

    }

    function destroy() {

        if (!state.initialized) return;

        state.engine?.destroy();

        state.initialized = false;
        state.engine = null;

    }

    function open(triggerEl) {

        state.engine?.open(triggerEl);

    }

    function close() {

        state.engine?.close();

    }

    function toggle(triggerEl) {

        state.engine?.toggle(triggerEl);

    }

    function isOpen() {

        return state.engine?.isOpen() ?? false;

    }

    function setActive(route) {

        state.engine?.setActive(route);

    }

    function getActive() {

        return state.engine?.getActive() ?? null;

    }

    return { init, destroy, open, close, toggle, isOpen, setActive, getActive };

}
