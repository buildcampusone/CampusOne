/**
 * ==========================================================
 * CampusOne
 * Institution Owner — Institution Admin Management
 * Administrator Card (Presentation Layer)
 * ----------------------------------------------------------
 * Phase 5.1.3 — Institution Administrator Directory (Step 4)
 *
 * Pure presentation only — no DOM queries, no event listeners,
 * no fetching, no query-state access. Takes one admin record
 * (the exact shape fetchAdminDirectory() resolves — a
 * mock-admins.js entry today, a Firestore document tomorrow)
 * and returns a markup string. admin-management.page.js (Step
 * 5) is the only thing that calls AdministratorCard(), injects
 * the result into the Directory container for each row, and
 * wires up the actions-menu trigger this file only renders —
 * inert on purpose, per "Actions menu (UI only)" in the phase
 * plan.
 *
 * Composed from existing shared components rather than
 * reinventing markup — same reuse-first pattern
 * admin-management.page.js's own header comment describes for
 * the summary cards/skeleton:
 *   - Avatar()  (shared/components/avatar) for the identity photo/monogram
 *   - Badge()   (shared/components/badge)  for the department tag and,
 *               via StatusBadge() below, the status pill
 *   - Icon library (shared/components/icons) for meta-row glyphs
 *
 * Phase 5.1.6 — Administrator Actions UI: the menu trigger now
 * renders its own dropdown panel (Edit Details, plus Suspend or
 * Activate depending on `status`) instead of being inert. This
 * file still only renders markup — no click/keydown listener
 * lives here. admin-management.actions.js (a new, page-scoped
 * file, not this one) owns opening/closing the panel and
 * dispatching each `data-menu-action` to the real
 * suspendAdministrator()/activateAdministrator()/
 * updateAdministratorProfile() controller calls. The `data-*`
 * attributes on `.iam-admin-card-menu-wrap` exist so that
 * handler never needs its own copy of this row's data — it
 * reads the same fields this card already rendered from.
 *
 * Still explicitly OUT of scope in this file:
 *   - Deleting an admin — no such action exists in this phase
 *   - The directory grid/list container and its empty/error
 *     states — already owned by admin-management.page.js's
 *     DirectorySkeleton()/DirectoryEmptyState()
 * ==========================================================
 */

import { Avatar } from "../../../shared/components/avatar/avatar.js";
import { Badge } from "../../../shared/components/badge/badge.js";

import {
    BuildingIcon,
    ClockIcon,
    CalendarIcon,
    MoreIcon
} from "../../../shared/components/icons/index.js";

import { USER_STATUS } from "../../../shared/constants/status.js";

/* ==========================================================
   Status -> Badge Presentation
   ----------------------------------------------------------
   Maps the real USER_STATUS enum (shared/constants/status.js —
   the same values mock-admins.js/admin-directory.filters.js
   already use) to a label + Badge() variant. An unrecognized
   status still renders — as a neutral badge showing the raw
   value — rather than throwing, matching sortAdmins()' own
   "never break the render" default in
   admin-directory.filters.js.
========================================================== */

function escapeAttr(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

}

const STATUS_BADGE_MAP = Object.freeze({
    [USER_STATUS.ACTIVE]: { label: "Active", variant: "success" },
    [USER_STATUS.PENDING]: { label: "Pending", variant: "warning" },
    [USER_STATUS.SUSPENDED]: { label: "Suspended", variant: "danger" },
    [USER_STATUS.BLOCKED]: { label: "Blocked", variant: "danger" },
    [USER_STATUS.DELETED]: { label: "Deleted", variant: "neutral" }
});

/**
 * Status pill for one admin record. Exported on its own (not
 * just inlined in AdministratorCard()) so a future summary/
 * filter surface can render the exact same badge without
 * duplicating this mapping.
 *
 * @param {string} status one of USER_STATUS's values
 * @returns {string} HTML
 */
export function StatusBadge(status) {

    const config = STATUS_BADGE_MAP[status] ?? {
        label: status || "Unknown",
        variant: "neutral"
    };

    return Badge({ text: config.label, variant: config.variant });

}

/**
 * One Administrator Directory row. Reads only the fields
 * mock-admins.js/create-admin.controller.js's buildPayload()
 * already establish (fullName, designation, email, department,
 * status, lastLogin, createdAt) — nothing here assumes
 * permissions, institutionId, or any field the doc comment in
 * admin-management.controller.js marks "not designed yet".
 *
 * @param {object} admin a record from fetchAdminDirectory()'s
 *   resolved `admins` array
 * @returns {string} HTML
 */
