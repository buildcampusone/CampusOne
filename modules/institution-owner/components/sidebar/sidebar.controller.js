/**
 * ==========================================================
 * CampusOne
 * Institution Owner Sidebar Controller
 * ----------------------------------------------------------
 * Sidebar Engine Extraction
 * ----------------------------------------------------------
 * Thin role wrapper around the shared sidebar engine
 * (shared/core/navigation/sidebar.engine.js, via
 * shared/components/sidebar/sidebar.controller.js's
 * createSidebar()) — the same pattern Institution Admin's own
 * sidebar.controller.js now uses. No copy-pasted state machine
 * here; this file only supplies Institution Owner's identity:
 * which ids/classes/storage key to bind to, what a nav-item
 * click navigates to, and what logout does.
 *
 *   - Root:            #ioSidebar
 *   - Overlay:         #ioSidebarOverlay / .io-sidebar-overlay
 *   - Collapse storage: "campusone-io-sidebar-collapsed"
 *   - Body no-scroll:  .io-no-scroll (already anticipated by
 *                      modules/institution-owner/shell/shell.css)
 *   - Nav items:       .io-nav-item (data-route)
 *
 * Phase 2 — Institution Owner Module Router
 * ----------------------------------------------------------
 * onRouteSelect now calls the real navigateToModule() from
 * router/router.institution-owner.js — same contract
 * Institution Admin's own sidebar.controller.js already uses.
 * Nav items with modules.registry.js status "soon" still
 * navigate (the router renders a "Coming soon" state for
 * those), so every sidebar item is wired to a real route; only
 * "ready" items render actual module content.
 *
 * onLogout is wired to the real flow as of Part 3.10.1: await
 * logout() from shared/services/auth.service.js, tear down the
 * module router, then navigate("login") from router/router.js.
 * ==========================================================
 */

import {
    createSidebar
} from "../../../../shared/components/sidebar/sidebar.controller.js";

import { logout } from "../../../../shared/services/auth.service.js";

import { navigate } from "../../../../router/router.js";

import {
    navigateToModule,
    destroyInstitutionOwnerRouter
} from "../../router/router.institution-owner.js";

/* ==========================================================
   Sidebar Instance
   ----------------------------------------------------------
   All state/DOM ownership lives inside the shared engine
   instance below. This file never touches sidebar DOM
   directly — Topbar (once it exists for this role) should only
   ever call toggleSidebar()/openSidebar()/closeSidebar()/
   isSidebarOpen(), the same contract Institution Admin's
   Topbar already follows.
========================================================== */

const sidebar = createSidebar({

    rootId: "ioSidebar",
    overlayId: "ioSidebarOverlay",
    overlayClass: "io-sidebar-overlay",
    storageKey: "campusone-io-sidebar-collapsed",
    noScrollClass: "io-no-scroll",
    navItemSelector: ".io-nav-item",
    ariaLabel: "Institution Owner navigation",

    onRouteSelect(route) {

        navigateToModule(route);

    },

    async onLogout() {

        try {

            await logout();

            destroyInstitutionOwnerRouter();

            destroySidebar();

            navigate("login");

        } catch (error) {

            console.error(error);

        }

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
   Will be called by the Institution Owner shell controller
   once its own module router exists, the same way Institution
   Admin's shell controller calls setActiveModule() today.
========================================================== */

export function setActiveModule(route) {

    sidebar.setActive(route);

}
