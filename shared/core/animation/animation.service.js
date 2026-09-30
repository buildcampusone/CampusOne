/**
 * ==========================================================
 * CampusOne
 * Animation Service
 * ----------------------------------------------------------
 * Public seam for the Animation Engine — same rule as
 * loading.service.js: pages/components import `Animation`
 * from here, never animation.engine.js directly.
 *
 * Usage:
 *   import { Animation } from "shared/core/animation/animation.service.js";
 *
 *   // simple
 *   await Animation.fadeOut(skeletonEl);
 *   await Animation.fadeIn(contentEl);
 *
 *   // flicker-free swap in one call
 *   await Animation.crossFade(skeletonEl, contentEl);
 *
 * Pairs naturally with the Loading Engine (Phase 3):
 *   Loading.onChange(({ type, isLoading }) => {
 *       if (type !== LoadingType.DASHBOARD) return;
 *       isLoading
 *           ? Animation.fadeIn(skeletonEl)
 *           : Animation.crossFade(skeletonEl, contentEl);
 *   });
 * ==========================================================
 */

import { animationEngine } from "./animation.engine.js";

export const Animation = {

    fadeIn(el, options) {
        return animationEngine.fadeIn(el, options);
    },

    fadeOut(el, options) {
        return animationEngine.fadeOut(el, options);
    },

    crossFade(fromEl, toEl, options) {
        return animationEngine.crossFade(fromEl, toEl, options);
    },

    shimmer(el, on = true) {
        return animationEngine.shimmer(el, on);
    }

};
