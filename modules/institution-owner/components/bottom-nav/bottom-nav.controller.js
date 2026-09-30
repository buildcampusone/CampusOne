/**
 * ==========================================================
 * CampusOne
 * Institution Owner — Bottom Navigation Controller
 * ----------------------------------------------------------
 * Premium Mobile Bottom Navigation (UI-only pass).
 *
 * Reuses the exact same generic click/active-state engine
 * every other role's bottom nav is built from
 * (shared/core/navigation/bottom-nav.engine.js) instead of
 * re-implementing tap handling or aria-current bookkeeping —
 * only the selectors/classnames it's told to look for differ,
 * matching this module's own bottom-nav.page.js markup
 * ("io-bottomnav-*" instead of the shared "bn-*").
 *
 * This file supplies exactly the things that make this
 * Institution Owner's bottom nav rather than anyone else's:
 *   - which element it mounts into (#ioBottomNav)
 *   - what a tap on a "route" item means: Phase 2 wires this to
 *     the real navigateToModule() from
 *     router/router.institution-owner.js — same contract
 *     sidebar.controller.js's own onRouteSelect() now uses.
 *     Bottom nav's "institution" tab id maps to the registry's
 *     "institution-profile" module id (see ROUTE_ID_ALIASES
 *     below) so this fixed 5-item bar can keep its own shorter
 *     labels/ids without the registry changing.
 *   - what a tap on each "action" item means: reuse an
 *     existing control rather than invent new behaviour.
 *   - the Phase 1 premium press/ripple/wave interaction layer
 *     below, which is deliberately kept OUT of the shared
 *     engine: it runs on its own pointerdown/up listeners, in
 *     parallel with (never replacing) the engine's own click
 *     listener, so Institution Admin's and Super Admin's bottom
 *     navs — which consume the same engine — are completely
 *     unaffected by this pass.
 *   - Phase 3: starting/stopping the scroll-based auto-hide
 *     module (bottom-nav.autohide.js) alongside this file's own
 *     lifecycle. That module owns all of its own scroll-listener
 *     logic; this file only calls its init()/destroy() — no
 *     scroll handling, routing, or business logic is added here.
 *
 * shell.controller.js calls initBottomNav() / destroyBottomNav()
 * / setActiveBottomNavItem(), the same contract Institution
 * Admin's and Super Admin's shells already use for their own
 * bottom navs.
 * ==========================================================
 */

import { createBottomNavEngine, createActiveTabManager } from "../../../../shared/core/navigation/index.js";
import { initAutoHide } from "./bottom-nav.autohide.js";

import {
    navigateToModule,
    getActiveModuleId
} from "../../router/router.institution-owner.js";

// This bar's own "route" item ids (bottom-nav.config.js) don't
// all match modules.registry.js's module ids 1:1 — "institution"
// here is the registry's "institution-profile". Kept as a small
// two-way alias map so neither file has to change to agree with
// the other; every other id (e.g. "dashboard") passes through
// unchanged since it's already identical in both places.
const ROUTE_ID_ALIASES = {
    institution: "institution-profile"
};

function toModuleId(bottomNavRouteId) {

    return ROUTE_ID_ALIASES[bottomNavRouteId] || bottomNavRouteId;

}

function toBottomNavRouteId(moduleId) {

    return Object.keys(ROUTE_ID_ALIASES)
        .find((key) => ROUTE_ID_ALIASES[key] === moduleId) || moduleId;

}

let engine = null;
let activeTab = null;
let rootEl = null;
let onSidebarStateChange = null;
let interactionCleanup = null;
let autoHideCleanup = null;

const ENGINE_OPTIONS = {
    itemSelector: ".io-bottomnav-item",
    activeClass: "is-active",
    routeType: "route",
    iconSelector: ".io-bottomnav-icon",
    // The engine's own tap-pop animation is superseded by the
    // press/release/ripple/wave system below, which fires on the
    // real press (pointerdown), not after the click has already
    // completed — so it's switched off here rather than left to
    // run alongside and double up on the same tap.
    tapClass: "is-tapped",
    tapAnimation: false,
    datasetKeys: { idKey: "bottomnavId", typeKey: "bottomnavType" }
};

