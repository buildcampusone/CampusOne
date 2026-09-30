/**
 * ==========================================================
 * CampusOne
 * Institution Owner — Sidebar Gesture Engine
 * ----------------------------------------------------------
 * Phase 4 — Premium Dual Sidebar Presentation, Mode 1 (Edge
 * Swipe Drawer).
 *
 * SCOPE / ISOLATION
 * This file is the entire Mode-1 implementation. It does not
 * import, modify, or depend on anything outside
 * modules/institution-owner/. It talks to the existing Sidebar
 * only through its already-public API:
 *
 *   openSidebar() / closeSidebar() / isSidebarOpen()
 *   (from ./sidebar.controller.js)
 *
 * The shared engine (shared/core/navigation/sidebar.engine.js)
 * is never touched and has no idea this file exists — it just
 * sees ordinary open()/close() calls, exactly like a menu-button
 * tap. Institution Admin, which instantiates that same shared
 * engine, is completely unaffected: nothing here runs unless
 * modules/institution-owner/shell is mounted, and init()/
 * destroy() are symmetric so nothing leaks after teardown.
 *
 * PRESENTATION SWITCH
 * The existing Mode 2 (Full Navigation Panel / menu-button tap)
 * keeps working exactly as before — this file never adds the
 * `io-drawer-mode` class for that path. `io-drawer-mode` is
 * added ONLY for the lifetime of an edge-swipe-initiated open,
 * and stripped the moment that drawer instance fully closes.
 * That class is what sidebar.css's additive Phase 4 block keys
 * off of; nothing here duplicates the Sidebar's own layout,
 * colors, typography, or nav items.
 *
 * GESTURE MECHANICS
 * - Recognized only from a left-edge touchstart (EDGE_ZONE_PX)
 *   while the sidebar is closed and the viewport is mobile.
 * - Direction-locked: aborts (no preventDefault, scrolling is
 *   untouched) if the drag reads as more vertical than
 *   horizontal before the horizontal intent threshold is hit.
 * - While dragging: sidebar transform and overlay opacity are
 *   set directly, inline, driven 1:1 by touch position — no CSS
 *   transition runs during this phase, so there is no
 *   interpolation lag.
 * - On release: drag distance + velocity decide open vs. close.
 *   The settle animation continues from the exact current
 *   position (never restarts) via a single transition class.
 * - Only `transform` and `opacity` are ever animated, per the
 *   performance rules (no left/top/width/height/margin/padding
 *   animation).
 *
 * POINTERCANCEL HANDLING (confirmed via on-device diagnostics)
 * On Android devices using system Gesture Navigation (e.g. Vivo
 * OriginOS), the OS can reclaim an in-progress edge swipe mid-drag.
 * The browser reports this as `pointercancel`, not `pointerup` —
 * this is expected platform behavior, not an error condition. Every
 * step up through a fully visible, correctly transformed drawer had
 * already been confirmed working before this was treated as a
 * completion path. `pointerup` and `pointercancel` are therefore
 * resolved through the exact same completion logic
 * (resolveGestureEnd) and the exact same cleanup (settle()) — there
 * is no separate "cancelled" branch. A drag interrupted by the OS
 * finishes exactly as if the finger had been lifted normally: it
 * completes the open if the drag had already crossed the
 * distance/velocity threshold, and animates back closed otherwise.
 * Because pointercancel events don't reliably carry trustworthy
 * coordinates across browsers/OEMs, the last confirmed on-screen
 * drag position (captured every pointermove while dragging) is used
 * to decide open-vs-close in that case, instead of the cancel
 * event's own (potentially stale/zeroed) clientX.
 * ==========================================================
 */

import { openSidebar, closeSidebar, isSidebarOpen } from "./sidebar.controller.js";

const EDGE_ZONE_PX = 24;
const DIRECTION_LOCK_PX = 10;
const OPEN_DISTANCE_RATIO = 0.4;
const OPEN_VELOCITY_PX_MS = 0.5;
const SETTLE_MS = 320;
const MOBILE_QUERY = "(max-width: 1024px)";

const DRAWER_MODE_CLASS = "io-drawer-mode";
const DRAGGING_CLASS = "io-drawer-dragging";
const RELEASING_CLASS = "io-drawer-releasing";

