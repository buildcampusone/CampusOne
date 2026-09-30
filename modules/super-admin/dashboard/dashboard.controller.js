/**
 * ==========================================================
 * CampusOne
 * Super Admin Dashboard Controller
 * ----------------------------------------------------------
 * Owns Dashboard *data* — fetching it and painting it into
 * the already-mounted DOM. It does NOT own the Skeleton ->
 * Fade -> Content sequence; that orchestration lives in
 * dashboard.page.js's render(), which is what the Super Admin
 * Sub-Router (router.super.js) actually calls.
 *
 * Phase 5 — JS Render Integration
 * ----------------------------------------------------------
 * Split on purpose:
 *   dashboard.page.js       -> WHEN to show skeleton vs content
 *                              (Loading Engine + Animation Engine)
 *   dashboard.controller.js -> WHAT the content is
 *                              (fetch data, fill the DOM)
 * ==========================================================
 */

import { Counter } from "../../../shared/core/counter/counter.service.js";
import { CounterFormat } from "../../../shared/core/counter/counter.types.js";

/* ==========================================================
   Data Provider
========================================================== */

/**
 * Stands in for a Firestore round trip. Deliberately async and
 * Promise-based (not a synchronous return) so the skeleton
 * shown by dashboard.page.js has something real to wait on —
 * swap the body of this function for the actual Firestore
 * query later (e.g. DashboardService.getDashboard()) and every
 * caller (render(), Loading.show/hide, the fade sequence)
 * keeps working unchanged, since they only ever depend on the
 * returned Promise, never on how it's fulfilled.
 */
export async function fetchDashboardData() {

    // TODO
    // Replace with DashboardService.getDashboard()
    // Future: Fetch institutions/users/revenue/activity
    // counts from Firestore.

    await _simulateNetworkLatency();

    return {

        institutions: 0,

        users: 0,

        revenue: 0,

        activeToday: 0

    };

}

function _simulateNetworkLatency(ms = 600) {

    return new Promise((resolve) => setTimeout(resolve, ms));

}

/* ==========================================================
   Populate (DOM must already be mounted)
========================================================== */

export function populateDashboard(data) {

    if (!document.getElementById("institutionsCard")) {

        console.error(
            "[CampusOne] Dashboard DOM not mounted."
        );

        return;

    }

    renderKPICards(data);

    renderInstitutionOverview(data);

    renderRecentActivities(data);

    renderQuickActions();

}

/* ==========================================================
   Destroy
   ----------------------------------------------------------
   Returned by dashboard.page.js's render() as activeDestroy —
   router.super.js calls this on every module switch away from
   "home". Nothing to tear down yet (no listeners/timers are
   left running once fetchDashboardData() resolves), but the
   hook exists so future additions (realtime Firestore
   listeners, polling, etc.) have a guaranteed cleanup point
   instead of leaking after navigation.
========================================================== */

export function destroyDashboard() {

    // Stop any counters that are still observing/mid-animation —
    // otherwise a fast module switch leaves an IntersectionObserver
    // watching (or a rAF loop writing into) a card that's no longer
    // in the DOM.
    KPI_VALUE_IDS.forEach((id) => {

        const el = document.getElementById(id);

        if (el) Counter.disconnect(el);

    });

    // Future: unsubscribe realtime listeners here.

}

/* ==========================================================
   KPI Cards
   ----------------------------------------------------------
   The card ids below (KPI_VALUE_IDS) are the numeral element
   each card mounts internally — destroyDashboard() uses this
   same list to disconnect every counter on teardown, so it
   must stay in sync with what renderKPICards() actually mounts.
========================================================== */

const KPI_VALUE_IDS = [
    "institutionsCardValue",
    "usersCardValue",
    "revenueCardValue",
    "activityCardValue"
];

function renderKPICards(data) {

    renderCard(

        "institutionsCard",

        "Institutions",

        data.institutions

    );

    renderCard(

        "usersCard",

        "Users",

        data.users

    );

    renderCard(

        "revenueCard",

        "Revenue",

        data.revenue,

        { format: CounterFormat.CURRENCY, prefix: "₹" }

    );

    renderCard(

        "activityCard",

        "Active Today",

        data.activeToday

    );

}

/* ==========================================================
   Shared Card
   ----------------------------------------------------------
   Mounts the card shell synchronously (so there's zero layout
   shift the instant this runs), then hands the numeral span to
   the Counter service. Counter.observe() reserves that span's
   final width immediately and only starts counting once the
   card actually scrolls into view — see counter.engine.js.
========================================================== */

function renderCard(

    id,

    title,

    value,

    counterOptions = {}

) {

    const element = document.getElementById(id);

    if (!element) {

        console.warn(
            `[CampusOne] Missing dashboard element: ${id}`
        );

        return;

    }

    const valueId = `${id}Value`;

    element.innerHTML = `

        <div class="sa-dashboard-card">

            <span class="sa-card-label">

                ${title}

            </span>

            <h2 class="sa-card-value" id="${valueId}"></h2>

        </div>

    `;

    // Guard against non-numeric/undefined data (e.g. a field the
    // Firestore migration hasn't wired up yet) — fall back to a
    // plain static render rather than animating toward NaN.
    const numericValue = Number(value);

    const valueEl = document.getElementById(valueId);

    if (Number.isFinite(numericValue)) {

        Counter.observe(valueEl, numericValue, counterOptions);

    } else if (valueEl) {

        valueEl.textContent = value;

    }

}

/* ==========================================================
   Institution Overview
========================================================== */

function renderInstitutionOverview() {

    const element = document.getElementById(

        "institutionOverview"

    );

    if (!element) return;

    element.innerHTML = `

        <div class="sa-dashboard-card">

            <h3>

                Institution Overview

            </h3>

            <p>

                Data will be loaded from Firestore.

            </p>

        </div>

    `;

}

/* ==========================================================
   Recent Activities
========================================================== */

function renderRecentActivities() {

    const element = document.getElementById(

        "recentActivities"

    );

    if (!element) return;

    element.innerHTML = `

        <div class="sa-dashboard-card">

            <h3>

                Recent Activities

            </h3>

            <p>

                Activity feed will appear here.

            </p>

        </div>

    `;

}

/* ==========================================================
   Quick Actions
========================================================== */

function renderQuickActions() {

    const element = document.getElementById(

        "quickActions"

    );

    if (!element) return;

    element.innerHTML = `

        <div class="sa-dashboard-card">

            <h3>

                Quick Actions

            </h3>

            <p>

                Shortcuts will be available here.

            </p>

        </div>

    `;

}

/* ==========================================================
   Future
========================================================== */

// Future
// DashboardService
// Charts
// Firestore
// Realtime
// Caching
