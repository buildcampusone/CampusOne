/**
 * ==========================================================
 * CampusOne
 * Institution Owner Topbar Controller
 * ----------------------------------------------------------
 * Part 1.3 — Owner Topbar V1
 * Thin wrapper around the shared Topbar Panel Engine (via
 * shared/components/topbar/topbar.controller.js's
 * createTopbar()) — the same pattern Institution Admin's own
 * topbar.controller.js now uses. No copy-pasted panel-toggle
 * logic here; this file only supplies Institution Owner's
 * identity (which sidebar-toggle id to bind to, what "toggle"
 * calls) and registers its two placeholder panels.
 *
 * Scope note (mirrors the Owner Sidebar's own file header):
 * Institution Owner still has no notification service, so:
 *
 *   - Notification button opens a static empty-state panel.
 *     No badge, no seeded list, no mark-all/view-all — none of
 *     that exists here even as inert markup, since there is no
 *     notification data behind it yet.
 *   - Profile button opens a static placeholder panel (identity
 *     markup only, no fetch/sync). "My Profile" is wired to the
 *     real Institution Owner Profile route via navigateToModule()
 *     from router/router.institution-owner.js, same pattern as
 *     modules/institution-admin/topbar/topbar.controller.js.
 *     "Logout" is wired to the real flow as of Part 3.10.1:
 *     close panel → await logout() from
 *     shared/services/auth.service.js → navigate("login") from
 *     router/router.js.
 * ==========================================================
 */

import { createTopbar } from "../../../shared/components/topbar/topbar.controller.js";

import { toggleSidebar, isSidebarOpen } from "../components/sidebar/sidebar.controller.js";

import { logout } from "../../../shared/services/auth.service.js";

import { navigate } from "../../../router/router.js";

import { navigateToModule } from "../router/router.institution-owner.js";

/* ==========================================================
   Shared Topbar Instance
   ----------------------------------------------------------
   All sidebar-toggle-sync / panel-state-machine ownership lives
   inside the shared engine instance below — same seam
   Institution Admin's Topbar goes through, so "no duplicated
   panel logic" holds for Owner too.
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
========================================================== */

const topbarState = {

    handlers: {},

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
   Same generic (title, subtitle) setter as Institution Admin's
   Topbar, so a future Owner module router can call this the
   same way once it exists — no change needed here when it does.
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
   Call this when the topbar is unmounted so no listeners leak.
   Safe to call even if initTopbar() was never called.
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
   Notifications (placeholder — static empty state only, no
   data source exists yet)
========================================================== */

function initNotifications() {

    const wrap = document.querySelector(
        '.io-notification-wrap[data-panel="notification"]'
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
   Profile Menu (placeholder — static identity in the markup,
   no fetch/sync; "My Profile" and "Logout" are inert stubs,
   same discipline as the Owner Sidebar's onRouteSelect/onLogout)
========================================================== */

function initProfileMenu() {

    const wrap = document.querySelector(
        '.io-profile-wrap[data-panel="profile"]'
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

            try {

                await logout();

                navigate("login");

            } catch (error) {

                console.error(error);

            }

        };

        logoutBtn.addEventListener("click", topbarState.handlers.onLogout);

    }

}
