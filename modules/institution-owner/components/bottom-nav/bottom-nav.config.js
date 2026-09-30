/**
 * ==========================================================
 * CampusOne
 * Institution Owner — Bottom Navigation Configuration
 * ----------------------------------------------------------
 * Premium Mobile Bottom Navigation (UI-only pass).
 * The ONLY Institution-Owner-specific piece of the bottom
 * nav — markup (bottom-nav.page.js), styling (bottom-nav.css)
 * and click/active-state behaviour (bottom-nav.controller.js,
 * wired to the shared engine at
 * shared/core/navigation/bottom-nav.engine.js) all stay
 * generic; only this file describes what Owner's five items
 * are.
 *
 * Fixed 5-item set per the brief:
 *   - "dashboard" and "institution" are type "route". Their
 *     ids match modules/institution-owner/router/
 *     modules.registry.js ids ("dashboard", "institution-
 *     profile" respectively) so a future Owner module router
 *     can wire onRouteClick to real navigation without this
 *     config changing. Institution Owner has no module router
 *     yet (see shell.controller.js / sidebar.controller.js),
 *     so for now both route taps only update the active state
 *     — the exact same "no-op stub" status the sidebar's own
 *     "soon" items are already in.
 *   - "actions", "alerts" and "profile" are type "action":
 *     each reuses an existing control instead of inventing new
 *     behaviour (see bottom-nav.controller.js):
 *       actions -> opens the sidebar drawer (#sidebarToggle)
 *       alerts  -> opens the topbar notification panel
 *                  (#notificationButton)
 *       profile -> opens the topbar profile dropdown
 *                  (#profileButton)
 *
 * Label refinement: "Quick Actions" -> "Actions" (id renamed
 * "quick-actions" -> "actions" to match) — shorter label only,
 * to prevent clipping at the narrowest supported widths. No
 * other item's label changed, and the item still does exactly
 * what it did before (opens the sidebar drawer).
 * ==========================================================
 */

import {
    HomeIcon,
    InstitutionIcon,
    PlusIcon,
    BellIcon,
    UserIcon
} from "../../../../shared/components/icons/index.js";

export const BOTTOM_NAV_ITEMS = [
    { id: "dashboard",   label: "Dashboard",   icon: HomeIcon,        type: "route",  badge: false },
    { id: "institution", label: "Institution", icon: InstitutionIcon, type: "route",  badge: false },
    { id: "actions",     label: "Actions",     icon: PlusIcon,        type: "action", badge: false },
    { id: "alerts",      label: "Alerts",      icon: BellIcon,        type: "action", badge: true  },
    { id: "profile",     label: "Profile",     icon: UserIcon,        type: "action", badge: false }
];
