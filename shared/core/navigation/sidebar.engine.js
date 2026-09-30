/**
 * ==========================================================
 * CampusOne
 * Reusable Sidebar Engine
 * ----------------------------------------------------------
 * The generic sidebar state machine — collapse/expand, mobile
 * drawer, keyboard navigation, focus trap, active-item
 * reflection, tooltips-on-collapse (via CSS + aria, no JS
 * needed there), a11y attributes, and responsive breakpoint
 * handling — factored out of Institution Admin's
 * sidebar.controller.js (itself a 1:1 copy of Super Admin's)
 * so every role's Sidebar can create its own instance instead
 * of copy-pasting ~750 lines of plumbing.
 *
 * This follows the exact same split shared/core/navigation/
 * bottom-nav.engine.js already established:
 *
 *   - This engine owns the generic 80%: DOM wiring, state,
 *     events, focus, persistence.
 *   - It has NO opinion on routing (route clicks are reported
 *     via onRouteSelect(route, item) and the CALLER decides
 *     what "navigate" means) and NO opinion on what logout
 *     does (reported via onLogout(), fully owned by the caller
 *     — session clearing, router teardown, and where to
 *     navigate afterwards are all role-specific glue).
 *
 * In practice, every role now goes through
 * shared/components/sidebar/sidebar.controller.js's
 * createSidebar() factory instead of calling this engine
 * directly — see that file.
 *
 * Usage:
 *
 *   const engine = createSidebarEngine({
 *       rootId: "iaSidebar",
 *       overlayId: "iaSidebarOverlay",
 *       storageKey: "campusone-ia-sidebar-collapsed",
 *       noScrollClass: "ia-no-scroll",
 *       navItemSelector: ".ia-nav-item",
 *       overlayClass: "ia-sidebar-overlay",
 *       ariaLabel: "Institution Admin navigation",
 *       onRouteSelect: (route) => navigateToModule(route),
 *       onLogout: async () => { ...clear session, navigate... }
 *   });
 *
 *   engine.init();
 *   engine.setActive("dashboard");
 *   engine.toggle(triggerEl);
 *   engine.destroy();
 * ==========================================================
 */

const DEFAULTS = {
    mobileQuery: "(max-width: 1024px)",
    activeClass: "active",
    routeDatasetKey: "route",
    collapseBtnId: "sidebarCollapseToggle",
    mobileCloseBtnId: "sidebarMobileClose",
    logoutBtnId: "logoutButton",
    innerSelector: null,
    overlayClass: null,
    focusableSelector:
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    logoutConfirmMessage: "Are you sure you want to logout?",
    ariaLabel: "navigation"
};

/**
 * @param {object} options
 * @param {string} options.rootId - id of this role's sidebar root element (e.g. "iaSidebar").
 * @param {string} options.overlayId - id to create/reuse for the mobile drawer scrim.
 * @param {string} options.overlayClass - className applied to the overlay element (role-namespaced CSS, e.g. "ia-sidebar-overlay").
 * @param {string} options.storageKey - localStorage key for the desktop collapsed preference.
 * @param {string} options.noScrollClass - body class toggled while the mobile drawer is open.
 * @param {string} options.navItemSelector - selector (scoped to root) for nav item buttons.
 * @param {string} [options.ariaLabel] - aria-label applied to the sidebar root.
 * @param {string} [options.mobileQuery]
 * @param {string} [options.activeClass]
 * @param {string} [options.routeDatasetKey] - dataset key nav items store their route id under.
 * @param {string} [options.collapseBtnId]
 * @param {string} [options.mobileCloseBtnId]
 * @param {string} [options.logoutBtnId]
 * @param {string} [options.innerSelector] - optional inner-content selector to cache (parity only).
 * @param {string} [options.focusableSelector]
 * @param {string} [options.logoutConfirmMessage]
 * @param {(route: string, item: HTMLElement) => void} options.onRouteSelect
 * @param {() => (void | Promise<void>)} options.onLogout - fully owns session clear / router teardown / redirect.
 */
