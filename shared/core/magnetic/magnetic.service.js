/**
 * ==========================================================
 * CampusOne
 * Magnetic Service
 * ----------------------------------------------------------
 * Public seam for the Magnetic Engine — pages/components import
 * `Magnetic` from here, never magnetic.engine.js directly.
 *
 * Usage (opt-in — pick one or two real CTAs, not every button):
 *   import { Magnetic } from "shared/core/magnetic/magnetic.service.js";
 *   Magnetic.attach(document.getElementById("heroCta"));
 *   Magnetic.attach(document.getElementById("heroCta"), { strength: 14 });
 *
 *   // Teardown (module switch / unmount):
 *   Magnetic.detach(document.getElementById("heroCta"));
 * ==========================================================
 */

import { magneticEngine } from "./magnetic.engine.js";

export const Magnetic = {

    attach(el, options) {
        return magneticEngine.attach(el, options);
    },

    detach(el) {
        return magneticEngine.detach(el);
    }

};
