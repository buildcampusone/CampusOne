/**
 * ==========================================================
 * CampusOne
 * Counter Service
 * ----------------------------------------------------------
 * Public seam for the Counter Engine — same rule as
 * animation.service.js: pages/components import `Counter`
 * from here, never counter.engine.js directly.
 *
 * Usage (controller-driven — value always comes from real,
 * already-fetched data, never invented here):
 *
 *   import { Counter } from "shared/core/counter/counter.service.js";
 *   import { CounterFormat } from "shared/core/counter/counter.types.js";
 *
 *   // Starts counting only once #usersCard scrolls into view.
 *   Counter.observe(document.getElementById("usersCardValue"), data.users);
 *
 *   Counter.observe(revenueEl, data.revenue, {
 *       format: CounterFormat.CURRENCY,
 *       prefix: "₹"
 *   });
 *
 *   // Teardown (module switch / unmount):
 *   Counter.disconnect(revenueEl);
 * ==========================================================
 */

import { counterEngine } from "./counter.engine.js";

export const Counter = {

    /** Count up to `to` the moment `el` becomes visible. */
    observe(el, to, options) {
        return counterEngine.observe(el, to, options);
    },

    /** Count up to `to` immediately, no visibility gate. */
    animate(el, to, options) {
        return counterEngine.animate(el, to, options);
    },

    /** Stop observing/animating `el` (call on destroy/unmount). */
    disconnect(el) {
        return counterEngine.disconnect(el);
    }

};