export function initBottomNav() {

    rootEl = document.getElementById("ioBottomNav");

    if (!rootEl) {

        console.error("[CampusOne] Institution Owner bottom nav root (#ioBottomNav) not found.");

        return;

    }

    engine = createBottomNavEngine({
        ...ENGINE_OPTIONS,
        rootEl,
        onRouteClick: handleRouteClick,
        onActionClick: handleActionClick
    }).init();

    // Part 2.1's active-tab manager is the single source of truth
    // for the "is-active" class on ALL five items — route (Dashboard,
    // Institution) via setRouteActive(), and action (Actions, Alerts,
    // Profile) via setEphemeralActive()/clearEphemeralActive(). The
    // engine above is kept only for click detection + tap animation;
    // its own class-painting (isRouteItemActive) is route-only by
    // design and is never invoked here, so the two never fight over
    // the same class.
    activeTab = createActiveTabManager({
        namespace: "institution-owner",
        rootEl,
        itemSelector: ".io-bottomnav-item",
        activeClass: "is-active",
        datasetKeys: { idKey: "bottomnavId" }
    }).init();

    // Reflect whatever module the router already resolved before
    // shell chrome finished swapping in (mirrors sidebar's own
    // initial-state handling, and Institution Admin's own
    // initBottomNav()). Falls back to "dashboard" if the router
    // hasn't initialized yet — the shell renders Bottom Nav
    // before it calls initInstitutionOwnerRouter(), so this is
    // the common case; the router's onNavigate callback
    // (shell.controller.js) corrects it to the real resolved
    // route immediately after.
    setActiveBottomNavItem(getActiveModuleId() || "dashboard");

    initSidebarSync();

    interactionCleanup = initPremiumInteraction(rootEl);
    autoHideCleanup = initAutoHide(rootEl);

}

export function destroyBottomNav() {

    engine?.destroy();
    engine = null;

    activeTab?.destroy();
    activeTab = null;

    if (onSidebarStateChange) {

        window.removeEventListener("sidebar:statechange", onSidebarStateChange);
        onSidebarStateChange = null;

    }

    interactionCleanup?.();
    interactionCleanup = null;

    autoHideCleanup?.();
    autoHideCleanup = null;

    rootEl = null;

}

export function setActiveBottomNavItem(moduleId) {

    activeTab?.setRouteActive(toBottomNavRouteId(moduleId));

}

/* ==========================================================
   Route Taps
   ----------------------------------------------------------
   Routes through the real module router as of Phase 2 — same
   contract sidebar.controller.js's onRouteSelect() now uses.
   The router's own onNavigate callback (shell.controller.js)
   is the actual source of truth for the active tab; the
   immediate setActiveBottomNavItem() call below is just instant
   tap feedback so the bar doesn't wait on the (async, cached
   after first visit) module import to repaint.
========================================================== */

function handleRouteClick(id) {

    navigateToModule(toModuleId(id));

    // An action tab's ephemeral active state takes priority over the
    // route (see active-tab.detector.js) so it survives until cleared.
    // Tapping a real route means whatever action panel was open is no
    // longer the thing the user is looking at, so drop it here —
    // otherwise Dashboard/Institution could tap as active underneath
    // while Alerts/Actions/Profile stays visually lit above them.
    activeTab?.clearEphemeralActive();

    setActiveBottomNavItem(toModuleId(id));

}

/* ==========================================================
   Action Taps — reuse existing controls, no new UI invented
========================================================== */

function handleActionClick(id) {

    // Mirrors setRouteActive() for route items: an action tab that's
    // tapped again (its panel/sheet is already open) releases back to
    // whatever route is current, exactly like re-tapping wouldn't
    // re-navigate a route tab. Reuses the same manager, same class,
    // same CSS transition every other item already gets — no
    // per-item animation logic here.
    if (activeTab?.getActive() === id) {

        activeTab.clearEphemeralActive();

    } else {

        activeTab?.setEphemeralActive(id);

    }

    if (id === "actions") {

        // Reuses the topbar's existing sidebar drawer toggle —
        // the sidebar already lists every Owner section, so it
        // doubles as the "Actions" surface rather than a second
        // menu being invented here.
        document.getElementById("sidebarToggle")?.click();

        return;

    }

    if (id === "alerts") {

        // Reuses the real notification panel topbar.controller.js
        // already wires up — same dropdown, same content, no
        // second alerts surface.
        document.getElementById("notificationButton")?.click();

        return;

    }

    if (id === "profile") {

        // Reuses the real profile dropdown topbar.controller.js
        // already wires up — same panel, no second identity menu.
        document.getElementById("profileButton")?.click();

    }

}

/* ==========================================================
   Sidebar Sync
   ----------------------------------------------------------
   Tucks the bar away while the full-screen mobile sidebar
   drawer is open, in sync with sidebar.controller.js's
   "sidebar:statechange" broadcast — same behaviour Super Admin
   and Institution Admin's own bottom navs already have via the
   shared bottom-nav.controller.js factory. Safe no-op today:
   Institution Owner's sidebar.controller.js doesn't dispatch
   this event yet, so the listener simply sits idle until it
   does, at which point this starts working for free.
========================================================== */

