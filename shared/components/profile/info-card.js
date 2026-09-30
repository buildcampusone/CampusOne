/**
 * ==========================================================
 * CampusOne
 * Info Card Component
 * ----------------------------------------------------------
 * Phase 8 — shared, role-agnostic. Renders a titled card of
 * read-only label/value rows. Used by Personal Information
 * and Professional Information today; any future role's
 * Profile module reuses the same component with its own
 * `items` array — only the data changes, per the Phase 8
 * architecture requirement.
 *
 * Usage:
 *   InfoCard({
 *       title: "Personal Information",
 *       icon: UserIcon(),
 *       items: [{ label: "Full Name", value: "Anita Sharma" }, ...],
 *       action: Button({ text: "Edit Profile", variant: "secondary", icon: EditIcon(), id: "editProfileBtn" })
 *   })
 * ==========================================================
 */

export function InfoCard({
    id = "",
    title = "",
    icon = "",
    items = [],
    action = ""
} = {}) {

    return /* html */ `

        <section
            ${id ? `id="${id}"` : ""}
            class="co-card co-info-card"
            aria-labelledby="${title ? toHeadingId(title) : ""}"
        >

            <div class="co-info-card-header">

                <div class="co-info-card-heading">

                    ${icon ? `<span class="co-info-card-icon" aria-hidden="true">${icon}</span>` : ""}

                    <h3 id="${toHeadingId(title)}" class="co-info-card-title">${title}</h3>

                </div>

                ${action ? `<div class="co-info-card-action">${action}</div>` : ""}

            </div>

            <dl class="co-info-list">

                ${items.map((item) => /* html */ `

                    <div class="co-info-row">

                        <dt class="co-info-label">${item.label}</dt>

                        <dd class="co-info-value">${item.value || "—"}</dd>

                    </div>

                `).join("")}

            </dl>

        </section>

    `;

}

function toHeadingId(title) {

    return `heading-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

}
