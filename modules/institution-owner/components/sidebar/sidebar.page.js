/**
 * ==========================================================
 * CampusOne
 * Institution Owner Sidebar
 * ----------------------------------------------------------
 * Enterprise Sidebar Component
 * ----------------------------------------------------------
 * Sidebar Engine Extraction
 * Mirrors modules/institution-admin/components/sidebar/
 * sidebar.page.js 1:1 — same markup structure, same class
 * contract, same navigation-renderer shape. Only the namespace
 * differs: MODULE_GROUPS / getModulesByGroup() come from this
 * shell's OWN registry (../../router/modules.registry.js), and
 * the root element this renders into is #ioSidebar (rendered by
 * shell.page.js), not #iaSidebar.
 *
 * shell.page.js already renders the sidebar ROOT element
 * (<aside id="ioSidebar" class="io-sidebar">) as the slot this
 * component mounts into — this file renders only the INNER
 * content, exactly like Institution Admin's counterpart.
 *
 * Placeholder navigation only — no business logic. Nav items
 * dispatch to whatever modules.registry.js currently lists
 * (today: just "dashboard"); more modules appear here for free
 * as they're added to the registry, no changes needed in this
 * file.
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

export function SidebarPage() {

    return /* html */ `

        <div class="io-sidebar-inner">

            <!-- ==========================================
                 Brand
            =========================================== -->

            <div class="io-sidebar-brand">

                <img
                    src="assets/logo/logo.png"
                    alt="CampusOne Logo"
                    class="io-sidebar-logo"
                >

                <div class="io-sidebar-brand-text">

                    <h2 class="io-sidebar-title">

                        CampusOne

                    </h2>

                    <span class="io-sidebar-subtitle">

                        Institution Owner

                    </span>

                </div>

                <button
                    type="button"
                    id="sidebarCollapseToggle"
                    class="io-sidebar-collapse-btn co-focus-ring"
                    aria-label="Collapse sidebar"
                    aria-expanded="true"
                >

                    ${CollapseIcon()}

                </button>

                <button
                    type="button"
                    id="sidebarMobileClose"
                    class="io-sidebar-mobile-close co-focus-ring"
                    aria-label="Close menu"
                >

                    ${CloseIcon()}

                </button>

            </div>

            <!-- ==========================================
                 Navigation
            =========================================== -->

<nav class="io-sidebar-nav" aria-label="Institution Owner sections">

    ${renderNavigation()}

</nav>

            <!-- ==========================================
                 Footer
            =========================================== -->

            <footer class="io-sidebar-footer">

                <button
                    id="logoutButton"
                    class="io-logout-btn co-focus-ring"
                    aria-label="Logout"
                >

                    ${LogoutIcon()}

                    <span class="io-logout-label">

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

            <section class="io-nav-group">

                <h3 class="io-nav-group-title">

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
            class="io-nav-item co-focus-ring ${active ? "active" : ""}"
            data-route="${route}"
            aria-label="${label}${isSoon ? " (coming soon)" : ""}"
            aria-current="${active ? "page" : "false"}"
        >

            <span class="io-nav-active-indicator" aria-hidden="true"></span>

            <span
                class="io-nav-icon"
                aria-hidden="true"
            >

                ${icon}

            </span>

            <span class="io-nav-label">

                ${label}

            </span>

            ${isSoon ? `
            <span class="io-nav-soon-badge">
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
        <svg class="io-collapse-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
        </svg>
    `;

}
