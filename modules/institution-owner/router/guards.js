/* =========================================
   Institution Owner Guard
   -----------------------------------------
   Decides whether the signed-in user is
   allowed into the Institution Owner
   dashboard. Built entirely on top of
   session.store.js so no extra Firebase
   listener is created here — same contract
   as modules/super-admin/router/guards.js
   and modules/institution-admin/router/
   guards.js.
========================================= */

import {
    initSessionListener,
    subscribeSession
} from "../../../shared/services/session.store.js";

import { ROLES } from "../../../shared/constants/roles.js";

// Roles allowed into the Institution Owner shell.
// Kept as a list (rather than a single equality check) for the
// same reason Institution Admin's own guard does — future roles
// could conceivably be added here without touching the guard's
// control flow. Today, only the Owner role itself qualifies.
const ALLOWED_ROLES = [
    ROLES.INSTITUTION_OWNER
];

/**
 * @param {Object} handlers
 * @param {(session:object)=>void} handlers.onAuthorized
 * @param {()=>void} handlers.onUnauthenticated - no user signed in
 * @param {()=>void} handlers.onUnverified - signed in, email not verified
 * @param {(session:object)=>void} handlers.onUnauthorized - signed in, wrong role
 * @param {()=>void} [handlers.onLoading] - role/institution still resolving
 * @returns {()=>void} unsubscribe function
 */
export function initInstitutionOwnerGuard({
    onAuthorized,
    onUnauthenticated,
    onUnverified,
    onUnauthorized,
    onLoading
}) {

    initSessionListener();

    return subscribeSession((session) => {

        if (!session.user) {

            onUnauthenticated?.();

            return;

        }

        if (!session.user.emailVerified) {

            onUnverified?.();

            return;

        }

        if (!session.roleResolved) {

            onLoading?.();

            return;

        }

        if (!isAllowedRole(session.role)) {

            onUnauthorized?.(session);

            return;

        }

        // Reserved for future fine-grained permission checks
        // (e.g. per-module or per-action permissions scoped to
        // an institution) once that model exists. Left as a
        // no-op pass-through so the guard's shape doesn't need
        // to change again when it's built out — same placeholder
        // Institution Admin's own guard already carries.
        if (!hasInstitutionOwnerPermission(session)) {

            onUnauthorized?.(session);

            return;

        }

        onAuthorized(session);

    });

}

function isAllowedRole(role) {

    return ALLOWED_ROLES.includes(role);

}

/**
 * Placeholder permission hook. Always allows for now — every
 * ALLOWED_ROLES member currently gets full Institution Owner
 * access. Swap the body of this function out (or plug in a
 * real permissions service) when module/action-level
 * permissions are introduced, without touching the guard's
 * public contract or its callers.
 *
 * @param {object} session
 */
function hasInstitutionOwnerPermission(session) {

    return true;

}
