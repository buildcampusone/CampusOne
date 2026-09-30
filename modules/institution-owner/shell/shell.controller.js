/**
 * ==========================================================
 * CampusOne
 * Institution Owner Shell Controller
 * ----------------------------------------------------------
 * Part 1.4B — Owner Shell Integration
 * Part 2.3  — Dashboard Integration
 * Part 3.11 — Owner Auth Guard (Security Phase 1)
 * Phase 2A  — Owner Shell Unblock (Status Bar)
 * ----------------------------------------------------------
 * Mounts the already-completed Owner chrome (Sidebar / Topbar /
 * Activity Panel / Status Bar) into the region slots
 * shell.page.js defines, the same direct-render pattern
 * Institution Admin's own shell controller uses for its
 * equivalent regions.
 *
 * Part 3.11 closes the security gap this file used to carry:
 * nothing renders anymore until router/guards.js confirms both
 * a verified Firebase session AND the INSTITUTION_OWNER role —
 * same initInstitutionAdminGuard()-shaped contract Institution
 * Admin's own shell controller already gates on. Wrong-role
 * sessions are bounced to their own dashboard via the shared
 * resolveRouteForRole() lookup (falling back to "login" if none
 * is registered for that role); unauthenticated/unverified
 * sessions go straight to "login" — the exact same outcomes
 * Institution Admin's guard already produces for those cases.
 *
 * Phase 2 — Institution Owner Module Router
 * ----------------------------------------------------------
 * #ioContent is now routed: initInstitutionOwnerRouter() from
 * router/router.institution-owner.js owns the workspace,
 * exactly the way router.institution.js owns Institution
 * Admin's #iaContent. Its onNavigate callback keeps Sidebar,
 * Bottom Nav, and the Topbar page title in sync with whatever
 * module is active — same single-source-of-truth pattern
 * Institution Admin's shell controller already uses. This is
 * routing only: no Firestore, no business logic. Modules whose
 * modules.registry.js status isn't yet "ready" render a
 * "Coming soon" state, same as Institution Admin's own
 * non-ready entries.
 *
 * Phase 2A closes the one remaining gap noted in earlier
 * passes: #ioStatusBar now mounts status-bar/status-bar.page.js
 * + status-bar.controller.js, the same io- namespaced,
 * placeholder-only Status Bar mirrored from Institution
 * Admin's (itself mirrored from Super Admin's). No shared
 * extraction — this stays an Owner-local file, same as
 * Sidebar/Topbar/Activity Panel already are.
 *
 * Sidebar, Topbar, Activity Panel, Status Bar, and Bottom Nav
 * are only *rendered* here (their own *Page() markup + their
 * own init*()) — none of their implementations are modified by
 * this file.
 *
 * initInstitutionOwnerShell() is intentionally the only export.
 * ==========================================================
 */

import {
    initInstitutionOwnerGuard
} from "../router/guards.js";

import {
    initInstitutionOwnerRouter
} from "../router/router.institution-owner.js";

import {
    getModule
} from "../router/modules.registry.js";

import {
    resolveRouteForRole
} from "../../../shared/core/auth/role-router.js";

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
    BOTTOM_NAV_ITEMS
} from "../components/bottom-nav/bottom-nav.config.js";

import {
    initBottomNav,
    setActiveBottomNavItem
} from "../components/bottom-nav/bottom-nav.controller.js";

/* ==========================================================
   Initialize Shell
========================================================== */

