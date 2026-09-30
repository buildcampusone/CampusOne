/**
 * ==========================================================
 * CampusOne
 * Animation Engine
 * ----------------------------------------------------------
 * Headless engine (no markup of its own — see the
 * .co-animate-* / .co-crossfade classes in
 * shared/styles/animations.css and .co-skeleton in
 * shared/components/skeleton/ for the CSS side) that runs
 * Fade In / Fade Out / Cross Fade for any element, and pauses
 * the skeleton Shimmer sweep when it isn't visible.
 *
 * Why Web Animations API instead of toggling a CSS class:
 * ----------------------------------------------------------
 * - Runs on the compositor thread for opacity/transform, same
 *   as a CSS animation — so it's just as GPU-accelerated and
 *   just as immune to main-thread jank (60 FPS holds even if
 *   JS elsewhere is busy).
 * - Promise-based (`anim.finished`), so callers can `await`
 *   a transition instead of wiring transitionend/animationend
 *   listeners and cleaning them up by hand.
 * - Starting it doesn't require the class-toggle-then-force-
 *   reflow dance CSS transitions need when the element was
 *   just inserted/unhidden in the same tick — a common source
 *   of "the fade didn't play" bugs.
 *
 * No Flicker, concretely:
 * ----------------------------------------------------------
 * crossFade() never removes the old element and then inserts
 * the new one — both are unhidden and animating at the same
 * time, on the same rAF-independent compositor timeline, so
 * there is never a frame where neither is visible.
 *
 * No Repaint Issues, concretely:
 * ----------------------------------------------------------
 * will-change is added right before an animation starts and
 * removed the moment it finishes (see _run below) — not left
 * on permanently. Left-on will-change forces the browser to
 * keep a promoted compositor layer around indefinitely, which
 * costs GPU memory and can *cause* the jank it's meant to
 * prevent. The one exception is the Shimmer sweep itself
 * (shimmer.css), which is deliberately infinite for as long as
 * a skeleton is on screen, so keeping will-change on for its
 * whole lifetime is the correct call there — see the comment
 * in shimmer.css.
 * ==========================================================
 */

import { readToken } from "./animation.types.js";

function prefersReducedMotion() {
    return typeof window !== "undefined"
        && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

class AnimationEngine {

    constructor() {

        // el -> in-flight Animation. Cancelling the previous run
        // before starting a new one on the same element stops two
        // competing animations from fighting over the same
        // property (a real source of flicker if, say, crossFade()
        // is called twice in quick succession on the same node).
        this._active = new WeakMap();

        this._bindVisibilityPause();

    }

    /* ==========================================================
       fadeIn() / fadeOut()
    ========================================================== */

    fadeIn(el, { duration, easing, onFinish } = {}) {

        if (!el) return Promise.resolve();

        el.hidden = false;

        return this._run(el, [{ opacity: 0 }, { opacity: 1 }], duration, easing)
            .then(() => onFinish?.());

    }

    /**
     * @param {boolean} [options.hideOnFinish=true] - sets el.hidden = true
     *   once fully transparent, so it's actually pulled out of layout
     *   and paint instead of sitting there invisible-but-still-costed.
     *   Pass false when the caller is about to remove/replace the
     *   element itself (e.g. crossFade's outgoing layer).
     */
    fadeOut(el, { duration, easing, hideOnFinish = true, onFinish } = {}) {

        if (!el) return Promise.resolve();

        return this._run(el, [{ opacity: 1 }, { opacity: 0 }], duration, easing)
            .then(() => {

                if (hideOnFinish) el.hidden = true;

                onFinish?.();

            });

    }

    /* ==========================================================
       crossFade()
       ----------------------------------------------------------
       fromEl fades out, toEl fades in, at the same time — see
       "No Flicker" above. Both elements must already exist in the
       DOM (e.g. the .co-crossfade-layer markup in animations.css);
       this only ever touches their opacity, never inserts/removes
       nodes.
    ========================================================== */
    crossFade(fromEl, toEl, { duration, easing } = {}) {

        if (!fromEl || !toEl) return Promise.resolve();

        toEl.hidden = false;

        return Promise.all([
            this.fadeOut(fromEl, { duration, easing, hideOnFinish: true }),
            this.fadeIn(toEl, { duration, easing })
        ]);

    }

    /* ==========================================================
       shimmer()
       ----------------------------------------------------------
       Pauses/resumes the CSS shimmer sweep (shimmer.css) on a
       specific skeleton element — e.g. a virtualized list that
       wants to freeze rows that scroll off-screen.
    ========================================================== */
    shimmer(el, on = true) {

        if (!el) return;

        el.classList.toggle("co-skeleton--paused", !on);

    }

    /* ==========================================================
       Internal
    ========================================================== */

    _run(el, keyframes, duration, easing) {

        const ms = duration ?? readToken("--animation-normal");
        const curve = easing ?? readToken("--ease-premium");

        // Respect the OS-level "less motion" preference: land on
        // the final frame instantly instead of animating to it.
        // Still returns a resolved Promise so callers can safely
        // `await` regardless of the user's motion setting.
        if (prefersReducedMotion()) {

            const finalFrame = keyframes[keyframes.length - 1];

            Object.assign(el.style, finalFrame);

            return Promise.resolve();

        }

        this._active.get(el)?.cancel();

        el.style.willChange = "opacity";

        const anim = el.animate(keyframes, {
            duration: ms,
            easing: curve,
            fill: "forwards"
        });

        this._active.set(el, anim);

        return anim.finished
            .catch(() => {
                // anim.cancel() (interrupted by a newer run, or by
                // the caller) rejects `finished` — that's an
                // expected stop, not a real error, so swallow it.
            })
            .then(() => {

                // Bake the held end-state into a real inline style,
                // then release the Animation object — otherwise the
                // browser keeps it "live" indefinitely just to keep
                // enforcing that end state (fill:"forwards"), which
                // is unnecessary GPU/memory upkeep for something
                // that's already finished.
                try {
                    anim.commitStyles();
                } catch {
                    // commitStyles() throws if the element was
                    // detached/hidden mid-animation — the visual
                    // result doesn't matter anymore at that point.
                }

                anim.cancel();

                el.style.willChange = "";

                if (this._active.get(el) === anim) {
                    this._active.delete(el);
                }

            });

    }

    _bindVisibilityPause() {

        if (typeof document === "undefined") return;

        document.addEventListener("visibilitychange", () => {

            const paused = document.hidden;

            document.querySelectorAll(".co-skeleton").forEach((el) => {
                el.classList.toggle("co-skeleton--paused", paused);
            });

        });

    }

}

export const animationEngine = new AnimationEngine();