export function createSidebarGestureEngine() {

    const mediaQueryList = window.matchMedia(MOBILE_QUERY);

    const state = {

        attached: false,

        sidebarEl: null,
        overlayId: null,

        tracking: false,   // pointerdown seen near the edge, deciding intent
        dragging: false,   // horizontal intent confirmed, actively dragging
        pointerId: null,
        edgeZoneEl: null,

        startX: 0,
        startY: 0,
        startTime: 0,

        // Last confirmed deltaX seen during an active drag. Used to
        // resolve gesture end when the terminating event itself
        // (pointercancel) doesn't carry a trustworthy position.
        lastDeltaX: 0,

        width: 0,

        historyPushed: false,
        suppressNextPopstate: false,

        handlers: {}

    };

    /* ==========================================================
       Init / Destroy
    ========================================================== */

    function init({ sidebarId, overlayId }) {

        if (state.attached) destroy();

        state.sidebarEl = document.getElementById(sidebarId);
        state.overlayId = overlayId;

        if (!state.sidebarEl) {

            console.error(`[CampusOne] Gesture Engine: sidebar root (#${sidebarId}) not found.`);

            return;

        }

        ensureEdgeZone();

        state.handlers.onPointerDown = handlePointerDown;
        state.handlers.onPointerMove = handlePointerMove;
        state.handlers.onPointerUp = handlePointerUp;
        state.handlers.onPointerCancel = handlePointerCancel;
        state.handlers.onPopState = handlePopState;
        state.handlers.onSidebarStateChange = handleSidebarStateChange;

        // Pointer Events cover touch, mouse, and pen with one code
        // path — real touch devices behave identically to a mouse
        // drag in desktop dev tools, so this is testable without
        // touch emulation. Unlike Touch Events, pointer listeners
        // are not passive by default, so preventDefault() during
        // an active drag just works.
        document.addEventListener("pointerdown", state.handlers.onPointerDown);
        document.addEventListener("pointermove", state.handlers.onPointerMove);
        document.addEventListener("pointerup", state.handlers.onPointerUp);
        document.addEventListener("pointercancel", state.handlers.onPointerCancel);
        window.addEventListener("popstate", state.handlers.onPopState);

        // The shared engine dispatches this on every open()/close()
        // regardless of who triggered it (menu button OR this
        // engine) — used only to know when to re-arm the edge
        // catcher; never used to reach into the engine's internals.
        window.addEventListener("sidebar:statechange", state.handlers.onSidebarStateChange);

        state.attached = true;

    }

    function destroy() {

        if (!state.attached) return;

        document.removeEventListener("pointerdown", state.handlers.onPointerDown);
        document.removeEventListener("pointermove", state.handlers.onPointerMove);
        document.removeEventListener("pointerup", state.handlers.onPointerUp);
        document.removeEventListener("pointercancel", state.handlers.onPointerCancel);
        window.removeEventListener("popstate", state.handlers.onPopState);
        window.removeEventListener("sidebar:statechange", state.handlers.onSidebarStateChange);

        cleanupDrawerClasses();

        state.edgeZoneEl?.remove();
        state.edgeZoneEl = null;

        state.attached = false;
        state.tracking = false;
        state.dragging = false;
        state.pointerId = null;
        state.lastDeltaX = 0;
        state.sidebarEl = null;
        state.overlayId = null;
        state.historyPushed = false;
        state.suppressNextPopstate = false;
        state.handlers = {};

    }

    /* ==========================================================
       Edge Catcher Strip
       ----------------------------------------------------------
       A thin fixed element pinned to the left edge, present only
       while the sidebar is closed on mobile. Its sole job is to
       own `touch-action: none` (see sidebar.css) so a left-edge
       drag starts life on an element that tells the browser "the
       page owns this gesture" BEFORE the OS/browser's native
       edge-swipe-back navigation can claim it — the standard fix
       for edge-swipe drawers being intercepted by Chrome/Safari's
       own back gesture. Removed while the sidebar is open so it
       never sits over nav-item taps.
    ========================================================== */

    function ensureEdgeZone() {

        let el = document.getElementById("ioSidebarEdgeZone");

        if (!el) {

            el = document.createElement("div");
            el.id = "ioSidebarEdgeZone";
            el.setAttribute("aria-hidden", "true");
            document.body.appendChild(el);

        }

        state.edgeZoneEl = el;

        syncEdgeZone();

    }

    function syncEdgeZone() {

        if (!state.edgeZoneEl) return;

        const shouldCatch = mediaQueryList.matches && !isSidebarOpen();

        state.edgeZoneEl.classList.toggle("is-active", shouldCatch);

    }

    function handleSidebarStateChange() {

        syncEdgeZone();

    }

    /* ==========================================================
       Pointer Down — edge-zone check only, no side effects yet
    ========================================================== */

    function handlePointerDown(event) {

        if (!mediaQueryList.matches) return;
        if (isSidebarOpen()) return;
        if (state.tracking || state.dragging) return;


        // Ignore right-click / secondary mouse buttons; touch and
        // pen report button 0 (or -1 for hover) so this only ever
        // filters actual non-primary mouse input.
        if (event.pointerType === "mouse" && event.button !== 0) return;

        if (event.clientX > EDGE_ZONE_PX) return;

        state.tracking = true;
        state.dragging = false;
        state.pointerId = event.pointerId;
        state.startX = event.clientX;
        state.startY = event.clientY;
        state.startTime = Date.now();
        state.lastDeltaX = 0;

    }

    /* ==========================================================
       Pointer Move — direction lock, then 1:1 drag tracking
    ========================================================== */

    function handlePointerMove(event) {

        if (!state.tracking && !state.dragging) return;
        if (event.pointerId !== state.pointerId) return;

        const deltaX = event.clientX - state.startX;
        const deltaY = event.clientY - state.startY;

        if (state.tracking && !state.dragging) {

            const horizontalIntent = Math.abs(deltaX) >= DIRECTION_LOCK_PX;
            const verticalDominant = Math.abs(deltaY) > Math.abs(deltaX);

            if (verticalDominant && Math.abs(deltaY) >= DIRECTION_LOCK_PX) {

                // Reads as a vertical scroll — hand it back to the
                // page entirely, never touch preventDefault.
                state.tracking = false;

                return;

            }

            if (!horizontalIntent || deltaX <= 0) return;

            // Horizontal left-edge drag confirmed — begin dragging.
            beginDrag();

        }

        if (!state.dragging) return;

        // Dragging: page scroll must not also happen.
        event.preventDefault();

        // Keep the last confirmed position — this is what resolves
        // the gesture if it ends via pointercancel instead of
        // pointerup (see resolveGestureEnd).
        state.lastDeltaX = deltaX;

        const position = clamp(deltaX - state.width, -state.width, 0);
        const progress = clamp(deltaX / state.width, 0, 1);

        applyDragFrame(position, progress);

    }

    function beginDrag() {

        state.dragging = true;
        state.width = state.sidebarEl.getBoundingClientRect().width || (window.innerWidth * 0.82);

        state.sidebarEl.classList.add(DRAWER_MODE_CLASS, DRAGGING_CLASS);

        const overlayEl = getOverlayEl();

        overlayEl?.classList.add(DRAWER_MODE_CLASS);

        if (overlayEl) {

            overlayEl.style.transition = "none";
            overlayEl.style.visibility = "visible";
            overlayEl.style.opacity = "0";

        }

        state.sidebarEl.style.transition = "none";
        state.sidebarEl.style.transform = `translateX(${-state.width}px)`;

    }

    function applyDragFrame(position, progress) {

        state.sidebarEl.style.transform = `translateX(${position}px)`;

        const overlayEl = getOverlayEl();

        if (overlayEl) overlayEl.style.opacity = String(progress);

    }

    /* ==========================================================
       Pointer Up / Pointer Cancel — one shared completion path
       ----------------------------------------------------------
       Both events terminate a gesture; they differ only in how
       trustworthy their own coordinates are. pointerup's clientX
       is reliable, so it's used directly. pointercancel's is not
       (varies by browser/OEM, and Android system Gesture
       Navigation reclaiming the swipe mid-drag is exactly the
       case that produces it) — so pointercancel falls back to
       state.lastDeltaX, the last position confirmed during an
       actual pointermove frame. Both paths then run the identical
       distance/velocity decision and the identical settle()
       cleanup — there is no separate "cancelled" code path.
    ========================================================== */

    function handlePointerUp(event) {

        if (event.pointerId !== state.pointerId) return;

        resolveGestureEnd(event.clientX);

    }

    function handlePointerCancel(event) {

        if (event.pointerId !== state.pointerId) return;

        resolveGestureEnd(state.lastDeltaX + state.startX);

    }

    function resolveGestureEnd(endClientX) {

        if (state.tracking && !state.dragging) {

            // Never crossed the horizontal-intent threshold — nothing
            // was ever visually opened, so there's nothing to settle.
            state.tracking = false;
            state.pointerId = null;

            return;

        }

        if (!state.dragging) return;

        const deltaX = endClientX - state.startX;
        const elapsed = Math.max(Date.now() - state.startTime, 1);
        const velocity = deltaX / elapsed;

        const shouldOpen =
            deltaX >= state.width * OPEN_DISTANCE_RATIO ||
            velocity >= OPEN_VELOCITY_PX_MS;

        state.pointerId = null;

        settle(shouldOpen);

    }

    /* ==========================================================
       Settle — continue naturally from current position, never
       restart the animation. Shared by pointerup, pointercancel,
       and the back-button path (handlePopState).
    ========================================================== */

    function settle(open) {

        state.tracking = false;
        state.dragging = false;

        const sidebarEl = state.sidebarEl;
        const overlayEl = getOverlayEl();

        sidebarEl.classList.remove(DRAGGING_CLASS);
        sidebarEl.classList.add(RELEASING_CLASS);

        sidebarEl.style.transition = `transform ${SETTLE_MS}ms var(--io-sidebar-ease, ease)`;
        sidebarEl.style.transform = `translateX(${open ? 0 : -state.width}px)`;

        if (overlayEl) {

            overlayEl.style.transition = `opacity ${SETTLE_MS}ms ease`;
            overlayEl.style.opacity = open ? "1" : "0";

        }

        if (open) {

            openSidebar();
            pushHistoryEntry();

        } else {

            closeSidebar();
            popHistoryEntry();

        }

        window.setTimeout(() => {

            sidebarEl.style.transition = "";
            sidebarEl.style.transform = "";

            if (overlayEl) {

                overlayEl.style.transition = "";
                overlayEl.style.opacity = "";
                overlayEl.style.visibility = "";

            }

            sidebarEl.classList.remove(RELEASING_CLASS);

            if (!open) {

                sidebarEl.classList.remove(DRAWER_MODE_CLASS);
                overlayEl?.classList.remove(DRAWER_MODE_CLASS);

            }

        }, SETTLE_MS);

    }

    /* ==========================================================
       Back Button
       ----------------------------------------------------------
       A single synthetic history entry is pushed only while the
       Drawer (not Mode 2) is open, and only ever popped by this
       module — never by router/router.js. This never touches
       routing: it rides on top of the existing entry, the same
       pattern used by native app bottom sheets/drawers.
    ========================================================== */

    function pushHistoryEntry() {

        if (state.historyPushed) return;

        history.pushState({ ioOwnerDrawer: true }, "");

        state.historyPushed = true;

    }

    function popHistoryEntry() {

        if (!state.historyPushed) return;

        state.historyPushed = false;
        state.suppressNextPopstate = true;

        history.back();

    }

    function handlePopState() {

        if (state.suppressNextPopstate) {

            state.suppressNextPopstate = false;

            return;

        }

        if (!state.historyPushed) return;

        state.historyPushed = false;

        if (isSidebarOpen() && state.sidebarEl?.classList.contains(DRAWER_MODE_CLASS)) {

            settle(false);

        }

    }

    /* ==========================================================
       Helpers
    ========================================================== */

    function getOverlayEl() {

        return state.overlayId ? document.getElementById(state.overlayId) : null;

    }

    function cleanupDrawerClasses() {

        state.sidebarEl?.classList.remove(DRAWER_MODE_CLASS, DRAGGING_CLASS, RELEASING_CLASS);

        if (state.sidebarEl) {

            state.sidebarEl.style.transition = "";
            state.sidebarEl.style.transform = "";

        }

        const overlayEl = getOverlayEl();

        overlayEl?.classList.remove(DRAWER_MODE_CLASS);

        if (overlayEl) {

            overlayEl.style.transition = "";
            overlayEl.style.opacity = "";
            overlayEl.style.visibility = "";

        }

    }

    function clamp(value, min, max) {

        return Math.min(Math.max(value, min), max);

    }

    return { init, destroy };

}
