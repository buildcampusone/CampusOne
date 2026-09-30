/**
 * ==========================================================
 * CampusOne
 * Institution Admin Shell Controller
 * ----------------------------------------------------------
 * Controls the Institution Admin Shell.
 *
 * Same contract as modules/super-admin/shell/shell.controller.js
 * — verify session + role via a guard before anything renders,
 * then hand the workspace element off to this shell's own
 * router. #iaSidebar (Part 4.1), #iaTopbar (Part 4.2),
 * #iaActivityPanel / #iaStatusBar (Part 4.3), and now
 * #iaBottomNav (Part 6.1) are all real mount slots: this
 * controller renders each component's *Page() into its slot
 * and calls its init*() function, the same way Super Admin's
 * shell controller mounts #saSidebar / #saTopbar /
 * #saActivityPanel / #saStatusBar / #saBottomNav. Nothing about
 * the guard's contract (guards.js) or the router's contract
 * (router.institution.js) changes here — the routed content
 * outlet (#iaContent) is untouched by any of this. The router's
 * onNavigate callback now also calls setActiveBottomNavItem()
 * alongside the existing setActiveModule() call, so Sidebar and
 * Bottom Nav can never disagree about what's active — same
 * single-source-of-truth pattern Super Admin already uses.
 * ==========================================================
 */

import {
    initInstitutionAdminRouter
} from "../router/router.institution.js";

import {
    initInstitutionAdminGuard
} from "../router/guards.js";

import {
    navigate
} from "../../../router/router.js";

import {
    SidebarPage
} from "../components/sidebar/sidebar.page.js";

import {
    initSidebar,
    setActiveModule
} from "../components/sidebar/sidebar.controller.js";

import {
    TopbarPage
} from "../topbar/topbar.page.js";

import {
    initTopbar,
    updatePageTitle
} from "../topbar/topbar.controller.js";

import {
    getModule
} from "../router/modules.registry.js";

import {
    ActivityPanelPage
} from "../activity-panel/activity-panel.page.js";

import {
    initActivityPanel
} from "../activity-panel/activity-panel.controller.js";

import {
    StatusBarPage
} from "../status-bar/status-bar.page.js";

import {
    initStatusBar
} from "../status-bar/status-bar.controller.js";

import {
    BottomNavPage
} from "../components/bottom-nav/bottom-nav.page.js";

import {
    initBottomNav,
    setActiveBottomNavItem
} from "../components/bottom-nav/bottom-nav.controller.js";

/* ==========================================================
   Initialize Shell
========================================================== */

export function initInstitutionAdminShell() {

    const content = document.getElementById("iaContent");
    const sidebar = document.getElementById("iaSidebar");
    const topbar = document.getElementById("iaTopbar");
    const activityPanel = document.getElementById("iaActivityPanel");
    const statusBar = document.getElementById("iaStatusBar");
    const bottomNav = document.getElementById("iaBottomNav");

    let unsubscribe;

    // Redirects back to login for every non-authorized case (no
    // session, unverified email, or signed in but not in
    // guards.js's ALLOWED_ROLES) — the dashboard itself is never
    // rendered until the guard confirms both the role AND
    // whatever Firestore-backed permission check
    // hasInstitutionAdminPermission() ends up doing.
    unsubscribe = initInstitutionAdminGuard({

        // Phase C / R1 — the guard has always called onAuthorized(session)
        // (see guards.js's final `onAuthorized(session);`); this callback
        // simply wasn't capturing it before. Capturing it now threads
        // session.userProfile (role + permissions map) down to the Sidebar
        // and Workspace so a later phase can actually gate on it. No
        // authorization decision is made here or below — this is plumbing
        // only, identical rendering/behavior as before.
        onAuthorized(session) {

            unsubscribe?.();

            renderSidebar(sidebar, session.userProfile);

            renderTopbar(topbar);

            renderActivityPanel(activityPanel);

            renderStatusBar(statusBar);

            renderBottomNav(bottomNav);

            renderWorkspace(content, session.userProfile);

        },

        onUnauthenticated() {

            unsubscribe?.();

            navigate("login");

        },

        onUnverified() {

            unsubscribe?.();

            navigate("login");

        },

        onUnauthorized() {

            unsubscribe?.();

            navigate("login");

        },

        onLoading() {

            // Session verification (Firebase Auth) has resolved,
            // role verification (Firestore) hasn't yet — nothing
            // to paint here yet. Add a skeleton (mirroring Super
            // Admin's ShellContentSkeleton) once this shell has
            // its own chrome to keep on screen while waiting.

        }

    });

}

/* ==========================================================
   Sidebar
========================================================== */

function renderSidebar(sidebar, userProfile) {

    if (!sidebar) {

        console.error("[CampusOne] Institution Admin sidebar container not found.");

        return;

    }

    // Phase C / R1 — userProfile is threaded through and accepted by
    // SidebarPage(), but not yet read by it (see that file's own note).
    // Reserved for a later phase (permission-based nav filtering) —
    // no rendering change here.
    sidebar.innerHTML = SidebarPage(userProfile);

    initSidebar();

}

/* ==========================================================
   Topbar
========================================================== */

function renderTopbar(topbar) {

    if (!topbar) {

        console.error("[CampusOne] Institution Admin topbar container not found.");

        return;

    }

    topbar.innerHTML = TopbarPage();

    initTopbar();

}

/* ==========================================================
   Activity Panel
========================================================== */

function renderActivityPanel(activityPanel) {

    if (!activityPanel) {

        console.error("[CampusOne] Institution Admin activity panel container not found.");

        return;

    }

    activityPanel.innerHTML = ActivityPanelPage();

    initActivityPanel();

}

/* ==========================================================
   Status Bar
========================================================== */

function renderStatusBar(statusBar) {

    if (!statusBar) {

        console.error("[CampusOne] Institution Admin status bar container not found.");

        return;

    }

    statusBar.innerHTML = StatusBarPage();

    initStatusBar();

}

/* ==========================================================
   Bottom Navigation
========================================================== */

function renderBottomNav(bottomNav) {

    if (!bottomNav) {

        console.error("[CampusOne] Institution Admin bottom nav container not found.");

        return;

    }

    bottomNav.innerHTML = BottomNavPage();

    initBottomNav();

}

/* ==========================================================
   Workspace
========================================================== */

function renderWorkspace(content, userProfile) {

    if (!content) {

        console.error("[CampusOne] Institution Admin content container not found.");

        return;

    }

    // Phase C / R1 — userProfile is threaded through and accepted by
    // initInstitutionAdminRouter(), but not yet read by it (see that
    // file's own note). Reserved for a later phase (per-module route
    // authorization) — no routing change here.
    initInstitutionAdminRouter(content, {

        userProfile,

        onNavigate(moduleId) {

            setActiveModule(moduleId);

            setActiveBottomNavItem(moduleId);

            // Priority 2 — dynamic page title. Reads the label
            // already defined in modules.registry.js (single
            // source of truth Sidebar/Bottom Nav also read from)
            // rather than introducing a second title string
            // anywhere. Subtitle is left as-is on purpose — no
            // per-module subtitle copy exists in the registry
            // today, and updatePageTitle() only touches it when
            // a second argument is actually passed.
            const moduleDefinition = getModule(moduleId);

            if (moduleDefinition) {

                updatePageTitle(moduleDefinition.label);

            }

        }

    });

}