export function createSidebarEngine(options) {

    const config = { ...DEFAULTS, ...options };

    if (!config.rootId) {
        throw new Error("[SidebarEngine] `rootId` is required.");
    }

    if (!config.overlayId) {
        throw new Error("[SidebarEngine] `overlayId` is required.");
    }

    if (!config.storageKey) {
        throw new Error("[SidebarEngine] `storageKey` is required.");
    }

    if (!config.noScrollClass) {
        throw new Error("[SidebarEngine] `noScrollClass` is required.");
    }

    if (!config.navItemSelector) {
        throw new Error("[SidebarEngine] `navItemSelector` is required.");
    }

    if (!config.overlayClass) {
        throw new Error("[SidebarEngine] `overlayClass` is required.");
    }

    const state = {

        navItems: [],

        activeRoute: null,

        initialized: false,

        isOpen: true,

        isMobile: false,

        sidebarEl: null,
        innerEl: null,
        overlayEl: null,
        collapseBtn: null,
        mobileCloseBtn: null,
        logoutBtn: null,
        toggleTriggerEl: null,

        mediaQueryList: null,

        // bound handlers kept so destroy() can remove the
        // *exact* function references it added
        handlers: {}

    };

    /* ==========================================================
       Initialize
    ========================================================== */

    function init() {

        // Defense-in-depth: if init() is ever called again while
        // already initialized (e.g. shell gets remounted without
        // an explicit logout in between), tear down the stale
        // state and bind fresh listeners to the new DOM instead
        // of no-op'ing and leaving the visible sidebar with zero
        // working buttons.
        if (state.initialized) {

            destroy();

        }

        cacheDOM();

        if (!state.sidebarEl) {

            console.error(`[CampusOne] Sidebar root (#${config.rootId}) not found.`);

            return api;

        }

        state.mediaQueryList = window.matchMedia(config.mobileQuery);
        state.isMobile = state.mediaQueryList.matches;

        state.sidebarEl.setAttribute("role", "navigation");
        state.sidebarEl.setAttribute("aria-label", config.ariaLabel);

        ensureOverlay();

        initNavigation();
        initLogout();
        initCollapseButton();
        initMobileClose();
        initOutsideClick();
        initEscKey();
        initBreakpointListener();

        // Establish a sane initial state per breakpoint without
        // running open/close side-effects (no scroll lock, no
        // focus stealing) on first paint.
        if (state.isMobile) {

            state.isOpen = false;

        } else {

            state.isOpen = !readStoredCollapsed();

        }

        applyState({ silent: true });

        state.initialized = true;

        return api;

    }

    /* ==========================================================
       Destroy
       ----------------------------------------------------------
       Resets state so it can be safely re-initialized if the
       owning shell is ever unmounted and remounted (e.g. logout,
       then logging back in). Without this, a second init() call
       would silently no-op and the freshly rendered nav buttons
       would have no listeners.
    ========================================================== */

    function destroy() {

        if (!state.initialized) return;

        state.navItems.forEach((item) => {

            item.removeEventListener("click", handleNavigation);

        });

        state.logoutBtn?.removeEventListener("click", handleLogout);

        state.collapseBtn?.removeEventListener("click", state.handlers.onCollapseClick);

        state.mobileCloseBtn?.removeEventListener("click", state.handlers.onMobileCloseClick);

        state.overlayEl?.removeEventListener("click", state.handlers.onOverlayClick);

        document.removeEventListener("click", state.handlers.onOutsideClick, true);

        document.removeEventListener("keydown", state.handlers.onKeydown);

        state.mediaQueryList?.removeEventListener?.("change", state.handlers.onBreakpointChange);

        // Safari < 14 fallback API
        state.mediaQueryList?.removeListener?.(state.handlers.onBreakpointChange);

        document.body.classList.remove(config.noScrollClass);

        state.overlayEl?.remove();

        state.sidebarEl?.removeAttribute("inert");
        state.sidebarEl?.classList.remove("is-open", "is-collapsed", "is-mobile-open");

        state.navItems = [];
        state.activeRoute = null;
        state.sidebarEl = null;
        state.innerEl = null;
        state.overlayEl = null;
        state.collapseBtn = null;
        state.mobileCloseBtn = null;
        state.logoutBtn = null;
        state.toggleTriggerEl = null;
        state.mediaQueryList = null;
        state.handlers = {};
        state.isOpen = true;
        state.isMobile = false;
        state.initialized = false;

    }

    /* ==========================================================
       Public Toggle API
    ========================================================== */

    function open(triggerEl) {

        if (state.isOpen) return;

        if (triggerEl) state.toggleTriggerEl = triggerEl;

        state.isOpen = true;

        applyState();

    }

    function close() {

        if (!state.isOpen) return;

        state.isOpen = false;

        applyState();

    }

    function toggle(triggerEl) {

        if (triggerEl) state.toggleTriggerEl = triggerEl;

        state.isOpen ? close() : open(triggerEl);

    }

    function isOpen() {

        return state.isOpen;

    }

    /* ==========================================================
       Apply State to DOM
       ----------------------------------------------------------
       Single place that touches sidebar-related DOM/classes.
    ========================================================== */

    function applyState({ silent = false } = {}) {

        const { sidebarEl, overlayEl, isOpen: open, isMobile } = state;

        if (!sidebarEl) return;

        if (isMobile) {

            sidebarEl.classList.toggle("is-mobile-open", open);
            sidebarEl.classList.remove("is-collapsed");
            sidebarEl.setAttribute("aria-hidden", open ? "false" : "true");
            sidebarEl.inert = !open;

            overlayEl?.classList.toggle("is-visible", open);
            document.body.classList.toggle(config.noScrollClass, open);

            if (open && !silent) {

                focusFirstItem();

            } else if (!open && !silent) {

                returnFocusToTrigger();

            }

        } else {

            sidebarEl.classList.remove("is-mobile-open");
            sidebarEl.setAttribute("aria-hidden", "false");
            sidebarEl.inert = false;
            document.body.classList.remove(config.noScrollClass);
            overlayEl?.classList.remove("is-visible");

            sidebarEl.classList.toggle("is-collapsed", !open);

            persistCollapsed(!open);

        }

        syncCollapseButton();

        if (!silent) {

            window.dispatchEvent(new CustomEvent("sidebar:statechange", {

                detail: {
                    isOpen: state.isOpen,
                    isMobile: state.isMobile
                }

            }));

        }

    }

    /* ==========================================================
       Cache DOM
    ========================================================== */

    function cacheDOM() {

        state.sidebarEl = document.getElementById(config.rootId);

        state.innerEl = config.innerSelector
            ? state.sidebarEl?.querySelector(config.innerSelector) || null
            : null;

        state.navItems = [

            ...(state.sidebarEl?.querySelectorAll(config.navItemSelector) || [])

        ];

        state.collapseBtn = document.getElementById(config.collapseBtnId);
        state.mobileCloseBtn = document.getElementById(config.mobileCloseBtnId);
        state.logoutBtn = document.getElementById(config.logoutBtnId);

        // NOTE: the Topbar's toggle button hasn't necessarily
        // been rendered yet at this point (shells render Sidebar
        // before Topbar), so it can't be cached here. Not an
        // issue in practice — open()/toggle() are always called
        // WITH the real trigger element by whoever invokes them
        // (Topbar button, collapse button), so toggleTriggerEl is
        // captured correctly at call time.
        state.toggleTriggerEl = null;

    }

    /* ==========================================================
       Overlay (mobile drawer scrim)
    ========================================================== */

    function ensureOverlay() {

        let overlay = document.getElementById(config.overlayId);

        if (!overlay) {

            overlay = document.createElement("div");
            overlay.id = config.overlayId;
            overlay.className = config.overlayClass;
            overlay.setAttribute("aria-hidden", "true");
            document.body.appendChild(overlay);

        }

        state.overlayEl = overlay;

        state.handlers.onOverlayClick = () => close();

        overlay.addEventListener("click", state.handlers.onOverlayClick);

    }

    /* ==========================================================
       Navigation
    ========================================================== */

    function initNavigation() {

        state.navItems.forEach((item) => {

            item.addEventListener("click", handleNavigation);

        });

    }

    function handleNavigation(event) {

        const item = event.currentTarget;

        const route = item.dataset[config.routeDatasetKey];

        config.onRouteSelect?.(route, item);

        // On mobile the drawer is modal-like — picking a
        // destination should close it so the workspace is visible.
        if (state.isMobile) {

            close();

        }

    }

    /* ==========================================================
       Sync Active Nav Item
       ----------------------------------------------------------
       Called by the owning shell whenever its router reports a
       module change — sidebar click, hashchange (browser
       back/forward), or a direct navigate call from anywhere
       else. The router is the single source of truth for "what's
       active"; the sidebar only reflects it.
    ========================================================== */

    function setActive(route) {

        state.activeRoute = route;

        const activeItem = state.navItems.find(

            (item) => item.dataset[config.routeDatasetKey] === route

        );

        if (!activeItem) return;

        setActiveItem(activeItem);

    }

    function getActive() {

        return state.activeRoute;

    }

    function setActiveItem(activeItem) {

        state.navItems.forEach((item) => {

            item.classList.remove(config.activeClass);

            item.setAttribute("aria-current", "false");

        });

        activeItem.classList.add(config.activeClass);

        activeItem.setAttribute("aria-current", "page");

    }

    /* ==========================================================
       Mobile Full-Screen Close Button
       ----------------------------------------------------------
       The full-screen page (mobile redesign) has no "outside" to
       tap to dismiss, so it needs its own explicit close
       control. Goes through the exact same close() as ESC /
       overlay / nav-item-pick — one state owner, four ways to
       trigger it.
    ========================================================== */

    function initMobileClose() {

        const button = state.mobileCloseBtn;

        if (!button) return;

        state.handlers.onMobileCloseClick = () => close();

        button.addEventListener("click", state.handlers.onMobileCloseClick);

    }

    /* ==========================================================
       Desktop Collapse Button
    ========================================================== */

    function initCollapseButton() {

        const button = state.collapseBtn;

        if (!button) return;

        state.handlers.onCollapseClick = () => toggle(button);

        button.addEventListener("click", state.handlers.onCollapseClick);

    }

    function syncCollapseButton() {

        const button = state.collapseBtn;

        if (!button) return;

        if (state.isMobile) {

            // Collapse rail doesn't apply on mobile — the same
            // button area is hidden entirely via CSS there.
            button.setAttribute("aria-expanded", "true");
            return;

        }

        button.setAttribute("aria-expanded", String(state.isOpen));

        button.setAttribute(

            "aria-label",

            state.isOpen ? "Collapse sidebar" : "Expand sidebar"

        );

    }

    /* ==========================================================
       Outside Click (mobile drawer)
    ========================================================== */

    function initOutsideClick() {

        state.handlers.onOutsideClick = (event) => {

            if (!state.isMobile || !state.isOpen) return;

            const target = event.target;

            if (state.sidebarEl?.contains(target)) return;

            if (state.toggleTriggerEl?.contains?.(target)) return;

            close();

        };

        // Capture phase so this still works even if a page module
        // stops propagation on its own click handlers.
        document.addEventListener("click", state.handlers.onOutsideClick, true);

    }

    /* ==========================================================
       ESC Key (mobile drawer)
    ========================================================== */

    function initEscKey() {

        state.handlers.onKeydown = (event) => {

            if (event.key === "Escape" && state.isMobile && state.isOpen) {

                close();

                return;

            }

            if (event.key === "Tab" && state.isMobile && state.isOpen) {

                trapFocus(event);

            }

        };

        document.addEventListener("keydown", state.handlers.onKeydown);

    }

    /* ==========================================================
       Focus Management
    ========================================================== */

    function getFocusableElements() {

        if (!state.sidebarEl) return [];

        return [...state.sidebarEl.querySelectorAll(config.focusableSelector)]
            .filter((el) => el.offsetParent !== null);

    }

    function focusFirstItem() {

        const focusable = getFocusableElements();

        (focusable[0] || state.sidebarEl)?.focus?.();

    }

    function returnFocusToTrigger() {

        const trigger = state.toggleTriggerEl;

        if (trigger && typeof trigger.focus === "function") {

            trigger.focus();

        }

    }

    function trapFocus(event) {

        const focusable = getFocusableElements();

        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;

        if (event.shiftKey && active === first) {

            event.preventDefault();
            last.focus();

        } else if (!event.shiftKey && active === last) {

            event.preventDefault();
            first.focus();

        }

    }

    /* ==========================================================
       Breakpoint Handling
       ----------------------------------------------------------
       Crossing the mobile/desktop boundary changes what "open"
       means, so state is reset to a safe default in each
       direction rather than carried over stale.
    ========================================================== */

    function initBreakpointListener() {

        state.handlers.onBreakpointChange = (event) => {

            state.isMobile = event.matches;

            if (state.isMobile) {

                // Entering mobile: never surface a full-screen
                // drawer the user didn't just ask for.
                state.isOpen = false;

            } else {

                // Leaving mobile: restore desktop's collapsed
                // preference instead of forcing expanded.
                state.isOpen = !readStoredCollapsed();

            }

            applyState({ silent: true });

        };

        if (state.mediaQueryList.addEventListener) {

            state.mediaQueryList.addEventListener("change", state.handlers.onBreakpointChange);

        } else {

            // Safari < 14
            state.mediaQueryList.addListener(state.handlers.onBreakpointChange);

        }

    }

    /* ==========================================================
       Collapse Preference Persistence (desktop only)
    ========================================================== */

    function persistCollapsed(collapsed) {

        try {

            localStorage.setItem(config.storageKey, collapsed ? "1" : "0");

        } catch (error) {

            // Storage unavailable (private mode, quota, etc.) —
            // collapse still works for this session, it just
            // won't be remembered next visit.

        }

    }

    function readStoredCollapsed() {

        try {

            return localStorage.getItem(config.storageKey) === "1";

        } catch (error) {

            return false;

        }

    }

    /* ==========================================================
       Logout
    ========================================================== */

    function initLogout() {

        const logoutButton = state.logoutBtn;

        if (!logoutButton) return;

        logoutButton.addEventListener("click", handleLogout);

    }

    async function handleLogout() {

        const confirmed = confirm(config.logoutConfirmMessage);

        if (!confirmed) return;

        await config.onLogout?.();

    }

    const api = { init, destroy, open, close, toggle, isOpen, setActive, getActive };

    return api;

}
