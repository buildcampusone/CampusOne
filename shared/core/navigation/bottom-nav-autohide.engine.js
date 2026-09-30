/**
 * ==========================================================
 * CampusOne
 * Shared Bottom Navigation — Scroll Auto-Hide Engine
 * ----------------------------------------------------------
 * Sub-Phase 1.3 (Feature Parity Pass). Generic, parametrized
 * port of Institution Owner's
 * modules/institution-owner/components/bottom-nav/bottom-nav.autohide.js
 * (initAutoHide). Same algorithm — threshold-gated direction
 * detection, rAF-batched scroll reads, "always visible at the
 * top of the page" rule, always resurfaced on teardown — carried
 * over unchanged. Only the scroll container, the nav element,
 * the hidden class name, and the threshold are parametrized, so
 * any role's shell (each with its own scroll-outlet id and own
 * hidden-class name) can drive this same engine instead of
 * owning a duplicate copy.
 *
 * Institution Owner's own file is NOT changed by this pass and
 * is not wired to this engine — it keeps running its private,
 * already-shipped copy untouched. This file exists so a LATER
 * phase can re-point shells at one shared implementation without
 * changing anyone's behaviour today. Nothing imports this file
 * yet outside of shared/components/bottom-nav/bottom-nav.controller.js,
 * and that file only activates it when a caller opts in via the
 * `autoHide` option — Super Admin and Institution Admin do not
 * pass that option today, so their bottom navs are unaffected.
 *
 * Interface note: Institution Owner's original module exports a
 * plain `initAutoHide(navEl)` that attaches immediately and
 * returns a destroy callback. This port wraps the same logic in
 * the createX({...}).init()/.destroy() shape every other engine
 * in shared/core/navigation/ already uses, so it composes the
 * same way inside bottom-nav.controller.js. This is an interface
 * adaptation only — the scroll/threshold/visibility behaviour
 * itself is unchanged.
 *
 * Usage:
 *   const autoHide = createBottomNavAutoHide({
 *       navEl: rootEl,
 *       scrollEl: document.getElementById("iaContent")
 *   }).init();
 *   ...
 *   autoHide.destroy();
 * ==========================================================
 */

const DEFAULTS = {
    hideClass: "bn-autohidden",
    // Identical to Institution Owner's SCROLL_THRESHOLD.
    threshold: 12
};

/**
 * @param {object} options
 * @param {HTMLElement} options.navEl - the bottom nav root to show/hide.
 * @param {HTMLElement|string} options.scrollEl - the scroll container element, or its id.
 * @param {string} [options.hideClass]
 * @param {number} [options.threshold] - min scroll delta (px) before a direction change is trusted.
 * @returns {{ init: () => object, destroy: () => void }}
 */
export function createBottomNavAutoHide(options) {

    const config = { ...DEFAULTS, ...options };

    let scrollEl = null;
    let lastY = 0;
    let ticking = false;
    let attached = false;

    function resolveScrollEl() {

        if (!config.scrollEl) return null;

        return typeof config.scrollEl === "string"
            ? document.getElementById(config.scrollEl)
            : config.scrollEl;

    }

    function init() {

        if (attached) destroy();

        scrollEl = resolveScrollEl();

        if (!config.navEl || !scrollEl) {

            // Nothing to attach to yet — no-op rather than throwing,
            // matching Institution Owner's original guard, so callers
            // never need to check for a mounted scroll outlet first.
            return api;

        }

        lastY = scrollEl.scrollTop;

        scrollEl.addEventListener("scroll", onScroll, { passive: true });

        attached = true;

        return api;

    }

    function destroy() {

        if (attached) {

            scrollEl?.removeEventListener("scroll", onScroll);

        }

        attached = false;

        // Always resurface the nav on teardown rather than
        // potentially leaving it hidden for whatever mounts next.
        config.navEl?.classList.remove(config.hideClass);

        scrollEl = null;

    }

    function applyState(currentY) {

        // Navigation must always remain visible while resting at
        // the top — regardless of direction/threshold.
        if (currentY <= 0) {

            config.navEl.classList.remove(config.hideClass);
            lastY = currentY;

            return;

        }

        const delta = currentY - lastY;

        if (Math.abs(delta) < config.threshold) {

            // Below threshold: maintain current state, never
            // flicker on tiny/accidental movement.
            return;

        }

        config.navEl.classList.toggle(config.hideClass, delta > 0);

        lastY = currentY;

    }

    function onScroll() {

        // Batches rapid/momentum scroll events into one read+write
        // per frame instead of one per event.
        if (ticking) return;

        ticking = true;

        requestAnimationFrame(() => {

            applyState(scrollEl.scrollTop);
            ticking = false;

        });

    }

    const api = { init, destroy };

    return api;

}
