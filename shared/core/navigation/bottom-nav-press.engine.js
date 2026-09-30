/**
 * ==========================================================
 * CampusOne
 * Shared Bottom Navigation — Press / Ripple / Wave Engine
 * ----------------------------------------------------------
 * Sub-Phase 1.3 (Feature Parity Pass). Generic, parametrized
 * port of Institution Owner's premium tap-feedback layer —
 * modules/institution-owner/components/bottom-nav/bottom-nav.controller.js
 * -> initPremiumInteraction() (and its helpers setPressTransition/
 * clearPressTransition/positionRipple/restartAnimation).
 *
 * Timing constants, easing curves, event wiring, and the
 * reduced-motion guard are carried over unchanged from that
 * file. Only the selectors are parametrized, so a role with
 * different markup/classnames (Institution Owner's "io-bottomnav-*"
 * vs the shared component's "bn-*") can both drive this same
 * engine without either one owning a duplicate copy.
 *
 * Institution Owner's own file is NOT changed by this pass and
 * is not wired to this engine — it keeps running its private,
 * already-shipped copy untouched. This file exists so a LATER
 * phase can re-point shells at one shared implementation without
 * changing anyone's behaviour today. Nothing imports this file
 * yet outside of shared/components/bottom-nav/bottom-nav.controller.js,
 * and that file only activates it when a caller opts in via the
 * `pressEffects` option — Super Admin and Institution Admin do
 * not pass that option, so their bottom navs are unaffected.
 *
 * Known parity note (carried over faithfully, not "fixed" here):
 * Institution Owner's own markup (bottom-nav.page.js) renders
 * `.io-bottomnav-ripple-layer` as an empty wrapper — it never
 * renders the `.io-bottomnav-ripple` child element the CSS and
 * controller both expect. That means positionRipple()/the ripple
 * animation silently no-op in the current Institution Owner
 * dashboard today; only the wave glow and press/scale actually
 * play. This engine reproduces that exact graceful-degradation
 * behaviour (a missing ripple element is a silent no-op, not an
 * error) rather than assuming the "correct" markup — see the
 * Feature Parity Report for the full note. Fixing the markup is
 * an Institution Owner change and is out of scope for this pass.
 *
 * What this engine deliberately does NOT know about:
 *   - Routing / what a tap "means" (bottom-nav.engine.js's job).
 *   - Active-state class painting (active-tab.manager.js's job).
 *   It only ever touches transform/opacity/CSS custom properties
 *   for feedback — never layout, never business logic.
 *
 * Usage:
 *   const press = createBottomNavPressEffects({ rootEl }).init();
 *   ...
 *   press.destroy();
 * ==========================================================
 */

const DEFAULTS = {
    itemSelector: ".bn-item",
    iconSelector: ".bn-icon",
    labelSelector: ".bn-label",
    rippleSelector: ".bn-ripple",
    waveSelector: ".bn-wave",
    pressClass: "is-pressed",
    // Identical to Institution Owner's PRESS_MS / RELEASE_MS / PRESS_EASE / RELEASE_EASE.
    pressMs: 90,
    releaseMs: 200,
    pressEase: "cubic-bezier(.22,1,.36,1)",
    releaseEase: "cubic-bezier(.34,1.56,.64,1)" // --ease-spring
};

/**
 * @param {object} options
 * @param {HTMLElement} options.rootEl - container the nav items live in.
 * @param {string} [options.itemSelector]
 * @param {string} [options.iconSelector]
 * @param {string} [options.labelSelector]
 * @param {string} [options.rippleSelector] - element the ripple circle animates on. Missing element -> silent no-op (see parity note above).
 * @param {string} [options.waveSelector]
 * @param {string} [options.pressClass]
 * @param {number} [options.pressMs]
 * @param {number} [options.releaseMs]
 * @param {string} [options.pressEase]
 * @param {string} [options.releaseEase]
 * @returns {{ init: () => object, destroy: () => void }}
 */
export function createBottomNavPressEffects(options) {

    const config = { ...DEFAULTS, ...options };

    if (!config.rootEl) {
        throw new Error("[BottomNavPressEffects] `rootEl` is required.");
    }

    let items = [];
    const releaseTimers = new WeakMap();

    function prefersReducedMotion() {

        return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

    }

    function init() {

        if (items.length) destroy();

        items = [...config.rootEl.querySelectorAll(config.itemSelector)];

        items.forEach(attachItem);

        return api;

    }

    function destroy() {

        items.forEach((item) => item.__bnPressCleanup?.());

        items = [];

    }

    function attachItem(item) {

        const icon = item.querySelector(config.iconSelector);
        const label = item.querySelector(config.labelSelector);
        const ripple = item.querySelector(config.rippleSelector);
        const wave = item.querySelector(config.waveSelector);

        const onPointerDown = (event) => {

            if (prefersReducedMotion()) return;

            // Cancel any in-flight release transition from a rapid
            // re-tap so the press always restarts clean at the
            // press timing, never mid-spring.
            const pendingTimer = releaseTimers.get(item);

            if (pendingTimer) {

                clearTimeout(pendingTimer);
                releaseTimers.delete(item);

            }

            setTransition(item, icon, label, config.pressMs, config.pressEase);

            item.classList.add(config.pressClass);

            positionRipple(item, ripple, event);
            restartAnimation(ripple, "is-rippling");
            restartAnimation(wave, "is-waving");

        };

        const onPointerRelease = () => {

            if (!item.classList.contains(config.pressClass)) return;

            setTransition(item, icon, label, config.releaseMs, config.releaseEase);

            item.classList.remove(config.pressClass);

            // Once the spring finishes, drop back to CSS defaults so
            // the NEXT press-in uses the plain press timing again,
            // not a leftover spring.
            const timer = setTimeout(() => {

                clearTransition(item, icon, label);
                releaseTimers.delete(item);

            }, config.releaseMs + 30);

            releaseTimers.set(item, timer);

        };

        item.addEventListener("pointerdown", onPointerDown);
        item.addEventListener("pointerup", onPointerRelease);
        item.addEventListener("pointercancel", onPointerRelease);
        item.addEventListener("pointerleave", onPointerRelease);

        item.__bnPressCleanup = () => {

            item.removeEventListener("pointerdown", onPointerDown);
            item.removeEventListener("pointerup", onPointerRelease);
            item.removeEventListener("pointercancel", onPointerRelease);
            item.removeEventListener("pointerleave", onPointerRelease);

            delete item.__bnPressCleanup;

        };

    }

    function positionRipple(item, ripple, event) {

        // Matches Institution Owner exactly: no ripple element ->
        // no-op, including skipping the --tap-x/--tap-y write.
        if (!ripple) return;

        const rect = item.getBoundingClientRect();

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

        // Force reflow so re-adding the class restarts the
        // animation on rapid repeat taps of the same item.
        void el.offsetWidth;

        el.classList.add(className);

    }

    function setTransition(item, icon, label, ms, ease) {

        const value = `transform ${ms}ms ${ease}`;

        item.style.transition = value;

        if (icon) icon.style.transition = value;
        if (label) label.style.transition = value;

    }

    function clearTransition(item, icon, label) {

        item.style.transition = "";

        if (icon) icon.style.transition = "";
        if (label) label.style.transition = "";

    }

    const api = { init, destroy };

    return api;

}
