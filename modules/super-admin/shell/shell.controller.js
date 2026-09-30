/**
 * ==========================================================
 * CampusOne
 * Super Admin Shell Controller
 * ----------------------------------------------------------
 * Controls the Super Admin Shell.
 * Initializes all shell components.
 *
 * Phase 5.1 — Skeleton Loading Screen
 * ----------------------------------------------------------
 * Replaces the old "Verifying access…" text screen with a
 * full Super Admin Dashboard Skeleton (sidebar, topbar,
 * content, activity panel, status bar) that paints the moment
 * the shell mounts — before Firebase has said anything about
 * the session. Session + role verification (guards.js) then
 * runs invisibly behind that skeleton:
 *
 *   Render Skeleton (instant)
 *          |
 *   Run Session Verification  -- initSuperAdminGuard()
 *          |
 *   Run Role Verification     -- same guard, role check
 *          |
 *   Load Firebase Data        -- router.super.js -> dashboard
 *          |                     .page.js's own fetch
 *   Fade Skeleton Out
 *          |
 *   Fade Dashboard In
 *
 * Nothing about the guard's contract (guards.js), the router's
 * contract (router.js / router.super.js), or Firebase/auth
 * changes here — only what this controller paints while it
 * waits on them.
 * ==========================================================
 */

import { SidebarPage } from "../components/sidebar/sidebar.page.js";
import { initSidebar, setActiveModule } from "../components/sidebar/sidebar.controller.js";

import { TopbarPage } from "../topbar/topbar.page.js";
import { initTopbar } from "../topbar/topbar.controller.js";

import { BottomNavPage } from "../components/bottom-nav/bottom-nav.page.js";
import { initBottomNav, setActiveBottomNavItem } from "../components/bottom-nav/bottom-nav.controller.js";

import {
    initSuperAdminRouter
} from "../router/router.super.js";

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
    initSuperAdminGuard
} from "../router/guards.js";

import {
    navigate
} from "../../../router/router.js";

import {
    ShellSidebarSkeleton,
    ShellTopbarSkeleton,
    ShellActivityPanelSkeleton,
    ShellStatusBarSkeleton,
    ShellContentSkeleton,
    ShellBottomNavSkeleton
} from "../../../shared/components/skeleton/shell/shell.skeleton.js";

import { Loading } from "../../../shared/core/loading/loading.service.js";
import { LoadingType } from "../../../shared/core/loading/loading.types.js";

import { Animation } from "../../../shared/core/animation/animation.service.js";

/* ==========================================================
   Initialize Shell
========================================================== */

export function initSuperAdminShell() {

    const regions = getRegions();

    /* ------------------------------------------------------
       Render Skeleton — instant, visual only, no text.
       All five shell regions paint in the same tick, so
       there's never a frame with some regions skeletal and
       others blank.
    ------------------------------------------------------ */

    renderShellSkeleton(regions);

    Loading.show(LoadingType.SUPER_ADMIN);

    let unsubscribe;

    // Redirects back to the secret login page for every
    // non-authorized case (no session, unverified email, or
    // signed in but not platform_super_admin) — the dashboard
    // itself is never rendered until the guard confirms both
    // role === "platform_super_admin" AND the Firestore doc's
    // status === "active" (session.store.js already enforces
    // that before role is ever set — see auth.service.js's
    // loginPlatformSuperAdmin()). Unchanged from before —
    // only what happens in each branch below is new.
    unsubscribe = initSuperAdminGuard({

        async onAuthorized() {

            unsubscribe?.();

            await revealShell(regions);

            Loading.hide(LoadingType.SUPER_ADMIN);

        },

        onUnauthenticated() {

            unsubscribe?.();

            Loading.destroy(LoadingType.SUPER_ADMIN);

            navigate("super-admin-login");

        },

        onUnverified() {

            unsubscribe?.();

            Loading.destroy(LoadingType.SUPER_ADMIN);

            navigate("super-admin-login");

        },

        onUnauthorized() {

            unsubscribe?.();

            Loading.destroy(LoadingType.SUPER_ADMIN);

            navigate("super-admin-login");

        },

        onLoading() {

            // Session verification (Firebase Auth) has resolved,
            // role verification (Firestore) hasn't yet — the
            // skeleton from renderShellSkeleton() above is still
            // exactly what should be on screen, so there's
            // nothing to do here. This callback existing at all
            // is what keeps that skeleton up instead of anything
            // else trying to paint over it mid-verification.

        }

    });

}