export function initInstitutionOwnerShell() {

    const regions = {
        sidebar: document.getElementById("ioSidebar"),
        topbar: document.getElementById("ioTopbar"),
        content: document.getElementById("ioContent"),
        activityPanel: document.getElementById("ioActivityPanel"),
        statusBar: document.getElementById("ioStatusBar"),
        bottomNav: document.getElementById("ioBottomNav")
    };

    for (const [name, element] of Object.entries(regions)) {

        if (!element) {

            console.error(`[CampusOne] Institution Owner shell region "${name}" not found.`);

        }

    }

    let unsubscribe;

    // Nothing below renders until the guard confirms a verified
    // Firebase session AND the INSTITUTION_OWNER role — same
    // gate Institution Admin's shell controller already applies
    // via initInstitutionAdminGuard().
    unsubscribe = initInstitutionOwnerGuard({

        onAuthorized() {

            unsubscribe?.();

            renderSidebar(regions.sidebar);

            renderTopbar(regions.topbar);

            renderActivityPanel(regions.activityPanel);

            renderStatusBar(regions.statusBar);

            renderBottomNav(regions.bottomNav);

            renderWorkspace(regions.content);

        },

        onUnauthenticated() {

            unsubscribe?.();

            navigate("login");

        },

        onUnverified() {

            unsubscribe?.();

            navigate("login");

        },

        onUnauthorized(session) {

            unsubscribe?.();

            // Signed in, but not an Institution Owner — send them
            // to whichever dashboard their actual role resolves
            // to (the same lookup login.controller.js and
            // bootstrap.manager.js already use), rather than
            // dead-ending at login. Falls back to "login" only if
            // their role has no registered route at all.
            navigate(resolveRouteForRole(session.role) || "login");

        },

        onLoading() {

            // Session verification (Firebase Auth) has resolved,
            // role verification (Firestore) hasn't yet — nothing
            // to paint here yet. Add a skeleton (mirroring Super
            // Admin's ShellContentSkeleton) once this shell has
            // its own chrome to keep on screen while waiting —
            // out of scope for this pass (guard only, no UI
            // changes).

        }

    });

    return regions;

}

/* ==========================================================
   Sidebar
========================================================== */

function renderSidebar(sidebar) {

    if (!sidebar) {

        console.error("[CampusOne] Institution Owner sidebar container not found.");

        return;

    }

    sidebar.innerHTML = SidebarPage();

    initSidebar();

}

/* ==========================================================
   Topbar
========================================================== */

function renderTopbar(topbar) {

    if (!topbar) {

        console.error("[CampusOne] Institution Owner topbar container not found.");

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

        console.error("[CampusOne] Institution Owner activity panel container not found.");

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

        console.error("[CampusOne] Institution Owner status bar container not found.");

        return;

    }

    statusBar.innerHTML = StatusBarPage();

    initStatusBar();

}

/* ==========================================================
   Bottom Nav
   ----------------------------------------------------------
   Premium Mobile Bottom Navigation (UI-only pass). Mobile/
   tablet only — hidden above 1024px by bottom-nav.css; renders
   harmlessly on desktop where it simply stays display:none.
========================================================== */

function renderBottomNav(bottomNav) {

    if (!bottomNav) {

        console.error("[CampusOne] Institution Owner bottom nav container not found.");

        return;

    }

    bottomNav.innerHTML = BottomNavPage(BOTTOM_NAV_ITEMS);

    initBottomNav();

}

/* ==========================================================
   Workspace
   ----------------------------------------------------------
   #ioContent is now owned by router.institution-owner.js —
   same contract Institution Admin's shell controller uses for
   #iaContent. The router lazy-loads each module's own
   render()/destroy() (Dashboard's included — no markup
   duplicated here, no change to dashboard.page.js's contract)
   and calls onNavigate on every module switch (sidebar click,
   bottom-nav tap, browser back/forward, or direct URL) so
   Sidebar, Bottom Nav, and the Topbar title never disagree
   about what's active.
========================================================== */

function renderWorkspace(content) {

    if (!content) {

        console.error("[CampusOne] Institution Owner content container not found.");

        return;

    }

    initInstitutionOwnerRouter(content, {

        onNavigate(moduleId) {

            setActiveModule(moduleId);

            setActiveBottomNavItem(moduleId);

            // Reads the label already defined in
            // modules.registry.js (single source of truth
            // Sidebar also reads from) rather than introducing a
            // second title string anywhere.
            const moduleDefinition = getModule(moduleId);

            if (moduleDefinition) {

                updatePageTitle(moduleDefinition.label);

            }

        }

    });

}
