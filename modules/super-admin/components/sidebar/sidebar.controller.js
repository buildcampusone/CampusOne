/**
 * ==========================================================
 * CampusOne
 * Super Admin Sidebar Controller
 * ----------------------------------------------------------
 * Owns ALL sidebar state and DOM. Topbar (and anything else)
 * only ever calls toggleSidebar() / openSidebar() /
 * closeSidebar() / isSidebarOpen() — it never reaches into
 * sidebar DOM directly.
 *
 * One boolean — sidebarState.isOpen — represents "expanded":
 *   Desktop (>1024px): isOpen=true  -> full-width rail
 *                       isOpen=false -> collapsed icon rail
 *   Mobile  (<=1024px): isOpen=true  -> drawer visible
 *                        isOpen=false -> drawer hidden
 * Same API, same source of truth, breakpoint-appropriate
 * rendering. State changes are broadcast on window as
 * "sidebar:statechange" so other modules (topbar) can react
 * without owning or touching sidebar DOM themselves.
 * ==========================================================
 */

import {
    navigateToModule,
    destroySuperAdminRouter
} from "../../router/router.super.js";

import {
    navigate
} from "../../../../router/router.js";

import {
    clearSuperAdminSession
} from "../../../../shared/services/session.service.js";

/* ==========================================================
   Constants
========================================================== */

const MOBILE_QUERY = "(max-width: 1024px)";
const COLLAPSE_STORAGE_KEY = "campusone-sidebar-collapsed";
const FOCUSABLE_SELECTOR =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/* ==========================================================
   Sidebar State
========================================================== */

const sidebarState = {

    navItems: [],

    activeRoute: "home",

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

    // bound handlers kept so destroySidebar() can remove
    // the *exact* function references it added
    handlers: {}

};

/* ==========================================================
   Initialize Sidebar
========================================================== */

export function initSidebar() {

    // Defense-in-depth: if initSidebar() is ever called again
    // while already initialized (e.g. shell gets remounted
    // without an explicit logout in between — see the
    // navigate("super-admin") double-call bug this guarded
    // against silently), tear down the stale state and bind
    // fresh listeners to the new DOM instead of no-op'ing and
    // leaving the visible sidebar with zero working buttons.
    if (sidebarState.initialized) {

        destroySidebar();

    }

    cacheDOM();

    if (!sidebarState.sidebarEl) {

        console.error("[CampusOne] Sidebar root (#saSidebar) not found.");

        return;

    }

    sidebarState.mediaQueryList = window.matchMedia(MOBILE_QUERY);
    sidebarState.isMobile = sidebarState.mediaQueryList.matches;

    sidebarState.sidebarEl.setAttribute("role", "navigation");
    sidebarState.sidebarEl.setAttribute("aria-label", "Super Admin navigation");

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
    if (sidebarState.isMobile) {

        sidebarState.isOpen = false;

    } else {

        sidebarState.isOpen = !readStoredCollapsed();

    }

    applyState({ silent: true });

    sidebarState.initialized = true;

}

/* ==========================================================
   Destroy Sidebar
   ----------------------------------------------------------
   Resets sidebar state so it can be safely re-initialized if
   the Super Admin shell is ever unmounted and remounted
   (e.g. logout, then logging back in). Without this, a
   second initSidebar() call would silently no-op and the
   freshly rendered nav buttons would have no listeners.
========================================================== */

