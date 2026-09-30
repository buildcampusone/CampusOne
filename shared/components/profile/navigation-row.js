/**
 * ==========================================================
 * CampusOne
 * Navigation Row Component
 * ----------------------------------------------------------
 * Phase 8.2 — shared, role-agnostic. A single tappable row
 * used inside Account & Security / Help & Support style
 * sections: icon + label (+ optional sublabel/value) + a
 * trailing chevron. Every role's Profile module reuses this
 * with its own `items` array from the controller — only the
 * data changes, per the Phase 8 architecture requirement.
 *
 * No dead clicks: the caller is expected to bind a click
 * handler (by `id`) even when the destination isn't built yet
 * — same convention as Edit Profile's "coming soon" toast.
 *
 * Usage:
 *   NavigationRow({ id: "navChangePassword", icon: LockIcon(), label: "Change Password", sublabel: "Last changed —" })
 * ==========================================================
 */

import { ChevronDownIcon } from "../icons/index.js";

export function NavigationRow({
    id = "",
    icon = "",
    label = "",
    sublabel = "",
    value = "",
    tone = "default"
} = {}) {

    return /* html */ `

        <button
            type="button"
            ${id ? `id="${id}"` : ""}
            class="co-nav-row"
            data-tone="${tone}"
        >

            <span class="co-nav-row-main">

                ${icon ? `<span class="co-nav-row-icon" aria-hidden="true">${icon}</span>` : ""}

                <span class="co-nav-row-text">

                    <span class="co-nav-row-label">${label}</span>

                    ${sublabel ? `<span class="co-nav-row-sublabel">${sublabel}</span>` : ""}

                </span>

            </span>

            <span class="co-nav-row-end">

                ${value ? `<span class="co-nav-row-value">${value}</span>` : ""}

                <span class="co-nav-row-chevron" aria-hidden="true">${ChevronDownIcon()}</span>

            </span>

        </button>

    `;

}
