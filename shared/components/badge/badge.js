/**
 * ==========================================================
 * CampusOne
 * Badge Component
 * ----------------------------------------------------------
 * Phase 8 — shared, role-agnostic small pill used for status/
 * identity tags: "Institution Admin", "Verified", "Granted" /
 * "Restricted" (My Permissions), etc. One component, semantic
 * variants only — never a one-off styled <span> per screen.
 *
 * Usage:
 *   Badge({ text: "Institution Admin", variant: "role" })
 *   Badge({ text: "Verified", variant: "verified", icon: ShieldCheckIcon() })
 * ==========================================================
 */

export function Badge({
    text = "",
    variant = "neutral",
    icon = ""
} = {}) {

    return /* html */ `

        <span class="co-badge co-badge--${variant}">

            ${icon ? `<span class="co-badge-icon" aria-hidden="true">${icon}</span>` : ""}

            <span class="co-badge-text">${text}</span>

        </span>

    `;

}