export function destroySidebar() {

    if (!sidebarState.initialized) return;

    sidebarState.navItems.forEach((item) => {

        item.removeEventListener("click", handleNavigation);

    });

    sidebarState.logoutBtn?.removeEventListener("click", handleLogout);

    sidebarState.collapseBtn?.removeEventListener("click", handlers().onCollapseClick);

    sidebarState.mobileCloseBtn?.removeEventListener("click", handlers().onMobileCloseClick);

    sidebarState.overlayEl?.removeEventListener("click", handlers().onOverlayClick);

    document.removeEventListener("click", handlers().onOutsideClick, true);

    document.removeEventListener("keydown", handlers().onKeydown);

    sidebarState.mediaQueryList?.removeEventListener?.(
        "change",
        handlers().onBreakpointChange
    );

    // Safari < 14 fallback API
    sidebarState.mediaQueryList?.removeListener?.(handlers().onBreakpointChange);

    document.body.classList.remove("sa-no-scroll");

    sidebarState.overlayEl?.remove();

    sidebarState.sidebarEl?.removeAttribute("inert");
    sidebarState.sidebarEl?.classList.remove("is-open", "is-collapsed", "is-mobile-open");

    sidebarState.navItems = [];
    sidebarState.activeRoute = "home";
    sidebarState.sidebarEl = null;
    sidebarState.innerEl = null;
    sidebarState.overlayEl = null;
    sidebarState.collapseBtn = null;
    sidebarState.mobileCloseBtn = null;
    sidebarState.logoutBtn = null;
    sidebarState.toggleTriggerEl = null;
    sidebarState.mediaQueryList = null;
    sidebarState.handlers = {};
    sidebarState.isOpen = true;
    sidebarState.isMobile = false;
    sidebarState.initialized = false;

}

/* ==========================================================
   Public Toggle API
========================================================== */

export function openSidebar(triggerEl) {

    if (sidebarState.isOpen) return;

    if (triggerEl) sidebarState.toggleTriggerEl = triggerEl;

    sidebarState.isOpen = true;

    applyState();

}

export function closeSidebar() {

    if (!sidebarState.isOpen) return;

    sidebarState.isOpen = false;

    applyState();

}

export function toggleSidebar(triggerEl) {

    if (triggerEl) sidebarState.toggleTriggerEl = triggerEl;

    sidebarState.isOpen ? closeSidebar() : openSidebar(triggerEl);

}

export function isSidebarOpen() {

    return sidebarState.isOpen;

}

/* ==========================================================
   Apply State to DOM
   ----------------------------------------------------------
   Single place that touches sidebar-related DOM/classes.
========================================================== */

function applyState({ silent = false } = {}) {

    const { sidebarEl, overlayEl, isOpen, isMobile } = sidebarState;

    if (!sidebarEl) return;

    if (isMobile) {

        sidebarEl.classList.toggle("is-mobile-open", isOpen);
        sidebarEl.classList.remove("is-collapsed");
        sidebarEl.setAttribute("aria-hidden", isOpen ? "false" : "true");
        sidebarEl.inert = !isOpen;

        overlayEl?.classList.toggle("is-visible", isOpen);
        document.body.classList.toggle("sa-no-scroll", isOpen);

        if (isOpen && !silent) {

            focusFirstItem();

        } else if (!isOpen && !silent) {

            returnFocusToTrigger();

        }

    } else {

        sidebarEl.classList.remove("is-mobile-open");
        sidebarEl.setAttribute("aria-hidden", "false");
        sidebarEl.inert = false;
        document.body.classList.remove("sa-no-scroll");
        overlayEl?.classList.remove("is-visible");

        sidebarEl.classList.toggle("is-collapsed", !isOpen);

        persistCollapsed(!isOpen);

    }

    syncCollapseButton();

    if (!silent) {

        window.dispatchEvent(new CustomEvent("sidebar:statechange", {

            detail: {
                isOpen: sidebarState.isOpen,
                isMobile: sidebarState.isMobile
            }

        }));

    }

}

/* ==========================================================
   Cache DOM
========================================================== */

