/**
 * ==========================================================
 * CampusOne
 * Permission Row Component
 * ----------------------------------------------------------
 * Phase 8.2 — shared, role-agnostic. A single row inside the
 * "My Permissions" section: icon + module label + a status
 * badge (e.g. "Granted" / "Restricted" / "—" when no access
 * data is wired yet). Every role's Profile module reuses this
 * with its own `items` array — only the data changes.
 *
 * Usage:
 *   PermissionRow({ icon: CheckIcon(), label: "Student Management", status: "Granted" })
 * ==========================================================
 */

import { Badge } from "../badge/badge.js";

function statusVariant(status) {

    if (status === "Granted") return "success";
    if (status === "Restricted") return "neutral";

    return "neutral";

}

export function PermissionRow({
    icon = "",
    label = "",
    status = "—"
} = {}) {

    return /* html */ `

        <div class="co-permission-row">

            <span class="co-permission-main">

                ${icon ? `<span class="co-permission-icon" aria-hidden="true">${icon}</span>` : ""}

                <span class="co-permission-label">${label}</span>

            </span>

            ${Badge({ text: status, variant: statusVariant(status) })}

        </div>

    `;

}
