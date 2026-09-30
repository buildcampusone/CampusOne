/**
 * ==========================================================
 * CampusOne
 * Reusable Topbar Panel Engine
 * ----------------------------------------------------------
 * The generic Topbar interaction chrome — sidebar-toggle
 * button sync and the dropdown-panel state machine (register /
 * open / close / toggle / outside-click / ESC / one-open-at-a-
 * time / aria-expanded sync) — factored out of Institution
 * Admin's topbar.controller.js (itself a ~1:1 copy of Super
 * Admin's) so every role's Topbar can create its own instance
 * instead of copy-pasting this plumbing.
 *
 * Follows the same split shared/core/navigation/sidebar.engine.js
 * and bottom-nav.engine.js already established:
 *
 *   - This engine owns the generic, content-blind part: DOM
 *     wiring, panel open/close state, outside-click/ESC,
 *     aria-expanded sync.
 *   - It has NO opinion on what's inside a panel. It never
 *     reads or writes notification list markup, profile menu
 *     items, or any other content-specific ids
 *     (myProfileBtn/logoutBtn/etc. stay owned by the caller,
 *     registered as their own click listeners outside this
 *     engine — see audit Section 6 on not baking role/content
 *     ids into "generic" cleanup).
 *   - It has NO opinion on what "toggle sidebar" means —
 *     reported via the caller-supplied onToggleSidebar/
 *     getSidebarOpen callbacks, exactly the way
 *     sidebar.engine.js keeps onRouteSelect/onLogout as
 *     caller-owned glue.
 *
 * In practice, every role should go through
 * shared/components/topbar/topbar.controller.js's createTopbar()
 * factory instead of calling this engine directly — see that
 * file.
 *
 * Usage:
 *
 *   const engine = createTopbarPanelEngine({
 *       sidebarToggleId: "sidebarToggle",
 *       sidebarAriaControls: "iaSidebar",
 *       onToggleSidebar: (triggerEl) => toggleSidebar(triggerEl),
 *       getSidebarOpen: () => isSidebarOpen()
 *   });
 *
 *   engine.init();
 *   engine.registerPanel("notification", { wrap, button, panel });
 *   engine.registerPanel("profile", { wrap, button, panel });
 *   engine.togglePanel("profile");
 *   engine.destroy();
 * ==========================================================
 */

const DEFAULTS = {
    sidebarStateChangeEvent: "sidebar:statechange"
};

/**
 * @param {object} options
 * @param {string} options.sidebarToggleId - id of this role's sidebar-toggle button (e.g. "sidebarToggle").
 * @param {(triggerEl: HTMLElement) => void} options.onToggleSidebar - fully owns what "toggle" means (each role's own sidebar.controller.js).
 * @param {() => boolean} options.getSidebarOpen - reads the real current sidebar state on init (each role's own isSidebarOpen()).
 * @param {string} [options.sidebarStateChangeEvent]
 * @returns {{
 *   init: () => object,
 *   destroy: () => void,
 *   registerPanel: (name: string, els: { wrap: HTMLElement, button: HTMLElement, panel: HTMLElement }) => void,
 *   openPanel: (name: string) => void,
 *   closePanel: (name: string) => void,
 *   togglePanel: (name: string) => void,
 *   closeActivePanel: (focusTrigger?: boolean) => void,
 *   getActivePanel: () => string|null
 * }}
 */