function cacheDOM() {

    sidebarState.sidebarEl = document.getElementById("saSidebar");
    sidebarState.innerEl = sidebarState.sidebarEl?.querySelector(".sa-sidebar-inner") || null;

    sidebarState.navItems = [

        ...(sidebarState.sidebarEl?.querySelectorAll(".sa-nav-item") || [])

    ];

    sidebarState.collapseBtn = document.getElementById("sidebarCollapseToggle");
    sidebarState.mobileCloseBtn = document.getElementById("sidebarMobileClose");
    sidebarState.logoutBtn = document.getElementById("logoutButton");

    // NOTE: the Topbar's #sidebarToggle button hasn't been
    // rendered yet at this point (shell.controller.js renders
    // Sidebar before Topbar), so it can't be cached here. Not
    // an issue in practice — openSidebar()/toggleSidebar() are
    // always called WITH the real trigger element by whoever
    // invokes them (Topbar button, collapse button), so
    // toggleTriggerEl is captured correctly at call time.
    sidebarState.toggleTriggerEl = null;

}

function handlers() {

    return sidebarState.handlers;

}

/* ==========================================================
   Overlay (mobile drawer scrim)
========================================================== */

function ensureOverlay() {

    let overlay = document.getElementById("saSidebarOverlay");

    if (!overlay) {

        overlay = document.createElement("div");
        overlay.id = "saSidebarOverlay";
        overlay.className = "sa-sidebar-overlay";
        overlay.setAttribute("aria-hidden", "true");
        document.body.appendChild(overlay);

    }

    sidebarState.overlayEl = overlay;

    sidebarState.handlers.onOverlayClick = () => closeSidebar();

    overlay.addEventListener("click", sidebarState.handlers.onOverlayClick);

}

/* ==========================================================
   Navigation
========================================================== */

function initNavigation() {

    sidebarState.navItems.forEach((item) => {

        item.addEventListener("click", handleNavigation);

    });

}

function handleNavigation(event) {

    const item = event.currentTarget;

    const route = item.dataset.route;

    navigateToModule(route);

    // On mobile the drawer is modal-like — picking a
    // destination should close it so the workspace is visible.
    if (sidebarState.isMobile) {

        closeSidebar();

    }

}

/* ==========================================================
   Sync Active Nav Item
   ----------------------------------------------------------
   Called by the shell controller whenever router.super.js
   reports a module change — sidebar click, hashchange
   (browser back/forward), or a direct navigateToModule()
   call from anywhere else. The router is the single source
   of truth for "what's active"; the sidebar only reflects it.
========================================================== */

export function setActiveModule(route) {

    sidebarState.activeRoute = route;

    const activeItem = sidebarState.navItems.find(

        (item) => item.dataset.route === route

    );

    if (!activeItem) return;

    setActiveItem(activeItem);

}

/* ==========================================================
   Active Navigation
========================================================== */

function setActiveItem(activeItem) {

    sidebarState.navItems.forEach((item) => {

        item.classList.remove("active");

        item.setAttribute("aria-current", "false");

    });

    activeItem.classList.add("active");

    activeItem.setAttribute("aria-current", "page");

}

/* ==========================================================
   Mobile Full-Screen Close Button
   ----------------------------------------------------------
   The full-screen page (Phase 2B.1 mobile redesign) has no
   "outside" to tap to dismiss, so it needs its own explicit
   close control. Goes through the exact same closeSidebar()
   as ESC / overlay / nav-item-pick — one state owner, four
   ways to trigger it.
========================================================== */

function initMobileClose() {

    const button = sidebarState.mobileCloseBtn;

    if (!button) return;

    sidebarState.handlers.onMobileCloseClick = () => closeSidebar();

    button.addEventListener("click", sidebarState.handlers.onMobileCloseClick);

}

/* ==========================================================
   Desktop Collapse Button
========================================================== */

function initCollapseButton() {

    const button = sidebarState.collapseBtn;

    if (!button) return;

    sidebarState.handlers.onCollapseClick = () => toggleSidebar(button);

    button.addEventListener("click", sidebarState.handlers.onCollapseClick);

}

function syncCollapseButton() {

    const button = sidebarState.collapseBtn;

    if (!button) return;

    if (sidebarState.isMobile) {

        // Collapse rail doesn't apply on mobile — the same
        // button area is hidden entirely via CSS there.
        button.setAttribute("aria-expanded", "true");
        return;

    }

    button.setAttribute("aria-expanded", String(sidebarState.isOpen));

    button.setAttribute(

        "aria-label",

        sidebarState.isOpen ? "Collapse sidebar" : "Expand sidebar"

    );

}

