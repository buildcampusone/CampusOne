/**
 * ==========================================================
 * CampusOne
 * Reusable Bottom Navigation Engine
 * ----------------------------------------------------------
 * The generic 20% of a bottom-nav controller — item lookup,
 * click delegation (route vs. action), active-state
 * painting, tap animation, and ARIA — factored out of
 * bottom-nav.controller.js so any future shell (Institution
 * Admin, Coaching Admin, whatever comes next) can create its
 * own instance instead of copy-pasting that plumbing.
 *
 * What this engine deliberately does NOT know about:
 *   - Routing (it never imports a router). Route clicks are
 *     reported via onRouteClick(id, item) and the CALLER
 *     decides what "navigate" means.
 *   - Anything domain-specific (notification badges, activity
 *     sheets, sidebar sync). Those stay in the owning
 *     controller as glue code, exactly as they do today for
 *     Super Admin.
 *
 * That keeps this file honestly reusable — it has no opinion
 * about what a "route" or an "action" leads to, only about
 * detecting clicks, and reflecting active state.
 *
 * Usage:
 *
 *   const engine = createBottomNavEngine({
 *       rootEl: document.getElementById("saBottomNav"),
 *       onRouteClick: (id) => navigateToModule(id),
 *       onActionClick: (id, type, item) => { ... }
 *   });
 *
 *   (In practice, every role now goes through the shared
 *   shared/components/bottom-nav/bottom-nav.controller.js
 *   factory instead of calling this engine directly — see that
 *   file's createBottomNav().)
 *
 *   engine.init();
 *   engine.setActive("home");
 *   engine.destroy();
 * ==========================================================
 */

import { isRouteItemActive, readRouteItemFromDataset } from "./active-route.detector.js";

const DEFAULTS = {
    // Generic "bn-" (Bottom Nav) selectors — Phase 7 unified this
    // engine's defaults to the shared component's own class names
    // (shared/components/bottom-nav/) instead of Super Admin's old
    // "sa-" prefix, since this engine is now consumed by every
    // role's bottom nav through the same shared markup.
    itemSelector: ".bn-item",
    activeClass: "is-active",
    routeType: "route",
    iconSelector: ".bn-icon",
    tapClass: "is-tapped",
    tapAnimation: true,
    datasetKeys: { idKey: "bottomnavId", typeKey: "bottomnavType" }
};

/**
 * @param {object} options
 * @param {HTMLElement} options.rootEl - container the nav items live in.
 * @param {string} [options.itemSelector]
 * @param {string} [options.activeClass]
 * @param {string} [options.routeType] - dataset "type" value that means "this is a real route".
 * @param {{ idKey: string, typeKey: string }} [options.datasetKeys]
 * @param {(id: string, item: HTMLElement) => void} [options.onRouteClick]
 * @param {(id: string, type: string, item: HTMLElement) => void} [options.onActionClick]
 * @param {string|false} [options.iconSelector] - selector for the tap-animation target, or false to disable.
 * @param {string} [options.tapClass]
 * @param {boolean} [options.tapAnimation]
 */
export function createBottomNavEngine(options) {

    const config = { ...DEFAULTS, ...options };

    if (!config.rootEl) {
        throw new Error("[BottomNavEngine] `rootEl` is required.");
    }

    let items = [];
    let activeRouteId = null;

    function init() {

        items = [...config.rootEl.querySelectorAll(config.itemSelector)];

        items.forEach((item) => {

            item.addEventListener("click", handleItemClick);

        });

        return api;

    }

    function destroy() {

        items.forEach((item) => {

            item.removeEventListener("click", handleItemClick);

        });

        items = [];

    }

    function handleItemClick(event) {

        const item = event.currentTarget;

        const { id, type } = readRouteItemFromDataset(item, config.datasetKeys);

        if (!id) return;

        playTapAnimation(item);

        if (type === config.routeType) {

            config.onRouteClick?.(id, item);

            return;

        }

        config.onActionClick?.(id, type, item);

    }

    function playTapAnimation(item) {

        if (!config.tapAnimation || !config.iconSelector) return;

        const icon = item.querySelector(config.iconSelector);

        if (!icon) return;

        icon.classList.remove(config.tapClass);

        // Force reflow so re-adding the class restarts the
        // animation on rapid repeat taps of the same item.
        void icon.offsetWidth;

        icon.classList.add(config.tapClass);

    }

    /**
     * Reflects `routeId` as active across all route-type items.
     * Safe to call before init() (no-ops on an empty item list),
     * and safe to call repeatedly with the same id.
     */
    function setActive(routeId) {

        activeRouteId = routeId;

        items.forEach((item) => {

            const descriptor = readRouteItemFromDataset(item, config.datasetKeys);

            const isActive = isRouteItemActive(descriptor, activeRouteId, config.routeType);

            item.classList.toggle(config.activeClass, isActive);

            item.setAttribute("aria-current", isActive ? "page" : "false");

        });

    }

    function getActive() {

        return activeRouteId;

    }

    const api = { init, destroy, setActive, getActive };

    return api;

}
