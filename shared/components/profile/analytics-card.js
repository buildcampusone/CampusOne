/**
 * ==========================================================
 * CampusOne
 * Analytics Card Component
 * ----------------------------------------------------------
 * Phase 8 — shared, role-agnostic. Small stat tile used by
 * the Profile module's "Quick Statistics" section. Mirrors
 * the Dashboard's `.ia-kpi-card` visual language (icon badge
 * + label + value) but lives here as a shared component so
 * every role's Profile module can reuse it without importing
 * from the Institution Admin dashboard module.
 *
 * Usage:
 *   AnalyticsCard({ icon: UsersIcon(), label: "Students Managed", value: "—" })
 * ==========================================================
 */

export function AnalyticsCard({
    id = "",
    icon = "",
    label = "",
    value = "—",
    accent = "default",
    trend = null
} = {}) {

    // Only a real numeric value (never the "—" placeholder) gets a
    // data-numeric attribute — that's what tells the page's counter
    // wiring there's something honest to animate. Placeholder text
    // never gets faked into a number here.
    const numericValue = typeof value === "number" && !Number.isNaN(value) ? value : null;

    return /* html */ `

        <div
            ${id ? `id="${id}"` : ""}
            class="co-card co-analytics-card co-card-hover co-analytics-card--${accent}"
        >

            <div class="co-analytics-icon" aria-hidden="true">

                ${icon}

            </div>

            <div class="co-analytics-body">

                <div class="co-analytics-value-row">

                    <span class="co-analytics-value" ${numericValue !== null ? `data-numeric="${numericValue}"` : ""}>${value}</span>

                    ${trend ? `<span class="co-analytics-trend co-analytics-trend--${trend.direction === "down" ? "down" : "up"}">${trend.direction === "down" ? "▼" : "▲"} ${trend.text}</span>` : ""}

                </div>

                <span class="co-analytics-label">${label}</span>

            </div>

        </div>

    `;

}