/* ==========================================================
   Outside Click (mobile drawer)
========================================================== */

function initOutsideClick() {

    sidebarState.handlers.onOutsideClick = (event) => {

        if (!sidebarState.isMobile || !sidebarState.isOpen) return;

        const target = event.target;

        if (sidebarState.sidebarEl?.contains(target)) return;

        if (sidebarState.toggleTriggerEl?.contains?.(target)) return;

        closeSidebar();

    };

    // Capture phase so this still works even if a page module
    // stops propagation on its own click handlers.
    document.addEventListener("click", sidebarState.handlers.onOutsideClick, true);

}

/* ==========================================================
   ESC Key (mobile drawer)
========================================================== */

function initEscKey() {

    sidebarState.handlers.onKeydown = (event) => {

        if (event.key === "Escape" && sidebarState.isMobile && sidebarState.isOpen) {

            closeSidebar();

            return;

        }

        if (event.key === "Tab" && sidebarState.isMobile && sidebarState.isOpen) {

            trapFocus(event);

        }

    };

    document.addEventListener("keydown", sidebarState.handlers.onKeydown);

}

/* ==========================================================
   Focus Management
========================================================== */

function getFocusableElements() {

    if (!sidebarState.sidebarEl) return [];

    return [...sidebarState.sidebarEl.querySelectorAll(FOCUSABLE_SELECTOR)]
        .filter((el) => el.offsetParent !== null);

}

function focusFirstItem() {

    const focusable = getFocusableElements();

    (focusable[0] || sidebarState.sidebarEl)?.focus?.();

}

function returnFocusToTrigger() {

    const trigger = sidebarState.toggleTriggerEl;

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

    sidebarState.handlers.onBreakpointChange = (event) => {

        sidebarState.isMobile = event.matches;

        if (sidebarState.isMobile) {

            // Entering mobile: never surface a full-screen
            // drawer the user didn't just ask for.
            sidebarState.isOpen = false;

        } else {

            // Leaving mobile: restore desktop's collapsed
            // preference instead of forcing expanded.
            sidebarState.isOpen = !readStoredCollapsed();

        }

        applyState({ silent: true });

    };

    if (sidebarState.mediaQueryList.addEventListener) {

        sidebarState.mediaQueryList.addEventListener("change", sidebarState.handlers.onBreakpointChange);

    } else {

        // Safari < 14
        sidebarState.mediaQueryList.addListener(sidebarState.handlers.onBreakpointChange);

    }

}

/* ==========================================================
   Collapse Preference Persistence (desktop only)
========================================================== */

function persistCollapsed(collapsed) {

    try {

        localStorage.setItem(COLLAPSE_STORAGE_KEY, collapsed ? "1" : "0");

    } catch (error) {

        // Storage unavailable (private mode, quota, etc.) —
        // collapse still works for this session, it just
        // won't be remembered next visit.

    }

}

function readStoredCollapsed() {

    try {

        return localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1";

    } catch (error) {

        return false;

    }

}

/* ==========================================================
   Logout
========================================================== */

function initLogout() {

    const logoutButton = sidebarState.logoutBtn;

    if (!logoutButton) return;

    logoutButton.addEventListener("click", handleLogout);

}

/* ==========================================================
   Logout Handler
========================================================== */

async function handleLogout() {

    const confirmed = confirm(

        "Are you sure you want to logout?"

    );

    if (!confirmed) return;

    await clearSuperAdminSession();

    destroySuperAdminRouter();

    destroySidebar();

    navigate("super-admin-login");

}

/* ==========================================================
   Session clearing now lives in shared/services/session/
   session.service.js so Topbar and Profile can reuse the
   exact same logic instead of duplicating it.
========================================================== */
