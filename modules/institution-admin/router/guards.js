/* =========================================
   Institution Admin Guard
   -----------------------------------------
   Decides whether the signed-in user is
   allowed into the Institution Admin
   dashboard. Built entirely on top of
   session.store.js so no extra Firebase
   listener is created here — same contract
   as modules/super-admin/router/guards.js.
========================================= */

import {
    initSessionListener,
    subscribeSession
} from "../../../shared/services/session.store.js";

import { ROLES } from "../../../shared/constants/roles.js";

import { MODULE_PERMISSIONS } from "../../../shared/constants/permissions.js";

import { hasPermission } from "../../../shared/services/permission.service.js";

// Roles allowed into the Institution Admin shell.
// Kept as a list (rather than a single equality check) so
// future roles — e.g. ROLES.DEPARTMENT_ADMIN, or another
// delegated role — can be added here without touching the
// guard's control flow.
//
// Part 3.9: Institution Owner and Institution Admin are now
// separate roles with separate dashboards. Institution Owner
// no longer enters Institution Admin through this guard —
// Owner manages Institution Admin from the Owner Dashboard
// instead. The temporary Part 3.2 migration allowance for
// Institution Owner has been removed.
const ALLOWED_ROLES = [
    ROLES.INSTITUTION_ADMIN
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
export function initInstitutionAdminGuard({
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
        // to change again when it's built out.
        if (!hasInstitutionAdminPermission(session)) {

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
 * Phase 5.1.5 — now backed by shared/services/permission.service.js
 * instead of a hardcoded `true`. Still effectively a pass-through
 * today: the only module this guard gates entry to is the shell
 * itself (Dashboard), and hasPermission() treats Dashboard as
 * baseline access for every Institution Admin regardless of
 * their `permissions` map — so this doesn't change who gets in.
 * What it does change: the guard now asks the same shared
 * function every other permission check in the app asks, so a
 * later per-module route (Students, Fees, etc. — see
 * modules.registry.js) only needs to call hasPermission() with
 * its own module key, not invent a second check here.
 *
 * @param {object} session
 */
function hasInstitutionAdminPermission(session) {

    return hasPermission(session.userProfile, MODULE_PERMISSIONS.DASHBOARD);

}