/* ==========================================================
   Regions
========================================================== */

function getRegions() {

    return {

        sidebar: document.getElementById("saSidebar"),

        topbar: document.getElementById("saTopbar"),

        content: document.getElementById("saContent"),

        activityPanel: document.getElementById("saActivityPanel"),

        statusBar: document.getElementById("saStatusBar"),

        bottomNav: document.getElementById("saBottomNav")

    };

}

/* ==========================================================
   Render Skeleton (all regions, instantly)
========================================================== */

function renderShellSkeleton(regions) {

    if (regions.sidebar) {
        regions.sidebar.innerHTML = ShellSidebarSkeleton();
    } else {
        console.error("[CampusOne] Sidebar container not found.");
    }

    if (regions.topbar) {
        regions.topbar.innerHTML = ShellTopbarSkeleton();
    } else {
        console.error("[CampusOne] Topbar container not found.");
    }

    if (regions.content) {
        regions.content.innerHTML = ShellContentSkeleton();
    } else {
        console.error("[CampusOne] Content container not found.");
    }

    if (regions.activityPanel) {
        regions.activityPanel.innerHTML = ShellActivityPanelSkeleton();
    } else {
        console.error("[CampusOne] Activity Panel container not found.");
    }

    if (regions.statusBar) {
        regions.statusBar.innerHTML = ShellStatusBarSkeleton();
    } else {
        console.error("[CampusOne] Status Bar container not found.");
    }

    if (regions.bottomNav) {
        regions.bottomNav.innerHTML = ShellBottomNavSkeleton();
    } else {
        console.error("[CampusOne] Bottom Nav container not found.");
    }

}

/* ==========================================================
   Reveal Shell (skeleton -> real chrome)
   ----------------------------------------------------------
   Session + role verification just passed. Sidebar, Topbar,
   Activity Panel and Status Bar are static, already-known
   markup (no network fetch of their own) — fade their
   skeletons out, swap in the real thing, fade it in, all four
   regions together so the chrome arrives as one coordinated
   reveal instead of pieces popping in at different times.
   ----------------------------------------------------------
   Content is deliberately NOT swapped here. #saContent is
   already showing ShellContentSkeleton() (identical markup to
   what dashboard.page.js's own render() shows), so handing
   off to renderDashboard() -> router.super.js ->
   dashboard.page.js keeps that exact skeleton on screen with
   no swap of its own, then runs ITS OWN Skeleton -> Fetch ->
   Fade -> Content sequence (Phase 5) for the real Firebase
   data load. Two separate loading concerns, two separate
   owners, one continuous-looking skeleton.
========================================================== */

async function revealShell(regions) {

    await Promise.all([

        swapRegion(regions.sidebar, () => {
            initSidebar();
        }, SidebarPage),

        swapRegion(regions.topbar, () => {
            initTopbar();
        }, TopbarPage),

        swapRegion(regions.activityPanel, () => {
            initActivityPanel();
        }, ActivityPanelPage),

        swapRegion(regions.statusBar, () => {
            initStatusBar();
        }, StatusBarPage),

        swapRegion(regions.bottomNav, () => {
            initBottomNav();
        }, BottomNavPage)

    ]);

    renderDashboard(regions.content);

}

/**
 * Fade a region's skeleton out, mount its real markup, wire it
 * up, fade the real markup in. Sequential (not a simultaneous
 * crossFade) on purpose: these regions have no fixed height of
 * their own beyond what their content defines for topbar /
 * status bar / activity panel, so two absolutely-positioned
 * layers stacked on top of each other would collapse the
 * region to zero height in between. One element in normal
 * flow at a time avoids that entirely, and still delivers the
 * "Fade Skeleton Out -> Fade Dashboard In" the brief asks for.
 */
async function swapRegion(container, initReal, PageTemplate) {

    if (!container) return;

    await Animation.fadeOut(container, { hideOnFinish: false });

    container.innerHTML = PageTemplate();

    initReal();

    await Animation.fadeIn(container);

}

/* ==========================================================
   Dashboard
========================================================== */

function renderDashboard(content) {

    if (!content) {

        console.error(
            "[CampusOne] Content container not found."
        );

        return;

    }

    initSuperAdminRouter(content, {

        onNavigate(moduleId) {

            setActiveModule(moduleId);

            setActiveBottomNavItem(moduleId);

        }

    });

}