function initSidebarSync() {

    onSidebarStateChange = (event) => {

        const { isOpen, isMobile } = event.detail || {};

        rootEl?.classList.toggle(
            "io-bottomnav-hidden",
            Boolean(isMobile && isOpen)
        );

    };

    window.addEventListener("sidebar:statechange", onSidebarStateChange);

}

/* ==========================================================
   Premium Tap Feedback — Press / Spring Release / Ripple / Wave
   ----------------------------------------------------------
   Scoped entirely to this module's own #ioBottomNav markup and
   CSS (bottom-nav.css). Runs its own pointerdown/up listeners
   per item, independent of — and never replacing — the shared
   engine's click listener above, which still owns routing/action
   dispatch untouched.

   Every item gets identical treatment (brief: "never create
   different animations for different items"), active or not.
   transform/opacity only, per the performance brief; no width,
   height, margin, or layout properties are ever touched.
========================================================== */

const PRESS_MS = 90;
const RELEASE_MS = 200;
const PRESS_EASE = "cubic-bezier(.22,1,.36,1)";
const RELEASE_EASE = "cubic-bezier(.34,1.56,.64,1)"; // --ease-spring

function prefersReducedMotion() {

    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

}

function initPremiumInteraction(root) {

    const items = [...root.querySelectorAll(".io-bottomnav-item")];

    const releaseTimers = new WeakMap();

    items.forEach((item) => {

        const icon = item.querySelector(".io-bottomnav-icon");
        const label = item.querySelector(".io-bottomnav-label");
        const ripple = item.querySelector(".io-bottomnav-ripple");
        const wave = item.querySelector(".io-bottomnav-wave");

        const onPointerDown = (event) => {

            if (prefersReducedMotion()) return;

            // Cancel any in-flight release transition from a
            // rapid re-tap so the press always restarts clean at
            // the 90ms press timing, never mid-spring.
            const pendingTimer = releaseTimers.get(item);

            if (pendingTimer) {

                clearTimeout(pendingTimer);
                releaseTimers.delete(item);

            }

            setPressTransition(item, icon, label, PRESS_MS, PRESS_EASE);

            item.classList.add("is-pressed");

            positionRipple(item, ripple, event);
            restartAnimation(ripple, "is-rippling");
            restartAnimation(wave, "is-waving");

        };

        const onPointerRelease = () => {

            if (!item.classList.contains("is-pressed")) return;

            setPressTransition(item, icon, label, RELEASE_MS, RELEASE_EASE);

            item.classList.remove("is-pressed");

            // Once the spring finishes, drop back to the CSS
            // defaults (90ms/premium) so the NEXT press-in uses
            // the plain press timing again, not a leftover spring.
            const timer = setTimeout(() => {

                clearPressTransition(item, icon, label);
                releaseTimers.delete(item);

            }, RELEASE_MS + 30);

            releaseTimers.set(item, timer);

        };

        item.addEventListener("pointerdown", onPointerDown);
        item.addEventListener("pointerup", onPointerRelease);
        item.addEventListener("pointercancel", onPointerRelease);
        item.addEventListener("pointerleave", onPointerRelease);

        item.__premiumInteractionCleanup = () => {

            item.removeEventListener("pointerdown", onPointerDown);
            item.removeEventListener("pointerup", onPointerRelease);
            item.removeEventListener("pointercancel", onPointerRelease);
            item.removeEventListener("pointerleave", onPointerRelease);

        };

    });

    return () => {

        items.forEach((item) => item.__premiumInteractionCleanup?.());

    };

}

function setPressTransition(item, icon, label, ms, ease) {

    const value = `transform ${ms}ms ${ease}`;

    item.style.transition = value;

    if (icon) icon.style.transition = value;
    if (label) label.style.transition = value;

}

function clearPressTransition(item, icon, label) {

    item.style.transition = "";

    if (icon) icon.style.transition = "";
    if (label) label.style.transition = "";

}

function positionRipple(item, ripple, event) {

    if (!ripple) return;

    const rect = item.getBoundingClientRect();

    // Fall back to the item's own center for non-pointer
    // activations (e.g. keyboard "Enter", or a synthetic event
    // with no coordinates) rather than pinning to (0, 0).
    const x = typeof event.clientX === "number" && (event.clientX || event.clientY)
        ? event.clientX - rect.left
        : rect.width / 2;

    const y = typeof event.clientY === "number" && (event.clientX || event.clientY)
        ? event.clientY - rect.top
        : rect.height / 2;

    item.style.setProperty("--tap-x", `${x}px`);
    item.style.setProperty("--tap-y", `${y}px`);

}

function restartAnimation(el, className) {

    if (!el) return;

    el.classList.remove(className);

    // Force reflow so re-adding the class restarts the animation
    // on rapid repeat taps of the same item — no stuck states,
    // no flicker (brief: "Rapid taps must never break animations").
    void el.offsetWidth;

    el.classList.add(className);

}
