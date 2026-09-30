/**
 * ==========================================================
 * CampusOne
 * Ripple Service
 * ----------------------------------------------------------
 * Public seam for the Ripple Engine — same rule as
 * animation.service.js / counter.service.js: pages/components
 * import `Ripple` from here, never ripple.engine.js directly.
 *
 * Importing this module ANYWHERE (even without calling
 * anything on it) is enough to activate ripple app-wide for
 * every `.co-ripple-surface` element, including every `.btn` —
 * see ripple.engine.js's docblock. main.js does exactly that,
 * once, at boot.
 *
 * Usage (only needed for a non-.btn custom surface):
 *   import { Ripple } from "shared/core/ripple/ripple.service.js";
 *   Ripple.attach(document.getElementById("customCard"));
 * ==========================================================
 */

import { rippleEngine } from "./ripple.engine.js";

export const Ripple = {

    attach(el) {
        return rippleEngine.attach(el);
    }

};
