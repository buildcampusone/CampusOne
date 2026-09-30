/**
 * ==========================================================
 * CampusOne
 * Institution Admin — Bottom Navigation Controller
 * ----------------------------------------------------------
 * Phase 7. Thin role wrapper only. Sub-Phase 1.3B additionally
 * opts into the shared auto-hide engine (see `autoHide` below) —
 * still just configuration, no new logic lives in this file.
 * All shared behaviour
 * (engine wiring, active-state sync, sidebar-hide sync) now
 * lives in shared/components/bottom-nav/bottom-nav.controller.js
 * — the exact same factory Super Admin's bottom nav is built
 * from. This file supplies exactly the things that make this
 * Institution Admin's bottom nav rather than anyone else's:
 *
 *   - which element it mounts into (#iaBottomNav)
 *   - what a tap on a route item means (navigate the
 *     Institution Admin router)
 *   - what a tap on the one action item ("Profile") means:
 *     reuse the topbar's existing #profileButton dropdown
 *     rather than a second identity menu
 *
 * shell.controller.js keeps calling initBottomNav() /
 * destroyBottomNav() / setActiveBottomNavItem() exactly as
 * before — this refactor changes nothing about that contract.
 * ==========================================================
 */

import {
    navigateToModule,
    getActiveModuleId
} from "../../router/router.institution.js";

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
        rootId: "iaBottomNav",
        onRouteClick: handleRouteItemClick,
        onActionClick: handleActionItemClick,
        // Sub-Phase 1.3B: matches Institution Owner's scroll-based
        // show/hide. #iaContent is the shell's own overflow-y:auto
        // outlet (shell.page.js / shell.css) — the same element
        // Institution Owner's #ioContent plays for its shell.
        autoHide: { scrollEl: "iaContent" },
        // Sub-Phase 1.3D: "Profile" is type "action" (see this
        // file's own header note), so unlike Super Admin this role
        // needs setEphemeralActive()/clearEphemeralActive() too —
        // wired below in handleActionItemClick/handleRouteItemClick,
        // mirroring Institution Owner's own handleActionClick().
        // `tabs` registers this namespace's own ids so validation
        // never falls back to Institution Owner's list.
        activeTabManager: { namespace: "institution-admin", tabs: ACTIVE_TAB_LIST },
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
    // shell chrome finished swapping in (mirrors sidebar's own
    // initial setActiveModule() call in shell.controller.js).
    setActiveBottomNavItem(getActiveModuleId());

}

export function destroyBottomNav() {

    bottomNav?.destroy();
    bottomNav = null;

}

export function setActiveBottomNavItem(routeId) {

    bottomNav?.setActive(routeId);

}

function handleRouteItemClick(id) {

    navigateToModule(id);

    // An action tab's ephemeral active state takes priority over the
    // route (see active-tab.detector.js) so it survives until cleared.
    // Tapping a real route means the Profile panel is no longer what
    // the user is looking at, so drop it here — otherwise a route tab
    // could paint active underneath while Profile stays lit above it.
    // Mirrors Institution Owner's own handleRouteClick().
    bottomNav?.clearEphemeralActive();

}

function handleActionItemClick(id) {

    if (id === "profile") {

        // Mirrors setRouteActive() for route items: tapping Profile
        // again while its dropdown is already open releases back to
        // whatever route is current, exactly like re-tapping wouldn't
        // re-navigate a route tab. Mirrors Institution Owner's own
        // handleActionClick().
        if (bottomNav?.getActive() === id) {

            bottomNav.clearEphemeralActive();

        } else {

            bottomNav?.setEphemeralActive(id);

        }

        // Reuses the real profile button topbar.controller.js
        // already wires up — same dropdown, same content, no
        // second identity menu.
        document.getElementById("profileButton")?.click();

    }

}
