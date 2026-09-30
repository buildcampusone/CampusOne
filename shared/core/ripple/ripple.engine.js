/**
 * ==========================================================
 * CampusOne
 * Ripple Engine
 * ----------------------------------------------------------
 * Headless engine (no markup of its own — see .co-ripple-surface
 * / .co-ripple-dot in shared/styles/motion.css) that spawns an
 * ink-ripple dot at the real pointer coordinates on any element
 * carrying `.co-ripple-surface`, and animates it via the Web
 * Animations API — same reasoning as animation.engine.js:
 * compositor-thread, promise-based, no class-toggle-then-reflow
 * dance.
 *
 * Wiring model — event delegation, not per-element listeners:
 * ----------------------------------------------------------
 * A single `pointerdown` listener on `document` (bound once, in
 * the constructor) checks `event.target.closest(".co-ripple-surface")`.
 * This means:
 *   - Every current AND future `.btn` gets ripple for free the
 *     moment this module is imported once (see main.js) —
 *     button.js already puts `.co-ripple-surface` on every
 *     button it renders.
 *   - Elements inserted into the DOM later (a page navigated to
 *     after boot) are covered automatically — no MutationObserver,
 *     no per-page `Ripple.attach()` call needed for buttons.
 *   - `Ripple.attach(el)` still exists for one-off custom
 *     surfaces (a card, a nav row) that want ripple without
 *     being a `.btn`.
 * ==========================================================
 */

import { readToken } from "../animation/animation.types.js";

function prefersReducedMotion() {
    return typeof window !== "undefined"
        && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

class RippleEngine {

    constructor() {

        this._bindDelegatedListener();

    }

    /**
     * Opt-in for a specific element that isn't already covered
     * by the global `.co-ripple-surface` delegation (e.g. it
     * doesn't want the class present in markup for some reason).
     * Most callers never need this — see the class-based wiring
     * above.
     */
    attach(el) {

        if (!el || el.__coRippleBound) return;

        el.__coRippleBound = true;
        el.classList.add("co-ripple-surface");

    }

    /* ==========================================================
       Internal
    ========================================================== */

    _bindDelegatedListener() {

        if (typeof document === "undefined") return;

        document.addEventListener("pointerdown", (event) => {

            const surface = event.target.closest?.(".co-ripple-surface");

            if (!surface) return;

            this._spawn(surface, event);

        });

    }

    _spawn(el, event) {

        // Honest with the reduced-motion setting: don't spawn a
        // static, unanimated dot either — just skip the effect
        // entirely, same principle as Animation Engine landing
        // straight on the end frame.
        if (prefersReducedMotion()) return;

        if (getComputedStyle(el).position === "static") {
            // .co-ripple-surface already sets position:relative,
            // but a caller could override it — guard anyway so
            // the dot never escapes into page-level coordinates.
            el.style.position = "relative";
        }

        const rect = el.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2;

        const originX = (event.clientX ?? rect.left + rect.width / 2) - rect.left;
        const originY = (event.clientY ?? rect.top + rect.height / 2) - rect.top;

        const dot = document.createElement("span");

        dot.className = "co-ripple-dot";
        dot.style.width = `${size}px`;
        dot.style.height = `${size}px`;
        dot.style.left = `${originX - size / 2}px`;
        dot.style.top = `${originY - size / 2}px`;
        dot.style.opacity = ".28";

        el.appendChild(dot);

        const ms = readToken("--duration-ripple") ?? 220;
        const curve = readToken("--ease-out") ?? "cubic-bezier(.16,1,.3,1)";

        const anim = dot.animate(
            [
                { transform: "scale(0)", opacity: .28 },
                { transform: "scale(1)", opacity: 0 }
            ],
            { duration: ms, easing: curve, fill: "forwards" }
        );

        anim.finished
            .catch(() => {
                // Interrupted (element removed mid-animation) — not
                // a real error, nothing to clean up beyond the below.
            })
            .then(() => dot.remove());

    }

}

export const rippleEngine = new RippleEngine();
