/**
 * ==========================================================
 * CampusOne
 * Super Admin Sidebar
 * ----------------------------------------------------------
 * Enterprise Sidebar Component
 * ----------------------------------------------------------
 * NOTE (Phase 2B.1 audit fix):
 * shell.page.js already renders the sidebar ROOT element
 * (<aside id="saSidebar" class="sa-sidebar">) as the slot
 * this component mounts into. Previously this file rendered
 * a SECOND <aside class="sa-sidebar"> inside that slot,
 * producing two nested elements with the identical class —
 * harmless-looking, but it meant there was no single element
 * the controller could treat as "the sidebar" for animation,
 * collapse, and focus-trap purposes. This file now renders
 * only the INNER content; #saSidebar (from shell.page.js) is
 * the one true sidebar root.
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

export function SidebarPage() {

    return /* html */ `

        <div class="sa-sidebar-inner">

            <!-- ==========================================
                 Brand
            =========================================== -->

            <div class="sa-sidebar-brand">

                <img
                    src="assets/logo/logo.png"
                    alt="CampusOne Logo"
                    class="sa-sidebar-logo"
                >

                <div class="sa-sidebar-brand-text">

                    <h2 class="sa-sidebar-title">

                        CampusOne

                    </h2>

                    <span class="sa-sidebar-subtitle">

                        Super Admin

                    </span>

                </div>

                <button
                    type="button"
                    id="sidebarCollapseToggle"
                    class="sa-sidebar-collapse-btn"
                    aria-label="Collapse sidebar"
                    aria-expanded="true"
                >

                    ${CollapseIcon()}

                </button>

                <button
                    type="button"
                    id="sidebarMobileClose"
                    class="sa-sidebar-mobile-close"
                    aria-label="Close menu"
                >

                    ${CloseIcon()}

                </button>

            </div>

            <!-- ==========================================
                 Navigation
            =========================================== -->

<nav class="sa-sidebar-nav" aria-label="Super Admin sections">

    ${renderNavigation()}

</nav>

            <!-- ==========================================
                 Footer
            =========================================== -->

            <footer class="sa-sidebar-footer">

                <button
                    id="logoutButton"
                    class="sa-logout-btn"
                    aria-label="Logout"
                >

                    ${LogoutIcon()}

                    <span class="sa-logout-label">

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

function renderNavigation() {

    return MODULE_GROUPS.map((group) => {

        const modules = getModulesByGroup(group.id);

        if (!modules.length) return "";

        return /* html */ `

            <section class="sa-nav-group">

                <h3 class="sa-nav-group-title">

                    ${group.label}

                </h3>

                ${modules.map((module) => {

                    return navItem(

                        module.icon(),

                        module.label,

                        module.id,

                        module.id === "home"

                    );

                }).join("")}

            </section>

        `;

    }).join("");

}

/* ==========================================================
   Navigation Item
========================================================== */

function navItem(
    icon,
    label,
    route,
    active = false
) {

    return /* html */ `

        <button
            type="button"
            class="sa-nav-item ${active ? "active" : ""}"
            data-route="${route}"
            aria-label="${label}"
            aria-current="${active ? "page" : "false"}"
        >

            <span class="sa-nav-active-indicator" aria-hidden="true"></span>

            <span
                class="sa-nav-icon"
                aria-hidden="true"
            >

                ${icon}

            </span>

            <span class="sa-nav-label">

                ${label}

            </span>

        </button>

    `;

}

/* ==========================================================
   Collapse Icon (inline — desktop rail toggle only, scoped
   to this component so it isn't a shared-icon-library churn)
========================================================== */

function CollapseIcon() {

    return /* html */ `
        <svg class="sa-collapse-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
        </svg>
    `;

}
