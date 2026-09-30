/**
 * ==========================================================
 * CampusOne
 * Platform Super Admin — Bottom Navigation Markup
 * ----------------------------------------------------------
 * Phase 7. Thin role wrapper only — the actual markup comes
 * from the shared component (shared/components/bottom-nav/
 * bottom-nav.page.js). This file exists only so shell.page.js /
 * shell.controller.js keep importing from this same relative
 * path as every other shell region (sidebar, topbar, etc.);
 * everything it does is hand this role's configuration
 * (bottom-nav.config.js) to the shared renderer.
 * ==========================================================
 */

import { BottomNavPage as renderSharedBottomNav } from "../../../../shared/components/bottom-nav/bottom-nav.page.js";
import { BOTTOM_NAV_ITEMS } from "./bottom-nav.config.js";

export { BOTTOM_NAV_ITEMS };

export function BottomNavPage() {

    return renderSharedBottomNav(BOTTOM_NAV_ITEMS);

}
