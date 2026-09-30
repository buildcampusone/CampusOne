/**
 * ==========================================================
 * CampusOne
 * Platform Super Admin — Bottom Navigation Controller
 * ----------------------------------------------------------
 * Phase 7. Thin role wrapper only. Sub-Phase 1.3B additionally
 * opts into the shared auto-hide engine (see `autoHide` below) —
 * still just configuration, no new logic lives in this file.
 * All shared behaviour
 * (engine wiring, active-state sync, sidebar-hide sync) now
 * lives in shared/components/bottom-nav/bottom-nav.controller.js.
 * This file supplies exactly the two things that make this
 * Super Admin's bottom nav rather than anyone else's:
 *
 *   - which element it mounts into (#saBottomNav)
 *   - what a tap on a route item means (navigate the Super
 *     Admin router)
 *
 * Every item in this role's configuration (bottom-nav.config.js)
 * is a real route — there are no action-type taps to interpret
 * here, unlike Institution Admin's "Profile" tab.
 *
 * shell.controller.js keeps calling initBottomNav() /
 * destroyBottomNav() / setActiveBottomNavItem() exactly as
 * before — this refactor changes nothing about that contract.
 * ==========================================================
 */

import {
    navigateToModule,
    getActiveModuleId
} from "../../router/router.super.js";

import { createBottomNav } from "../../../../shared/components/bottom-nav/bottom-nav.controller.js";
import { BOTTOM_NAV_ITEMS } from "./bottom-nav.config.js";

// Sub-Phase 1.3D: this role's own tab list, in the {id, kind}
// shape Active Tab Manager's tab-registry expects — derived
// straight from bottom-nav.config.js, nothing new invented.
const ACTIVE_TAB_LIST = BOTTOM_NAV_ITEMS.map((item) => ({
    id: item.id,
    kind: item.type
}));

let bottomNav = null;

export function initBottomNav() {

    bottomNav = createBottomNav({
        rootId: "saBottomNav",
        onRouteClick: (id) => navigateToModule(id),
        // Sub-Phase 1.3B: matches Institution Owner's scroll-based
        // show/hide. #saContent is the shell's own overflow-y:auto
        // outlet (shell.page.js / shell.css) — the same element
        // Institution Owner's #ioContent plays for its shell.
        autoHide: { scrollEl: "saContent" },
        // Sub-Phase 1.3D: every item here is a real route (see this
        // file's own header note), so Active Tab Manager only ever
        // needs setRouteActive() — no action-tab handling to wire.
        // `tabs` registers this namespace's own ids so validation
        // never falls back to Institution Owner's list.
        activeTabManager: { namespace: "super-admin", tabs: ACTIVE_TAB_LIST },
        // Phase 1.4: Institution Owner's premium press/ripple/wave
        // tap feedback, now available to every role via the shared
        // engine — same timings, same easing, same feel. Disables
        // the older tap-pop animation (tapAnimation) so the two
        // systems never both fire on the same tap, mirroring
        // Institution Owner's own ENGINE_OPTIONS.
        pressEffects: true,
        tapAnimation: false
    });

    bottomNav.init();

    // Reflect whatever module the router already resolved before
    // shell chrome finished swapping in (see router.super.js's
    // initSuperAdminRouter(), which runs before revealShell()
    // mounts this component).
    setActiveBottomNavItem(getActiveModuleId());

}

export function destroyBottomNav() {

    bottomNav?.destroy();
    bottomNav = null;

}

export function setActiveBottomNavItem(routeId) {

    bottomNav?.setActive(routeId);

}
