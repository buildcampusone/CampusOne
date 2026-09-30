/**
 * ==========================================================
 * CampusOne
 * Super Admin Dashboard
 * ----------------------------------------------------------
 * Dashboard Home
 *
 * Phase 5 — JS Render Integration
 * ----------------------------------------------------------
 * Wires the Loading Engine (shared/core/loading) and the
 * Animation Engine (shared/core/animation) — both built in
 * Phase 3 but never actually called from a real page — into
 * this module's render() cycle:
 *
 *   Render Skeleton -> Fetch Data -> Fade Skeleton -> Render Real UI
 *
 * render() is what router.super.js's navigateToModule() calls
 * for the "home" module (LOADERS.home in router.super.js). It
 * is async so the router's `await moduleExports.render(...)`
 * naturally waits for the whole sequence, and its return value
 * (destroyDashboard) becomes activeDestroy for teardown on the
 * next module switch — same contract every other module in
 * modules.registry.js already follows.
 * ==========================================================
 */

import {
    fetchDashboardData,
    populateDashboard,
    destroyDashboard
} from "./dashboard.controller.js";

import { ShellContentSkeleton } from "../../../shared/components/skeleton/shell/shell.skeleton.js";

import { Loading } from "../../../shared/core/loading/loading.service.js";
import { LoadingType } from "../../../shared/core/loading/loading.types.js";

import { Animation } from "../../../shared/core/animation/animation.service.js";

/* ==========================================================
   Dashboard Template (Real UI)
========================================================== */

export function DashboardHomePage() {

    return /* html */ `

        <section class="sa-dashboard">

            <!-- Welcome -->

            <section class="sa-dashboard-banner">

                <div>

                    <h2>

                        Welcome Back

                    </h2>

                    <p>

                        Here's what's happening across CampusOne today.

                    </p>

                </div>

            </section>

            <!-- KPI Cards -->

            <section class="sa-kpi-grid">

                <div id="institutionsCard"></div>

                <div id="usersCard"></div>

                <div id="revenueCard"></div>

                <div id="activityCard"></div>

            </section>

            <!-- Analytics -->

            <section class="sa-dashboard-grid">

                <div id="institutionOverview"></div>

                <div id="recentActivities"></div>

            </section>

            <!-- Quick Actions -->

            <section id="quickActions"></section>

        </section>

    `;

}

/* ==========================================================
   Error State
========================================================== */

function DashboardErrorState() {

    return /* html */ `

        <div class="sa-dashboard-card" style="margin:28px;">

            Failed to load dashboard.

        </div>

    `;

}

/* ==========================================================
   Router Renderer
   ----------------------------------------------------------
   1. Render Skeleton  — ShellContentSkeleton() paints instantly,
                          before any network call starts. Same
                          composition shell.controller.js shows
                          pre-auth, so the hand-off from "shell
                          still verifying" to "dashboard module
                          now fetching" is pixel-identical.
   2. Fetch Data       — fetchDashboardData() (Promise, will be
                          Firestore later) runs while the
                          skeleton is on screen.
   3. Fade Skeleton     — Animation.fadeOut() once data is back.
   4. Render Real UI    — real markup mounts, populateDashboard()
                          fills it, Animation.fadeIn() brings it
                          in.
========================================================== */

export async function render(workspace) {

    if (!workspace) {

        console.error(
            "[CampusOne] Dashboard workspace not found."
        );

        return destroyDashboard;

    }

    /* ------------------------------------------------------
       1. Render Skeleton
    ------------------------------------------------------ */

    workspace.innerHTML = `

        <div id="dashboardSkeletonWrap">

            ${ShellContentSkeleton()}

        </div>

    `;

    const skeletonEl = document.getElementById("dashboardSkeletonWrap");

    Loading.show(LoadingType.DASHBOARD);

    try {

        /* ----------------------------------------------------
           2. Fetch Data
        ---------------------------------------------------- */

        const data = await fetchDashboardData();

        // The router may have already navigated away from
        // "home" while this await was pending (fast module
        // switch) — the workspace no longer belongs to us, so
        // stop before touching the DOM.
        if (!document.getElementById("dashboardSkeletonWrap")) {
            return destroyDashboard;
        }

        /* ----------------------------------------------------
           3. Fade Skeleton
        ---------------------------------------------------- */

        await Animation.fadeOut(skeletonEl, { hideOnFinish: false });

        /* ----------------------------------------------------
           4. Render Real UI
        ---------------------------------------------------- */

        workspace.innerHTML = DashboardHomePage();

        const contentEl = workspace.querySelector(".sa-dashboard");

        populateDashboard(data);

        await Animation.fadeIn(contentEl);

    } catch (error) {

        console.error(

            "[CampusOne] Dashboard Error:",

            error

        );

        workspace.innerHTML = DashboardErrorState();

    } finally {

        Loading.hide(LoadingType.DASHBOARD);

    }

    return destroyDashboard;

}
