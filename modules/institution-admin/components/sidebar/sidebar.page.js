/**
 * ==========================================================
 * CampusOne
 * Institution Admin Sidebar
 * ----------------------------------------------------------
 * Enterprise Sidebar Component
 * ----------------------------------------------------------
 * Part 4.1 — Sidebar Reuse
 * Mirrors modules/super-admin/components/sidebar/sidebar.page.js
 * 1:1 — same markup structure, same class contract, same
 * navigation-renderer shape. Only the namespace differs:
 * MODULE_GROUPS / getModulesByGroup() come from this shell's
 * OWN registry (../../router/modules.registry.js), and the
 * root element this renders into is #iaSidebar (rendered by
 * shell.page.js), not #saSidebar.
 *
 * shell.page.js already renders the sidebar ROOT element
 * (<aside id="iaSidebar" class="ia-sidebar">) as the slot
 * this component mounts into — this file renders only the
 * INNER content, exactly like its Super Admin counterpart.
 *
 * Placeholder navigation only — no business logic. Nav items
 * dispatch to whatever modules.registry.js currently lists
 * (today: just "dashboard"); more modules appear here for
 * free as they're added to the registry, no changes needed
 * in this file.
 * ==========================================================
 */

import {
    MODULE_GROUPS,
    getModulesByGroup
} from "../../router/modules.registry.js";

import {
    LogoutIcon,
    CloseIcon
} from "../../../../shared/components/icons/index.js";

import {
    Badge
} from "../../../../shared/components/badge/badge.js";

import {
    authorize
} from "../../../../shared/services/permission.service.js";

import {
    MODULE_PERMISSIONS
} from "../../../../shared/constants/permissions.js";

// Phase C / R4 — userProfile (threaded in since R1 by
// shell.controller.js's renderSidebar()) is now actually read:
// renderNavigation() filters out unauthorized "ready" modules so
// Sidebar and Router (router.institution.js) can never disagree
// about what's accessible. "soon" modules are untouched — they
// keep appearing with the Soon badge exactly as before, for every
// user, regardless of permissions.
export function SidebarPage(userProfile = null) {

    return /* html */ `

        <div class="ia-sidebar-inner">

            <!-- ==========================================
                 Brand
            =========================================== -->

            <div class="ia-sidebar-brand">

                <img
                    src="assets/logo/logo.png"
                    alt="CampusOne Logo"
                    class="ia-sidebar-logo"
                >

                <div class="ia-sidebar-brand-text">

                    <h2 class="ia-sidebar-title">

                        CampusOne

                    </h2>

                    <span class="ia-sidebar-subtitle">

                        Institution Admin

                    </span>

                </div>

                <button
                    type="button"
                    id="sidebarCollapseToggle"
                    class="ia-sidebar-collapse-btn co-focus-ring"
                    aria-label="Collapse sidebar"
                    aria-expanded="true"
                >

                    ${CollapseIcon()}

                </button>

                <button
                    type="button"
                    id="sidebarMobileClose"
                    class="ia-sidebar-mobile-close co-focus-ring"
                    aria-label="Close menu"
                >

                    ${CloseIcon()}

                </button>

            </div>

            <!-- ==========================================
                 Navigation
            =========================================== -->

<nav class="ia-sidebar-nav" aria-label="Institution Admin sections">

    ${renderNavigation(userProfile)}

</nav>

            <!-- ==========================================
                 Footer
            =========================================== -->

            <footer class="ia-sidebar-footer">

                <button
                    id="logoutButton"
                    class="ia-logout-btn co-focus-ring"
                    aria-label="Logout"
                >

                    ${LogoutIcon()}

                    <span class="ia-logout-label">

                        Logout

                    </span>

                </button>

            </footer>

        </div>

    `;

}

/* ==========================================================
   Navigation Renderer
========================================================== */

function renderNavigation(userProfile) {

    return MODULE_GROUPS.map((group) => {

        const modules = getModulesByGroup(group.id)
            .filter((module) => isModuleVisible(module, userProfile));

        if (!modules.length) return "";

        return /* html */ `

            <section class="ia-nav-group">

                <h3 class="ia-nav-group-title">

                    ${group.label}

                </h3>

                ${modules.map((module) => {

                    return navItem(

                        module.icon(),

                        module.label,

                        module.id,

                        module.id === "dashboard",

                        module.status

                    );

                }).join("")}

            </section>

        `;

    }).join("");

}

/* ==========================================================
   Authorization Gate
   ----------------------------------------------------------
   Phase C / R4 — mirrors router.institution.js's own
   isModuleAuthorized() decision exactly, so Sidebar and Router
   can never disagree about the same module id:

     - "soon" modules are always visible (unchanged — the
       Router's own gate only ever runs for `status === "ready"`
       modules too).
     - "ready" modules that aren't part of the delegable
       MODULE_PERMISSIONS vocabulary (e.g. a future non-delegable
       "ready" entry) stay visible, same as the Router's
       fallback for ids like "profile".
     - "ready" + permission-based modules are shown only when
       authorize() — the single shared permission engine also
       used by the Router — says yes.

   router.institution.js exports no reusable version of this
   gate check today (R4 doesn't modify that file), so the id
   membership check below is duplicated as a one-line mirror;
   the actual yes/no verdict always comes from authorize(),
   never re-derived here.
========================================================== */

function isModuleVisible(module, userProfile) {

    if (module.status !== "ready") return true;

    if (!Object.values(MODULE_PERMISSIONS).includes(module.id)) return true;

    return authorize(userProfile, module.id);

}

/* ==========================================================
   Navigation Item
========================================================== */

function navItem(
    icon,
    label,
    route,
    active = false,
    status = "ready"
) {

    const isSoon = status !== "ready";

    return /* html */ `

        <button
            type="button"
            class="ia-nav-item co-focus-ring ${active ? "active" : ""}"
            data-route="${route}"
            aria-label="${label}${isSoon ? " (coming soon)" : ""}"
            aria-current="${active ? "page" : "false"}"
        >

            <span class="ia-nav-active-indicator" aria-hidden="true"></span>

            <span
                class="ia-nav-icon"
                aria-hidden="true"
            >

                ${icon}

            </span>

            <span class="ia-nav-label">

                ${label}

            </span>

            ${isSoon ? `
            <span class="ia-nav-soon-badge">
                ${Badge({ text: "Soon", variant: "neutral" })}
            </span>
            ` : ""}

        </button>

    `;

}

/* ==========================================================
   Collapse Icon (inline — desktop rail toggle only, scoped
   to this component so it isn't a shared-icon-library churn)
========================================================== */

function CollapseIcon() {

    return /* html */ `
        <svg class="ia-collapse-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
        </svg>
    `;

}
