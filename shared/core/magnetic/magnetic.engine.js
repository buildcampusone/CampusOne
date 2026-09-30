/**
 * ==========================================================
 * CampusOne
 * Magnetic Engine
 * ----------------------------------------------------------
 * Opt-in only — unlike Ripple, this is NOT wired to every
 * `.btn` by default. A magnetic pull on every button in a
 * form-dense enterprise SaaS app would read as gimmicky, not
 * premium — this is for a handful of real call-to-action
 * buttons (e.g. a hero "Get Started"), attached explicitly by
 * the page that wants it.
 *
 * Behavior: while the pointer is inside the element, the
 * element translates a few px toward it (capped at `strength`,
 * default 10px) using transform only — no layout properties
 * touched, no width/height changes to the hit area. On pointer
 * leave, it springs back to (0,0) using --ease-spring.
 *
 * Skipped entirely (no listeners bound) when:
 *   - the OS is set to prefers-reduced-motion, or
 *   - the device has no fine pointer (touch has no "hover to
 *     pull toward" concept — pulling a button toward a tap
 *     that already landed would just look like a glitch).
 * ==========================================================
 */

import { readToken } from "../animation/animation.types.js";

function prefersReducedMotion() {
    return typeof window !== "undefined"
        && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function hasFinePointer() {
    return typeof window !== "undefined"
        && window.matchMedia?.("(pointer: fine)").matches;
}

class MagneticEngine {

    constructor() {

        // el -> cleanup fn, so attach() is idempotent and
        // destroy()-able (module switch / unmount).
        this._bound = new WeakMap();

    }

    attach(el, { strength = 10 } = {}) {

        if (!el || this._bound.has(el)) return;

        if (prefersReducedMotion() || !hasFinePointer()) return;

        const ms = readToken("--duration-hover") ?? 150;
        const springMs = readToken("--duration-card-hover") ?? 180;
        const spring = readToken("--ease-spring") ?? "cubic-bezier(.34,1.56,.64,1)";
        const out = readToken("--ease-out") ?? "cubic-bezier(.16,1,.3,1)";

        el.style.willChange = "transform";

        const onMove = (event) => {

            const rect = el.getBoundingClientRect();
            const relX = event.clientX - (rect.left + rect.width / 2);
            const relY = event.clientY - (rect.top + rect.height / 2);

            // Cap the pull so it's a "magnetic hint," never a
            // large zoom/drag — same golden rule as the rest of
            // the Motion System.
            const x = Math.max(-strength, Math.min(strength, relX * 0.3));
            const y = Math.max(-strength, Math.min(strength, relY * 0.3));

            el.style.transition = `transform ${ms}ms ${out}`;
            el.style.transform = `translate(${x}px, ${y}px)`;

        };

        const onLeave = () => {

            el.style.transition = `transform ${springMs}ms ${spring}`;
            el.style.transform = "translate(0, 0)";

        };

        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerleave", onLeave);

        this._bound.set(el, () => {

            el.removeEventListener("pointermove", onMove);
            el.removeEventListener("pointerleave", onLeave);
            el.style.willChange = "";
            el.style.transform = "";
            el.style.transition = "";

        });

    }

    detach(el) {

        this._bound.get(el)?.();
        this._bound.delete(el);

    }

}

export const magneticEngine = new MagneticEngine();
