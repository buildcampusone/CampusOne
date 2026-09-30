/**
 * ==========================================================
 * CampusOne
 * Institution Admin Sidebar Controller
 * ----------------------------------------------------------
 * Part 4.1 — Sidebar Reuse
 * Sidebar Engine Extraction (post Part 4.1)
 * ----------------------------------------------------------
 * Thin role wrapper around the shared sidebar engine
 * (shared/core/navigation/sidebar.engine.js, via
 * shared/components/sidebar/sidebar.controller.js's
 * createSidebar()). This file used to own a full ~750-line
 * copy of the collapse/mobile-drawer/keyboard/focus-trap state
 * machine (a 1:1 mirror of Super Admin's own copy); that state
 * machine now lives once, shared, and this file only supplies
 * Institution Admin's identity: which ids/classes/storage key
 * to bind to, what a nav-item click navigates to, and what
 * logout does.
 *
 * Behavior, DOM ids/classes, storage key, and the public API
 * below are UNCHANGED from before this refactor — this is a
 * reuse/extraction change only, not a UX, visual, routing,
 * guard, or business-logic change:
 *
 *   - Root:            #iaSidebar
 *   - Overlay:         #iaSidebarOverlay / .ia-sidebar-overlay
 *   - Collapse storage: "campusone-ia-sidebar-collapsed"
 *   - Body no-scroll:  .ia-no-scroll
 *   - Nav items:       .ia-nav-item (data-route)
 *
 * Same public API, same source of truth, breakpoint-appropriate
 * rendering. State changes are still broadcast on window as
 * "sidebar:statechange" (now dispatched by the shared engine)
 * so other modules (Topbar, Bottom Nav) can react without
 * owning or touching sidebar DOM themselves — that contract is
 * untouched.
 * ==========================================================
 */

import {
    createSidebar
} from "../../../../shared/components/sidebar/sidebar.controller.js";

import {
    navigateToModule,
    destroyInstitutionAdminRouter
} from "../../router/router.institution.js";

import {
    navigate
} from "../../../../router/router.js";

import {
    clearInstitutionAdminSession
} from "../../../../shared/services/session.service.js";

/* ==========================================================
   Sidebar Instance
   ----------------------------------------------------------
   All state/DOM ownership lives inside the shared engine
   instance below. This file never touches sidebar DOM
   directly — same rule as before ("Topbar only ever calls
   toggleSidebar()/openSidebar()/closeSidebar()/isSidebarOpen()
   — it never reaches into sidebar DOM directly"), now also
   true of this file with respect to the engine.
========================================================== */

const sidebar = createSidebar({

    rootId: "iaSidebar",
    overlayId: "iaSidebarOverlay",
    overlayClass: "ia-sidebar-overlay",
    storageKey: "campusone-ia-sidebar-collapsed",
    noScrollClass: "ia-no-scroll",
    navItemSelector: ".ia-nav-item",
    ariaLabel: "Institution Admin navigation",

    onRouteSelect(route) {

        navigateToModule(route);

    },

    async onLogout() {

        await clearInstitutionAdminSession();

        destroyInstitutionAdminRouter();

        destroySidebar();

        navigate("login");

    }

});

/* ==========================================================
   Initialize / Destroy
========================================================== */

export function initSidebar() {

    sidebar.init();

}

export function destroySidebar() {

    sidebar.destroy();

}

/* ==========================================================
   Public Toggle API
========================================================== */

export function openSidebar(triggerEl) {

    sidebar.open(triggerEl);

}

export function closeSidebar() {

    sidebar.close();

}

export function toggleSidebar(triggerEl) {

    sidebar.toggle(triggerEl);

}

export function isSidebarOpen() {

    return sidebar.isOpen();

}

/* ==========================================================
   Sync Active Nav Item
   ----------------------------------------------------------
   Called by the shell controller whenever router.institution.js
   reports a module change — sidebar click, hashchange (browser
   back/forward), or a direct navigateToModule() call from
   anywhere else. The router is the single source of truth for
   "what's active"; the sidebar only reflects it.
========================================================== */

export function setActiveModule(route) {

    sidebar.setActive(route);

}
