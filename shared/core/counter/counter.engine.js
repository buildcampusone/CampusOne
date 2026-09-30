/**
 * ==========================================================
 * CampusOne
 * Counter Engine
 * ----------------------------------------------------------
 * Headless engine (no markup of its own — callers render a
 * plain <span>/<h2> and hand it to this engine, same contract
 * as animation.engine.js) that counts a DOM element's text
 * content from 0 up to a controller-supplied target value.
 *
 * Controller-driven values:
 * ----------------------------------------------------------
 * This engine never invents a number. Every animate()/observe()
 * call requires an explicit `to` value that the caller read
 * from real data (today: dashboard.controller.js's fetched
 * dashboard object; tomorrow: DashboardService.getDashboard()
 * backed by Firestore). If a card has no data yet, the caller
 * simply doesn't start a counter for it — this engine has no
 * concept of placeholder/demo numbers, so there's no fake data
 * for a real Firestore value to silently replace later.
 *
 * Start-on-visible:
 * ----------------------------------------------------------
 * observe() wires a single shared IntersectionObserver (cheaper
 * than one observer per card) that starts the count-up the
 * first time a card actually scrolls into the viewport, then
 * immediately unobserves it — a KPI card counts up once, not
 * every time it re-enters view.
 *
 * No Layout Shift, concretely:
 * ----------------------------------------------------------
 * The element's final formatted string is computed up front and
 * used to reserve `min-width` (in `ch`, so it scales with the
 * element's own font) before a single frame of the animation
 * runs. Counting from "0" up to "12,400" never reflows the card
 * around it, and screen readers/SEO crawlers that read the DOM
 * before JS settles still see a plausible, correctly-shaped
 * value rather than a layout that jumps.
 *
 * prefers-reduced-motion:
 * ----------------------------------------------------------
 * Same rule as the Animation Engine: land on the final value
 * instantly, no counting frames, but still resolve the returned
 * Promise so callers can `await` either way.
 * ==========================================================
 */

import { readToken, formatCounterValue } from "./counter.types.js";

function prefersReducedMotion() {
    return typeof window !== "undefined"
        && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

// Simple ease-out curve for the count-up itself. The engine reads
// --ease-premium for other transitions, but a cubic-bezier string
// can't be sampled frame-by-frame for a plain-number tween, so a
// small numeric ease-out (same "settles in gently" shape) is used
// here instead.
function easeOutQuint(t) {
    return 1 - Math.pow(1 - t, 5);
}

class CounterEngine {

    constructor() {

        // el -> in-flight rAF handle, so re-triggering an animate()
        // on the same element (e.g. a live Firestore update landing
        // mid-count) cancels the stale run instead of both fighting
        // over the same textContent.
        this._active = new WeakMap();

        // Cards queued for "animate when visible", keyed by element
        // so observe() can be called again safely (e.g. re-render)
        // without double-registering.
        this._pending = new WeakMap();

        this._io = null;

    }

    /* ==========================================================
       observe()
       ----------------------------------------------------------
       Registers `el` to start counting up to `to` the moment it
       becomes visible. Elements already in the viewport at call
       time (e.g. above-the-fold KPI cards) fire on the very next
       IntersectionObserver callback — effectively immediately —
       so "start when visible" degrades gracefully into "start
       on mount" for anything already on screen.
    ========================================================== */
    observe(el, to, options = {}) {

        if (!el || typeof to !== "number" || Number.isNaN(to)) return;

        this._reserveWidth(el, to, options);

        this._pending.set(el, { to, options });

        const io = this._getObserver();

        if (!io) {
            // No IntersectionObserver support (or non-browser
            // environment) — fail safe by animating immediately
            // rather than leaving the card stuck at 0.
            this.animate(el, to, options);
            return;
        }

        io.observe(el);

    }

    /**
     * Stops observing/animating `el` and clears its counter state.
     * Called from destroyDashboard()-style teardown hooks so a
     * fast module switch never leaves a rAF loop running against
     * a detached node.
     */
    disconnect(el) {

        this._io?.unobserve(el);
        this._pending.delete(el);

        const handle = this._active.get(el);
        if (handle) {
            cancelAnimationFrame(handle);
            this._active.delete(el);
        }

    }

    /* ==========================================================
       animate()
       ----------------------------------------------------------
       Runs the count-up immediately (no visibility gate). observe()
       calls this once an element is on screen; callers that already
       know an element is visible (e.g. a value updating live while
       the dashboard is open) can call this directly.
    ========================================================== */
    animate(el, to, {
        from = 0,
        duration,
        format,
        prefix,
        suffix,
        decimals = 0
    } = {}) {

        if (!el) return Promise.resolve();

        const finalText = formatCounterValue(to, { format, prefix, suffix, decimals });

        if (prefersReducedMotion()) {
            el.textContent = finalText;
            el.setAttribute("aria-label", finalText);
            return Promise.resolve();
        }

        const ms = duration ?? readToken("--animation-slow") ?? 500;

        // Cancel any in-flight run on this element first — see
        // _active's comment above.
        const prevHandle = this._active.get(el);
        if (prevHandle) cancelAnimationFrame(prevHandle);

        return new Promise((resolve) => {

            const start = performance.now();

            const step = (now) => {

                const elapsed = now - start;
                const t = Math.min(elapsed / ms, 1);
                const eased = easeOutQuint(t);
                const current = from + (to - from) * eased;

                el.textContent = formatCounterValue(current, { format, prefix, suffix, decimals });

                if (t < 1) {

                    const handle = requestAnimationFrame(step);
                    this._active.set(el, handle);

                } else {

                    // Land exactly on the real value — floating point
                    // easing math should already get here, but this
                    // guarantees the displayed number matches the
                    // controller-supplied data byte-for-byte.
                    el.textContent = finalText;
                    el.setAttribute("aria-label", finalText);
                    this._active.delete(el);
                    resolve();

                }

            };

            const handle = requestAnimationFrame(step);
            this._active.set(el, handle);

        });

    }

    /* ==========================================================
       Internal
    ========================================================== */

    _reserveWidth(el, to, options) {

        // Reserve space for the *largest* string the counter will
        // ever show while animating — the final value — so growing
        // from "0" to e.g. "12,400" never shifts sibling layout.
        // `ch` scales with the element's own font, so this holds
        // even if the card's type scale changes responsively.
        const finalText = formatCounterValue(to, options);
        el.style.minWidth = `${finalText.length}ch`;

        // Seed a real, correctly-shaped starting value instead of
        // an empty node — avoids a flash of blank content for
        // anyone reading the DOM before the observer fires.
        if (!el.textContent) {
            el.textContent = formatCounterValue(0, options);
        }

    }

    _getObserver() {

        if (typeof IntersectionObserver === "undefined") return null;

        if (!this._io) {

            this._io = new IntersectionObserver((entries) => {

                entries.forEach((entry) => {

                    if (!entry.isIntersecting) return;

                    const el = entry.target;
                    const pending = this._pending.get(el);

                    if (!pending) return;

                    // One-shot: a KPI card counts up once per mount,
                    // not every time it scrolls back into view.
                    this._io.unobserve(el);
                    this._pending.delete(el);

                    this.animate(el, pending.to, pending.options);

                });

            }, { threshold: 0.25 });

        }

        return this._io;

    }

}

export const counterEngine = new CounterEngine();
