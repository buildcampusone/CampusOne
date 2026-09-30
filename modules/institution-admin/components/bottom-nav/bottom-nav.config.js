/**
 * ==========================================================
 * CampusOne
 * Institution Admin — Bottom Navigation Configuration
 * ----------------------------------------------------------
 * Phase 7. The ONLY Institution-Admin-specific piece of the
 * Bottom Navigation — everything else (markup, styling,
 * engine, accessibility) comes from
 * shared/components/bottom-nav/.
 *
 * Fixed 5-item set per the brief. "Dashboard", "Students",
 * "Attendance" and "Notices" are real routes — each id matches
 * a module already registered in
 * modules/institution-admin/router/modules.registry.js.
 * "Profile" is type "action": it reuses the topbar's existing
 * #profileButton dropdown rather than a second identity menu
 * (see bottom-nav.controller.js).
 * ==========================================================
 */

import {
    HomeIcon,
    UsersIcon,
    ClockIcon,
    BellIcon,
    UserIcon
} from "../../../../shared/components/icons/index.js";

export const BOTTOM_NAV_ITEMS = [
    { id: "dashboard",  label: "Dashboard",  icon: HomeIcon,  type: "route",  badge: false },
    { id: "students",   label: "Students",   icon: UsersIcon, type: "route",  badge: false },
    { id: "attendance", label: "Attendance", icon: ClockIcon, type: "route",  badge: false },
    { id: "notices",    label: "Notices",    icon: BellIcon,  type: "route",  badge: true },
    { id: "profile",    label: "Profile",    icon: UserIcon,  type: "action", badge: false }
];
