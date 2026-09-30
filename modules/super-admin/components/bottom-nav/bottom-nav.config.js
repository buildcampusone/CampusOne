/**
 * ==========================================================
 * CampusOne
 * Platform Super Admin — Bottom Navigation Configuration
 * ----------------------------------------------------------
 * Phase 7. The ONLY Super-Admin-specific piece of the Bottom
 * Navigation — everything else (markup, styling, engine,
 * accessibility) comes from shared/components/bottom-nav/.
 *
 * Fixed 5-item set per the Platform brief. Every `id` matches
 * a real module id already registered in
 * modules/super-admin/router/modules.registry.js, so each tap
 * resolves through the exact router the sidebar already uses —
 * "Verification" -> the institution-requests approval queue,
 * "Analytics" -> the revenue-analytics module — never a new
 * route, never a dead end.
 * ==========================================================
 */

import {
    HomeIcon,
    BuildingIcon,
    ShieldCheckIcon,
    AnalyticsIcon,
    UserIcon
} from "../../../../shared/components/icons/index.js";

export const BOTTOM_NAV_ITEMS = [
    { id: "home",                 label: "Dashboard",     icon: HomeIcon,         type: "route" },
    { id: "institutions",         label: "Institutions",  icon: BuildingIcon,     type: "route" },
    { id: "institution-requests", label: "Verification",  icon: ShieldCheckIcon,  type: "route" },
    { id: "revenue-analytics",    label: "Analytics",     icon: AnalyticsIcon,    type: "route" },
    { id: "profile",              label: "Profile",       icon: UserIcon,         type: "route" }
];
