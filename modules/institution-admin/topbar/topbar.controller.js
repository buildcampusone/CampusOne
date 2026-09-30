/**
 * ==========================================================
 * CampusOne
 * Institution Admin Topbar Controller
 * ----------------------------------------------------------
 * Part 4.2 — Topbar Reuse
 * Topbar Panel Engine Extraction — this file is now a thin
 * wrapper over shared/components/topbar/topbar.controller.js's
 * createTopbar() factory (itself over
 * shared/core/navigation/topbar-panel.engine.js). The generic
 * sidebar-toggle wiring and dropdown-panel state machine that
 * used to be copy-pasted here (and in Super Admin's
 * topbar.controller.js before it) now lives in that shared
 * engine. This file keeps the exact same public API
 * (initTopbar/destroyTopbar/updatePageTitle) and the exact
 * same behavior — no visual/UX change — it just no longer owns
 * the panel-toggle plumbing itself.
 *
 * Sidebar ownership rule carries over unchanged: this file
 * never manipulates sidebar DOM directly, only ever requests
 * toggleSidebar() and reads isSidebarOpen(), both passed to the
 * shared engine as callbacks.
 *
 * Placeholder-only per Part 4.2 — trimmed vs. the Super Admin
 * original:
 *   - no seeded notification list / mark-all / view-all logic
 *   - no profile identity fetch or live-sync
 *     (getProfile()/profile.service.js is Super Admin's own
 *     Firestore-backed module; Institution Admin has no
 *     equivalent yet, so the topbar renders static placeholder
 *     text instead of calling out to fetch real data)
 *   - no profile-menu navigation beyond "My Profile" (no other
 *     modules to route to yet)
 * Search input is decorative only — no input listener, no
 * business logic, no API calls.
 *
 * Content-specific ids (myProfileBtn/logoutBtn) are deliberately
 * NOT registered with the shared engine — they stay wired and
 * cleaned up here, in this role's own controller, the same way
 * the audit that led to this extraction flagged they must never
 * be baked into the generic engine's cleanup.
 * ==========================================================
 */

import { createTopbar } from "../../../shared/components/topbar/topbar.controller.js";

import { toggleSidebar, isSidebarOpen } from "../components/sidebar/sidebar.controller.js";

import { navigate } from "../../../router/router.js";
import { navigateToModule } from "../router/router.institution.js";

import { clearInstitutionAdminSession } from "../../../shared/services/session.service.js";

/* ==========================================================
   Shared Topbar Instance
   ----------------------------------------------------------
   All sidebar-toggle-sync / panel-state-machine ownership lives
   inside the shared engine instance below. This file never
   touches that plumbing directly — it only registers panels and
   wires its own content buttons on top.
========================================================== */

const topbar = createTopbar({

    sidebarToggleId: "sidebarToggle",

    onToggleSidebar(triggerEl) {

        toggleSidebar(triggerEl);

    },

    getSidebarOpen() {

        return isSidebarOpen();

    }

});

/* ==========================================================
   Topbar Controller State
   ----------------------------------------------------------
   Only what's still genuinely owned here: page title caching
   and the content-specific button handlers (My Profile,
   Logout) that must never be part of the shared engine.
========================================================== */

const topbarState = {

    handlers: {},

    // Priority 2 — dynamic page title. Cached once on init so
    // updatePageTitle() below doesn't re-query the DOM on every
    // navigation.
    pageTitleEl: null,

    pageSubtitleEl: null

};

export function initTopbar() {

    topbar.init();

    initNotifications();

    initProfileMenu();

    initPageTitle();

}

/* ==========================================================
   Page Title
   ----------------------------------------------------------
   Priority 2 — was a hardcoded "Dashboard"/"Welcome to..."
   pair with nothing wiring it to navigation. shell.controller.js
   already has an onNavigate(moduleId) callback (used today to
   sync Sidebar + Bottom Nav active state) — it calls
   updatePageTitle() from there the same way, so this stays a
   single source of truth instead of a second navigation
   listener.

   Kept deliberately generic — (title, subtitle) rather than a
   "Dashboard-specific" setter — so a future breadcrumb trail
   can call this same function with a composed string (e.g.
   "Academics / Attendance") without any change here.
========================================================== */

function initPageTitle() {

    topbarState.pageTitleEl = document.getElementById("topbarPageTitle");

    topbarState.pageSubtitleEl = document.getElementById("topbarPageSubtitle");

}

export function updatePageTitle(title, subtitle) {

    if (topbarState.pageTitleEl && typeof title === "string") {

        topbarState.pageTitleEl.textContent = title;

    }

    if (topbarState.pageSubtitleEl && typeof subtitle === "string") {

        topbarState.pageSubtitleEl.textContent = subtitle;

    }

}

/* ==========================================================
   Cleanup
   ----------------------------------------------------------
   Call this when the topbar is unmounted (route change /
   shell teardown) so no listeners leak. Safe to call even if
   initTopbar() was never called.
========================================================== */

export function destroyTopbar() {

    topbar.destroy();

    if (topbarState.handlers.onMyProfile) {

        document
            .getElementById("myProfileBtn")
            ?.removeEventListener("click", topbarState.handlers.onMyProfile);

    }

    if (topbarState.handlers.onLogout) {

        document
            .getElementById("logoutBtn")
            ?.removeEventListener("click", topbarState.handlers.onLogout);

    }

    topbarState.handlers = {};

    topbarState.pageTitleEl = null;

    topbarState.pageSubtitleEl = null;

}

/* ==========================================================
   Notifications (placeholder — no seeded data, no business
   logic; the panel just opens/closes onto the empty state
   already in the markup)
========================================================== */

function initNotifications() {

    const wrap = document.querySelector(
        '.ia-notification-wrap[data-panel="notification"]'
    );

    const button = document.getElementById(
        "notificationButton"
    );

    const panel = document.getElementById(
        "notificationPanel"
    );

    if (!wrap || !button || !panel) return;

    topbar.registerPanel("notification", { wrap, button, panel });

}

/* ==========================================================
   Profile Menu (placeholder — static identity already in the
   markup, no fetch/sync; only Logout is wired, reusing the
   same session-clearing call the Sidebar's Logout button uses)
========================================================== */

function initProfileMenu() {

    const wrap = document.querySelector(
        '.ia-profile-wrap[data-panel="profile"]'
    );

    const button = document.getElementById(
        "profileButton"
    );

    const panel = document.getElementById(
        "profilePanel"
    );

    if (!wrap || !button || !panel) return;

    topbar.registerPanel("profile", { wrap, button, panel });

    const myProfileBtn = document.getElementById("myProfileBtn");

    if (myProfileBtn) {

        topbarState.handlers.onMyProfile = () => {

            topbar.closePanel("profile");
            navigateToModule("profile");

        };

        myProfileBtn.addEventListener("click", topbarState.handlers.onMyProfile);

    }

    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {

        topbarState.handlers.onLogout = async () => {

            topbar.closePanel("profile");

            const confirmed = confirm("Are you sure you want to logout?");

            if (!confirmed) return;

            await clearInstitutionAdminSession();

            navigate("login");

        };

        logoutBtn.addEventListener("click", topbarState.handlers.onLogout);

    }

}
