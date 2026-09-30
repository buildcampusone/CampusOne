/* =========================================
   Institution Owner — Module Registry
   -----------------------------------------
   Single source of truth for the Institution
   Owner sidebar navigation: every module's
   id, label, icon, group, and build status.

   Same shape/contract as
   modules/institution-admin/router/
   modules.registry.js (getModule(),
   getModulesByGroup()) so
   sidebar.page.js can consume it identically.

   "dashboard", "profile", "institution-profile",
   and (Phase 5.1.1) "users-roles" have real
   loaders and are "ready"; every other entry is
   still status: "soon" placeholder scaffolding
   for its planned section (Business, Insights,
   Security, System) — content, not routing/
   business logic. Nav items with status "soon"
   render inert until each is wired up in a later
   phase, exactly as Institution Admin's own
   "soon" entries do.

   status:
     "ready" - has a real loader, navigable
     "soon"  - shown in nav, opens a "Coming
               soon" state once Owner's module
               router exists
========================================= */

import {
    HomeIcon,
    InstitutionIcon,
    UsersIcon,
    BillingIcon,
    CreditCardIcon,
    AnalyticsIcon,
    ShieldCheckIcon,
    SettingsIcon,
    UserIcon
} from "../../../shared/components/icons/index.js";

export const MODULE_GROUPS = [
    { id: "overview", label: "Overview" },
    { id: "institution", label: "Institution" },
    { id: "administration", label: "Administration" },
    { id: "business", label: "Business" },
    { id: "insights", label: "Insights" },
    { id: "security", label: "Security" },
    { id: "system", label: "System" }
];

export const MODULES = [

    { id: "dashboard", label: "Dashboard", icon: HomeIcon, group: "overview", status: "ready" },

    // Not shown in the Sidebar. Its group id ("account") is
    // intentionally NOT in MODULE_GROUPS above, so sidebar.page.js's
    // `MODULE_GROUPS.map(group => getModulesByGroup(group.id))`
    // never surfaces it there — reached only via the topbar
    // avatar's "My Profile" menu item, same access pattern as
    // Institution Admin's own "profile" entry. status: "ready" +
    // a real loader is what lets navigateToModule("profile")
    // resolve instead of falling back to Dashboard or "Coming soon".
    { id: "profile", label: "My Profile", icon: UserIcon, group: "account", status: "ready" },

    { id: "institution-profile", label: "Institution Profile", icon: InstitutionIcon, group: "institution", status: "ready" },

    // Phase 5.1.1: now has a real loader (Institution Admin
    // Management foundation) — router/router.institution-owner.js's
    // LOADERS registers "users-roles" against
    // admin-management/admin-management.page.js.
    { id: "users-roles", label: "Users & Roles", icon: UsersIcon, group: "administration", status: "ready" },

    { id: "billing", label: "Billing", icon: BillingIcon, group: "business", status: "soon" },
    { id: "payments", label: "Payments", icon: CreditCardIcon, group: "business", status: "soon" },

    { id: "analytics", label: "Analytics", icon: AnalyticsIcon, group: "insights", status: "soon" },

    { id: "security", label: "Security", icon: ShieldCheckIcon, group: "security", status: "soon" },

    { id: "settings", label: "Settings", icon: SettingsIcon, group: "system", status: "soon" }

];

export function getModule(id) {

    return MODULES.find((module) => module.id === id) || null;

}

export function getModulesByGroup(groupId) {

    return MODULES.filter((module) => module.group === groupId);

}
