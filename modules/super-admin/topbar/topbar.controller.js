/**
 * ==========================================================
 * CampusOne
 * Super Admin Topbar Controller
 * ----------------------------------------------------------
 * Sub-Phase 1.2 — Super Admin → Shared Topbar Engine
 * This file is now a thin wrapper over
 * shared/components/topbar/topbar.controller.js's createTopbar()
 * factory (itself over
 * shared/core/navigation/topbar-panel.engine.js) — the same
 * seam Institution Admin's and Institution Owner's Topbar
 * controllers already go through. The generic sidebar-toggle
 * wiring and dropdown-panel state machine (register / open /
 * close / toggle / outside-click / ESC / one-open-at-a-time /
 * aria-expanded sync) that used to be copy-pasted here now
 * lives in that shared engine. This file keeps the exact same
 * public API (initTopbar/destroyTopbar) and the exact same
 * behavior — no visual/UX change — it just no longer owns the
 * panel-toggle plumbing itself.
 *
 * Sidebar ownership rule carries over unchanged: this file
 * never manipulates sidebar DOM directly, only ever requests
 * toggleSidebar() and reads isSidebarOpen(), both passed to the
 * shared engine as callbacks.
 *
 * Everything content-specific — Global Search, seeded
 * Notifications (badge/list/empty-state/mark-all/view-all),
 * Profile Menu (action buttons + Logout), and Profile Sync
 * (header ↔ Profile page live sync via profile.service.js) —
 * stays exactly as it was, still owned by this file. None of
 * that is panel-engine concern, so none of it moved.
 * ==========================================================
 */

import { createTopbar } from "../../../shared/components/topbar/topbar.controller.js";

import { toggleSidebar, isSidebarOpen } from "../components/sidebar/sidebar.controller.js";

import { navigateToModule } from "../router/router.super.js";

import { navigate } from "../../../router/router.js";

import { clearSuperAdminSession } from "../../../shared/services/session.service.js";

import { getProfile, PROFILE_UPDATED_EVENT } from "../profile/profile.service.js";

/* ==========================================================
   Shared Topbar Instance
   ----------------------------------------------------------
   All sidebar-toggle-sync / panel-state-machine ownership lives
   inside the shared engine instance below. This file never
   touches that plumbing directly — it only registers panels and
   wires its own content buttons on top, same as Institution
   Admin's and Institution Owner's Topbar controllers.
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
   Only what's still genuinely owned here: content-specific
   handlers (notifications, profile menu, logout, profile sync)
   that must never be part of the shared engine.
========================================================== */

const topbarState = {

    handlers: {}

};

export function initTopbar() {

    topbar.init();

    initSearch();

    initNotifications();

    initProfileMenu();

    initProfileSync();

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

    if (topbarState.handlers.onMarkAllRead) {

        document
            .getElementById("markAllReadBtn")
            ?.removeEventListener("click", topbarState.handlers.onMarkAllRead);

    }

    if (topbarState.handlers.onViewAll) {

        document
            .getElementById("viewAllNotificationsBtn")
            ?.removeEventListener("click", topbarState.handlers.onViewAll);

    }

    if (topbarState.handlers.onLogout) {

        document
            .getElementById("logoutBtn")
            ?.removeEventListener("click", topbarState.handlers.onLogout);

    }

    (topbarState.handlers.profileActionCleanups || []).forEach((cleanup) => cleanup());

    if (topbarState.handlers.onProfileUpdated) {

        window.removeEventListener(
            PROFILE_UPDATED_EVENT,
            topbarState.handlers.onProfileUpdated
        );

    }

    topbarState.handlers = {};

}

/* ==========================================================
   Global Search
========================================================== */

function initSearch() {

    const search = document.getElementById(
        "globalSearch"
    );

    if (!search) return;

    search.addEventListener("input", (event) => {

        const keyword = event.target.value.trim();

        console.log(
            "[CampusOne] Search:",
            keyword
        );

        // Future
        // searchDashboard(keyword);

    });

}

/* ==========================================================
   Notifications
========================================================== */

