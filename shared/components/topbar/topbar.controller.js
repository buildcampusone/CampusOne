/**
 * ==========================================================
 * CampusOne
 * Shared Topbar — Controller Factory
 * ----------------------------------------------------------
 * The ONE piece of interaction chrome every role's Topbar is
 * built from. A role's own topbar.controller.js (see
 * modules/institution-admin/topbar/ and, going forward, any
 * other role) is now a thin wrapper: call createTopbar() with
 * that role's sidebar-toggle id/callbacks, register whatever
 * panels that role actually has (notification/profile/etc.),
 * and keep all content-specific wiring (notification list,
 * profile menu items, logout) in its own file — exactly the
 * same "component wraps engine" convention
 * shared/components/sidebar/sidebar.controller.js already
 * established for Sidebar.
 *
 * What lives here (shared, never duplicated):
 *   - Wiring to the reusable state-machine engine
 *     (shared/core/navigation/topbar-panel.engine.js):
 *     sidebar-toggle sync, dropdown-panel open/close/outside-
 *     click/ESC/one-open-at-a-time, aria-expanded sync.
 *
 * What deliberately stays OUT of this file (role-specific glue,
 * owned by each role's own thin controller):
 *   - What "toggle sidebar" does (each role's own
 *     sidebar.controller.js, passed in as callbacks).
 *   - Notification content, profile menu items, logout — none
 *     of that is panel-engine concern. Each role registers its
 *     own panel wrap/button/panel elements and wires its own
 *     content buttons directly, the same way Institution Admin's
 *     topbar.controller.js already does.
 *   - DOM ids — all passed in as config, never hardcoded here.
 * ==========================================================
 */

import { createTopbarPanelEngine } from "../../core/navigation/index.js";

/**
 * @param {object} options
 * @param {string} options.sidebarToggleId - id of this role's sidebar-toggle button (e.g. "sidebarToggle").
 * @param {(triggerEl: HTMLElement) => void} options.onToggleSidebar
 * @param {() => boolean} options.getSidebarOpen
 * @param {string} [options.sidebarStateChangeEvent]
 * @returns {{
 *   init: () => void,
 *   destroy: () => void,
 *   registerPanel: (name: string, els: { wrap: HTMLElement, button: HTMLElement, panel: HTMLElement }) => void,
 *   openPanel: (name: string) => void,
 *   closePanel: (name: string) => void,
 *   togglePanel: (name: string) => void,
 *   closeActivePanel: (focusTrigger?: boolean) => void,
 *   getActivePanel: () => string|null
 * }}
 */
export function createTopbar(options) {

    const state = {
        initialized: false,
        engine: null
    };

    function init() {

        if (state.initialized) destroy();

        state.engine = createTopbarPanelEngine(options).init();

        state.initialized = true;

    }

    function destroy() {

        if (!state.initialized) return;

        state.engine?.destroy();

        state.initialized = false;
        state.engine = null;

    }

    function registerPanel(name, els) {

        state.engine?.registerPanel(name, els);

    }

    function openPanel(name) {

        state.engine?.openPanel(name);

    }

    function closePanel(name) {

        state.engine?.closePanel(name);

    }

    function togglePanel(name) {

        state.engine?.togglePanel(name);

    }

    function closeActivePanel(focusTrigger = false) {

        state.engine?.closeActivePanel(focusTrigger);

    }

    function getActivePanel() {

        return state.engine?.getActivePanel() ?? null;

    }

    return {
        init,
        destroy,
        registerPanel,
        openPanel,
        closePanel,
        togglePanel,
        closeActivePanel,
        getActivePanel
    };

}
