/* =========================================
   Super Admin Guard
   -----------------------------------------
   Decides whether the signed-in user is
   allowed into the Super Admin dashboard.
   Built entirely on top of session.store.js so no
   extra Firebase listener is created here.
========================================= */

import {
    initSessionListener,
    subscribeSession
} from "../../../shared/services/session.store.js";

import { ROLES } from "../../../shared/constants/roles.js";

/**
 * @param {Object} handlers
 * @param {(session:object)=>void} handlers.onAuthorized
 * @param {()=>void} handlers.onUnauthenticated - no user signed in
 * @param {()=>void} handlers.onUnverified - signed in, email not verified
 * @param {(session:object)=>void} handlers.onUnauthorized - signed in, wrong role
 * @param {()=>void} [handlers.onLoading] - role/institution still resolving
 * @returns {()=>void} unsubscribe function
 */
export function initSuperAdminGuard({
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

        if (session.role !== ROLES.PLATFORM_SUPER_ADMIN) {

            onUnauthorized?.(session);

            return;

        }

        onAuthorized(session);

    });

}