function initNotifications() {

    const wrap = document.querySelector(
        '.sa-notification-wrap[data-panel="notification"]'
    );

    const button = document.getElementById(
        "notificationButton"
    );

    const panel = document.getElementById(
        "notificationPanel"
    );

    if (!wrap || !button || !panel) return;

    topbar.registerPanel("notification", { wrap, button, panel });

    const badge = document.getElementById("notificationBadge");
    const list = document.getElementById("notificationList");
    const emptyState = document.getElementById("notificationEmpty");
    const markAllBtn = document.getElementById("markAllReadBtn");
    const viewAllBtn = document.getElementById("viewAllNotificationsBtn");

    function updateEmptyState() {

        const hasItems = !!list && list.children.length > 0;

        if (emptyState) emptyState.hidden = hasItems;
        if (list) list.hidden = !hasItems;

    }

    function updateBadge() {

        if (!badge || !list) return;

        const unreadCount = list.querySelectorAll(".is-unread").length;

        if (unreadCount > 0) {

            badge.hidden = false;

            badge.textContent = unreadCount > 9 ? "9+" : String(unreadCount);

        } else {

            badge.hidden = true;

        }

    }

    if (markAllBtn) {

        topbarState.handlers.onMarkAllRead = () => {

            list?.querySelectorAll(".is-unread").forEach((item) => {

                item.classList.remove("is-unread");

            });

            updateBadge();

            console.log("[CampusOne] Notifications: mark all as read");

            // Future
            // markAllNotificationsReadOnServer();

        };

        markAllBtn.addEventListener("click", topbarState.handlers.onMarkAllRead);

    }

    if (viewAllBtn) {

        topbarState.handlers.onViewAll = () => {

            console.log("[CampusOne] Notifications: view all");

            topbar.closePanel("notification");

            // Future
            // navigateTo("/notifications");

        };

        viewAllBtn.addEventListener("click", topbarState.handlers.onViewAll);

    }

    updateEmptyState();
    updateBadge();

}

/* ==========================================================
   Profile Menu
========================================================== */

function initProfileMenu() {

    const wrap = document.querySelector(
        '.sa-profile-wrap[data-panel="profile"]'
    );

    const button = document.getElementById(
        "profileButton"
    );

    const panel = document.getElementById(
        "profilePanel"
    );

    if (!wrap || !button || !panel) return;

    topbar.registerPanel("profile", { wrap, button, panel });

    const actionButtons = panel.querySelectorAll("[data-action]");

    topbarState.handlers.profileActionCleanups = [];

    actionButtons.forEach((actionBtn) => {

        const handler = () => {

            topbar.closePanel("profile");

            switch (actionBtn.dataset.action) {

                case "my-profile":

                    navigateToModule("profile");

                    break;

                case "account-settings":

                    navigateToModule("profile", { tab: "account" });

                    break;

                case "security":

                    navigateToModule("profile", { tab: "security" });

                    break;

                case "appearance":

                    navigateToModule("profile", { tab: "appearance" });

                    break;

                case "help":

                    navigateToModule("help");

                    break;

            }

        };

        actionBtn.addEventListener("click", handler);

        topbarState.handlers.profileActionCleanups.push(() =>
            actionBtn.removeEventListener("click", handler)
        );

    });

    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {

        topbarState.handlers.onLogout = async () => {

            topbar.closePanel("profile");

            const confirmed = confirm("Are you sure you want to logout?");

            if (!confirmed) return;

            await clearSuperAdminSession();

            navigate("super-admin-login");

        };

        logoutBtn.addEventListener("click", topbarState.handlers.onLogout);

    }

}

/* ==========================================================
   Profile Sync (Header ↔ Profile page)
   ----------------------------------------------------------
   Renders the logged-in Super Admin's real photo/name/role
   into the header avatar and the profile dropdown header, and
   keeps both in sync live whenever Profile > Overview saves a
   change (photo upload/remove, name edit, etc.) — no page
   refresh needed. Falls back to the generic user icon when no
   photo has been uploaded yet.
========================================================== */

function initProfileSync() {

    loadTopbarProfile();

    topbarState.handlers.onProfileUpdated = (event) => {

        renderTopbarProfile(event.detail);

    };

    window.addEventListener(
        PROFILE_UPDATED_EVENT,
        topbarState.handlers.onProfileUpdated
    );

}

async function loadTopbarProfile() {

    const profile = await getProfile();

    renderTopbarProfile(profile);

}

function renderTopbarProfile(profile) {

    if (!profile) return;

    const initials = (profile.fullName || "?")
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    const avatarMarkup = profile.photoURL
        ? `<img src="${profile.photoURL}" alt="${profile.fullName}">`
        : initials;

    const headerAvatar = document.getElementById("topbarAvatar");
    const panelAvatar = document.getElementById("topbarPanelAvatar");

    if (headerAvatar) headerAvatar.innerHTML = avatarMarkup;
    if (panelAvatar) panelAvatar.innerHTML = avatarMarkup;

    setText("topbarUserName", profile.displayName || profile.fullName);
    setText("topbarUserRole", profile.role);
    setText("topbarPanelUserName", profile.fullName);
    setText("topbarPanelUserRole", profile.role);

}

function setText(id, value) {

    const el = document.getElementById(id);

    if (el) el.textContent = value || "";

}