export function createTopbarPanelEngine(options) {

    const config = { ...DEFAULTS, ...options };

    if (!config.sidebarToggleId) {

        throw new Error("[TopbarPanelEngine] `sidebarToggleId` is required.");

    }

    const state = {

        initialized: false,

        sidebarToggleBtn: null,

        // Single source of truth for "which dropdown is open".
        // Only one panel name (or null) at a time.
        activePanel: null,

        panels: {},

        handlers: {}

    };

    /* ==========================================================
       Initialize
    ========================================================== */

    function init() {

        if (state.initialized) {

            destroy();

        }

        initSidebarToggle();

        initOutsideClick();

        initEscKey();

        state.initialized = true;

        return api;

    }

    /* ==========================================================
       Destroy
       ----------------------------------------------------------
       Only tears down what THIS engine wired: the sidebar-toggle
       button, its own document-level outside-click/ESC listeners,
       and the toggle-button listener on each registered panel.
       Any extra buttons a caller wired directly to panel content
       (e.g. a "My Profile" or "Logout" item) are NOT this
       engine's concern and must be cleaned up by the caller.
    ========================================================== */

    function destroy() {

        if (!state.initialized) return;

        if (state.sidebarToggleBtn && state.handlers.onSidebarToggleClick) {

            state.sidebarToggleBtn.removeEventListener(
                "click",
                state.handlers.onSidebarToggleClick
            );

        }

        if (state.handlers.onSidebarStateChange) {

            window.removeEventListener(
                config.sidebarStateChangeEvent,
                state.handlers.onSidebarStateChange
            );

        }

        if (state.handlers.onDocumentClick) {

            document.removeEventListener(
                "click",
                state.handlers.onDocumentClick,
                true
            );

        }

        if (state.handlers.onKeydown) {

            document.removeEventListener(
                "keydown",
                state.handlers.onKeydown
            );

        }

        Object.values(state.panels).forEach((panel) => {

            if (panel.button && panel.handlers.onButtonClick) {

                panel.button.removeEventListener(
                    "click",
                    panel.handlers.onButtonClick
                );

            }

        });

        state.sidebarToggleBtn = null;
        state.activePanel = null;
        state.panels = {};
        state.handlers = {};
        state.initialized = false;

    }

    /* ==========================================================
       Sidebar Toggle
       ----------------------------------------------------------
       This button only ever *requests* a toggle via the
       caller-supplied callback. It never reads or writes sidebar
       classes/attributes itself — same ownership rule the
       original per-role controllers already followed.
    ========================================================== */

    function initSidebarToggle() {

        const button = document.getElementById(config.sidebarToggleId);

        if (!button) return;

        state.sidebarToggleBtn = button;

        if (typeof config.getSidebarOpen === "function") {

            button.setAttribute("aria-expanded", String(config.getSidebarOpen()));

        }

        state.handlers.onSidebarToggleClick = () => {

            config.onToggleSidebar?.(button);

        };

        button.addEventListener("click", state.handlers.onSidebarToggleClick);

        state.handlers.onSidebarStateChange = (event) => {

            button.setAttribute("aria-expanded", String(event.detail.isOpen));

        };

        window.addEventListener(
            config.sidebarStateChangeEvent,
            state.handlers.onSidebarStateChange
        );

    }

    /* ==========================================================
       Panel Registration
    ========================================================== */

    function registerPanel(name, { wrap, button, panel }) {

        if (!wrap || !button || !panel) return;

        state.panels[name] = {

            wrap,

            button,

            panel,

            handlers: {}

        };

        state.panels[name].handlers.onButtonClick = () => togglePanel(name);

        button.addEventListener("click", state.panels[name].handlers.onButtonClick);

    }

    /* ==========================================================
       Panel Open / Close / Toggle
       ----------------------------------------------------------
       "Only one dropdown open at a time" — enforced here, in
       exactly one place, the same rule Institution Admin and
       Super Admin's original per-file panel engines each
       enforced independently.
    ========================================================== */

    function openPanel(name) {

        const target = state.panels[name];

        if (!target) return;

        if (state.activePanel && state.activePanel !== name) {

            closePanel(state.activePanel);

        }

        target.panel.hidden = false;

        target.wrap.classList.add("is-open");

        target.button.setAttribute("aria-expanded", "true");

        state.activePanel = name;

    }

    function closePanel(name) {

        const target = state.panels[name];

        if (!target) return;

        target.panel.hidden = true;

        target.wrap.classList.remove("is-open");

        target.button.setAttribute("aria-expanded", "false");

        if (state.activePanel === name) {

            state.activePanel = null;

        }

    }

    function togglePanel(name) {

        if (state.activePanel === name) {

            closePanel(name);

        } else {

            openPanel(name);

        }

    }

    function closeActivePanel(focusTrigger = false) {

        if (!state.activePanel) return;

        const name = state.activePanel;

        const target = state.panels[name];

        closePanel(name);

        if (focusTrigger && target?.button) {

            target.button.focus();

        }

    }

    function getActivePanel() {

        return state.activePanel;

    }

    /* ==========================================================
       Outside Click (capture phase — still works even if a page
       module stops propagation on its own click handlers)
    ========================================================== */

    function initOutsideClick() {

        state.handlers.onDocumentClick = (event) => {

            if (!state.activePanel) return;

            const active = state.panels[state.activePanel];

            if (active && !active.wrap.contains(event.target)) {

                closePanel(state.activePanel);

            }

        };

        document.addEventListener(
            "click",
            state.handlers.onDocumentClick,
            true
        );

    }

    /* ==========================================================
       ESC Key
    ========================================================== */

    function initEscKey() {

        state.handlers.onKeydown = (event) => {

            if (event.key === "Escape") {

                closeActivePanel(true);

            }

        };

        document.addEventListener("keydown", state.handlers.onKeydown);

    }

    const api = {
        init,
        destroy,
        registerPanel,
        openPanel,
        closePanel,
        togglePanel,
        closeActivePanel,
        getActivePanel
    };

    return api;

}
