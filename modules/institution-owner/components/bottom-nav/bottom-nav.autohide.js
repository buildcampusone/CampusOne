/**
 * ==========================================================
 * CampusOne
 * Institution Owner — Bottom Navigation Auto-Hide
 * ----------------------------------------------------------
 * Phase 3: intelligent show/hide tied to scroll direction on
 * the Owner shell's main content outlet — #ioContent, the
 * actual `overflow-y: auto` scroll container per shell.css
 * (.io-content). Nothing here is routing or business logic;
 * it reads scroll position and toggles exactly one class.
 *
 * Deliberately its own file rather than added logic inside
 * bottom-nav.controller.js: bottom-nav.controller.js only
 * imports init/destroy from here and calls them alongside its
 * own lifecycle (same pattern Phase 1's interaction layer
 * already uses), so this module stays swappable/testable in
 * isolation and never grows the controller's own click/route
 * handling.
 *
 * Usage (see bottom-nav.controller.js):
 *   const destroy = initAutoHide(rootEl);
 *   ...
 *   destroy();
 * ==========================================================
 */

// Minimum scroll movement (px) before a direction change is
// trusted — filters out accidental finger jitter, momentum
// micro-corrections, and sub-pixel scroll noise.
const SCROLL_THRESHOLD = 12;

const HIDE_CLASS = "io-bottomnav-autohidden";

/**
 * @param {HTMLElement} navEl - the bottom nav root (#ioBottomNav).
 * @returns {() => void} destroy function.
 */
export function initAutoHide(navEl) {

    const scrollEl = document.getElementById("ioContent");

    if (!navEl || !scrollEl) {

        // Nothing to attach to yet (e.g. static shell.html preview
        // without a mounted #ioContent) — no-op cleanup rather than
        // throwing, so callers never need to guard this themselves.
        return () => {};

    }

    let lastY = scrollEl.scrollTop;
    let ticking = false;

    function applyState(currentY) {

        // Brief: "Navigation must always remain visible" while
        // resting at the top — regardless of direction/threshold.
        if (currentY <= 0) {

            navEl.classList.remove(HIDE_CLASS);
            lastY = currentY;

            return;

        }

        const delta = currentY - lastY;

        if (Math.abs(delta) < SCROLL_THRESHOLD) {

            // Below threshold: maintain current state, never
            // flicker on tiny/accidental movement.
            return;

        }

        navEl.classList.toggle(HIDE_CLASS, delta > 0);

        lastY = currentY;

    }

    function onScroll() {

        // Batches rapid/momentum scroll events into one read+write
        // per frame instead of one per event — avoids forced
        // reflow and keeps this smooth under fast scrolling.
        if (ticking) return;

        ticking = true;

        requestAnimationFrame(() => {

            applyState(scrollEl.scrollTop);
            ticking = false;

        });

    }

    scrollEl.addEventListener("scroll", onScroll, { passive: true });

    return function destroy() {

        scrollEl.removeEventListener("scroll", onScroll);

        // Always resurface the nav on teardown rather than
        // potentially leaving it hidden for whatever mounts next.
        navEl.classList.remove(HIDE_CLASS);

    };

}
