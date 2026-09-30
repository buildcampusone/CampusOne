/**
 * ==========================================================
 * CampusOne
 * Activity Item Component
 * ----------------------------------------------------------
 * Phase 8.2 — shared, role-agnostic. A single entry inside
 * "My Activity": icon + description + a timestamp. Every
 * role's Profile module reuses this with its own `items`
 * array from the controller — only the data changes.
 *
 * Usage:
 *   ActivityItem({ icon: ClockIcon(), text: "Logged in from Chrome on Windows", timestamp: "2 hours ago" })
 * ==========================================================
 */

export function ActivityItem({
    icon = "",
    text = "",
    timestamp = ""
} = {}) {

    return /* html */ `

        <div class="co-activity-item">

            ${icon ? `<span class="co-activity-icon" aria-hidden="true">${icon}</span>` : ""}

            <span class="co-activity-body">

                <span class="co-activity-text">${text}</span>

                ${timestamp ? `<span class="co-activity-time">${timestamp}</span>` : ""}

            </span>

        </div>

    `;

}