export function AdministratorCard(admin = {}) {

    const {
        id = "",
        fullName = "",
        designation = "",
        email = "",
        mobile = "",
        department = "",
        status = "",
        lastLogin = null,
        createdAt = null
    } = admin;

    return /* html */ `

        <div
            class="co-card iam-admin-card"
            role="listitem"
            data-admin-id="${id}"
        >

            <div class="iam-admin-card-top">

                <div class="iam-admin-identity">

                    ${Avatar({ name: fullName, size: "md" })}

                    <div class="iam-admin-identity-text">

                        <p class="iam-admin-name">${fullName}</p>

                        ${
                            designation
                                ? `<p class="iam-admin-designation">${designation}</p>`
                                : ""
                        }

                    </div>

                </div>

                <div
                    class="iam-admin-card-menu-wrap"
                    data-admin-id="${id}"
                    data-full-name="${escapeAttr(fullName)}"
                    data-designation="${escapeAttr(designation)}"
                    data-mobile="${escapeAttr(mobile)}"
                    data-department="${escapeAttr(department)}"
                    data-status="${escapeAttr(status)}"
                >

                    <button
                        type="button"
                        class="iam-admin-card-menu-btn co-ripple-surface"
                        aria-label="More actions for ${fullName || "this administrator"}"
                        aria-haspopup="menu"
                        aria-expanded="false"
                        aria-controls="iamAdminMenu-${id}"
                        data-admin-id="${id}"
                    >

                        ${MoreIcon()}

                    </button>

                    <div
                        id="iamAdminMenu-${id}"
                        class="iam-admin-card-menu"
                        role="menu"
                        aria-label="Actions for ${fullName || "this administrator"}"
                        hidden
                    >

                        <button
                            type="button"
                            class="iam-admin-card-menu-item"
                            role="menuitem"
                            data-menu-action="edit"
                        >

                            Edit Details

                        </button>

                        ${
                            status === USER_STATUS.ACTIVE
                                ? `
                                    <button
                                        type="button"
                                        class="iam-admin-card-menu-item iam-admin-card-menu-item--danger"
                                        role="menuitem"
                                        data-menu-action="suspend"
                                    >

                                        Suspend

                                    </button>
                                `
                                : status === USER_STATUS.SUSPENDED || status === USER_STATUS.PENDING
                                    ? `
                                        <button
                                            type="button"
                                            class="iam-admin-card-menu-item"
                                            role="menuitem"
                                            data-menu-action="activate"
                                        >

                                            Activate

                                        </button>
                                    `
                                    : ""
                        }

                    </div>

                </div>

            </div>

            ${email ? `<p class="iam-admin-email">${email}</p>` : ""}

            <div class="iam-admin-card-tags">

                ${
                    department
                        ? Badge({
                            text: department,
                            variant: "neutral",
                            icon: BuildingIcon()
                        })
                        : ""
                }

                ${StatusBadge(status)}

            </div>

            <div class="iam-admin-card-meta">

                <span class="iam-admin-meta-item">

                    <span class="iam-admin-meta-icon" aria-hidden="true">${ClockIcon()}</span>

                    Last login: ${formatLastLogin(lastLogin)}

                </span>

                <span class="iam-admin-meta-item">

                    <span class="iam-admin-meta-icon" aria-hidden="true">${CalendarIcon()}</span>

                    Created ${formatCreatedDate(createdAt)}

                </span>

            </div>

        </div>

    `;

}

/* ==========================================================
   Local Date Formatting
   ----------------------------------------------------------
   Deliberately local to this file, not imported from
   shared/services/pdf/engine/helpers.js's formatDate() (PDF-
   engine-namespaced, a different concern) or
   dashboard.controller.js's formatRelativeTime() (that one
   expects a Firestore Timestamp's `.toDate()`, not the ISO
   string mock-admins.js/createAdminPayload() currently use).
   Same "en-IN", short-month convention the rest of the app's
   date output already follows, so 5.1.4's switch to Firestore
   Timestamps only changes the `new Date(...)` construction
   below, not the formatting itself.
========================================================== */

function formatCreatedDate(isoString) {

    if (!isoString) return "—";

    return new Date(isoString).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

}

function formatLastLogin(isoString) {

    if (!isoString) return "Never";

    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.max(0, Math.round(diffMs / 1000));

    if (diffSec < 60) return "Just now";

    const diffMin = Math.round(diffSec / 60);
    if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;

    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;

    const diffDay = Math.round(diffHr / 24);
    if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;

    const diffMonth = Math.round(diffDay / 30);
    if (diffMonth < 12) return `${diffMonth} month${diffMonth === 1 ? "" : "s"} ago`;

    const diffYear = Math.round(diffMonth / 12);
    return `${diffYear} year${diffYear === 1 ? "" : "s"} ago`;

}
