/**
 * ==========================================================
 * CampusOne Permission Service
 * shared/services/permission.service.js
 * ----------------------------------------------------------
 * Phase 5.1.5 — Permissions & Role Management
 *
 * Single entry point for "is this user allowed to do X" —
 * mirrors the split auth.service.js already established for
 * authentication (RULE: no other file hand-rolls its own role
 * check; everything goes through here). Sits in the
 * architecture as:
 *
 *   Page -> Controller -> Permission Layer (this file)
 *        -> Repository -> Firestore
 *
 * Pure functions only: takes a plain user/profile object
 * (whatever shape auth.service.js's getUserProfile() or
 * session.store.js's session.userProfile already provides —
 * both include `role`, and Institution Admin profiles include
 * `permissions`), returns booleans. No DOM, no Firestore reads
 * of its own, no side effects.
 *
 * ----------------------------------------------------------
 * IMPORTANT — this is a UX layer, not the security boundary
 * ----------------------------------------------------------
 * Every function below can be skipped by a client that never
 * calls this file at all (e.g. hitting Firestore directly).
 * The actual enforcement lives in firestore.rules — this
 * service exists so pages/controllers can give instant
 * feedback (hide a button, block a submit before a network
 * round-trip) that matches what the rules would decide anyway.
 * canManageAdministrators() below is written to mirror
 * firestore.rules' users/{uid} create/update/list blocks
 * field-for-field for exactly that reason — if the rules ever
 * change who's allowed, this function must change with them.
 * ==========================================================
 */

import { ROLES } from "../constants/roles.js";
import { MODULE_PERMISSIONS } from "../constants/permissions.js";

/* ==========================================================
   Core Checks
========================================================== */

// Module keys every delegated Institution Admin / Department
// Admin can always reach, regardless of their `permissions` map.
// Today this is exactly the one case hasPermission() already
// hardcoded (Dashboard — the shell's own home screen, not a
// delegable feature). Expressed as a lookup instead of an inline
// `moduleKey === MODULE_PERMISSIONS.DASHBOARD` purely so a second
// baseline module, if one is ever added here, doesn't require
// restructuring this function's control flow — this is NOT a new
// access-category system, it changes no behavior for any existing
// moduleKey.
const BASELINE_MODULES = new Set([MODULE_PERMISSIONS.DASHBOARD]);

/**
 * Whether `user` may access the given module.
 *
 * - Platform Super Admin / Institution Owner: full control,
 *   per this phase's Permission Model ("Institution Owner —
 *   Full control"). No `permissions` map is ever consulted for
 *   these roles — there's nothing to configure.
 * - Institution Admin / Department Admin: Dashboard is treated
 *   as baseline access every signed-in admin has (it's the
 *   shell's own home screen, not a delegable feature — see
 *   modules/institution-admin/router/guards.js, the one place
 *   this matters today). Every other module key is read
 *   straight from `user.permissions[moduleKey]`; a missing map
 *   or missing key is `false` (deny by default), never assumed
 *   true.
 * - Any other role (faculty/student/parent/unauthenticated):
 *   never has module access through this function.
 *
 * @param {{role?:string, permissions?:Record<string,boolean>}|null} user
 * @param {string} moduleKey one of MODULE_PERMISSIONS' values
 * @returns {boolean}
 */
export function hasPermission(user, moduleKey) {

    if (!user || !moduleKey) return false;

    if (user.role === ROLES.PLATFORM_SUPER_ADMIN) return true;
    if (user.role === ROLES.INSTITUTION_OWNER) return true;

    const isDelegatedAdmin =
        user.role === ROLES.INSTITUTION_ADMIN ||
        user.role === ROLES.DEPARTMENT_ADMIN;

    if (!isDelegatedAdmin) return false;

    if (BASELINE_MODULES.has(moduleKey)) return true;

    return user.permissions?.[moduleKey] === true;

}

/**
 * ==========================================================
 * authorize()
 * ----------------------------------------------------------
 * Phase C / R2 — the single reusable entry point future
 * consumers (Router, Sidebar, page-level render() functions)
 * should call, instead of each importing hasPermission()
 * directly and re-deciding what "authorized" means on its own.
 *
 * Today it does exactly what hasPermission() does — nothing
 * behaves differently yet, and hasPermission() itself remains
 * exported and fully backward compatible for existing callers
 * (e.g. modules/institution-admin/router/guards.js, unchanged).
 *
 * The reason this exists as its own function rather than callers
 * importing hasPermission() straight away:
 *   1. One place to extend later (e.g. an action-level check —
 *      "can this admin EDIT this module, not just VIEW it") once
 *      that's needed, without hunting down every call site that
 *      would otherwise be calling hasPermission() by hand.
 *   2. Router, Sidebar, and Page all ask the identical question
 *      the identical way going forward, so they can't quietly
 *      drift apart from each other again — see the Phase C audit
 *      (Router checked nothing, Sidebar checked nothing, only
 *      the shell guard checked Dashboard).
 *
 * No routing, sidebar, or page code calls this yet — wiring it
 * in is later phases' work (R4/R5), not this one.
 *
 * @param {{role?:string, permissions?:Record<string,boolean>}|null} user
 * @param {string} moduleKey one of MODULE_PERMISSIONS' values
 * @returns {boolean}
 */
export function authorize(user, moduleKey) {

    return hasPermission(user, moduleKey);

}

/**
 * True if `user` has at least one of the listed modules.
 *
 * @param {object|null} user
 * @param {string[]} moduleKeys
 * @returns {boolean}
 */
export function hasAnyPermission(user, moduleKeys = []) {

    return moduleKeys.some((moduleKey) => hasPermission(user, moduleKey));

}


/**
 * True only if `user` has every listed module.
 *
 * @param {object|null} user
 * @param {string[]} moduleKeys
 * @returns {boolean}
 */
export function hasAllPermissions(user, moduleKeys = []) {

    return moduleKeys.length > 0 &&
        moduleKeys.every((moduleKey) => hasPermission(user, moduleKey));

}

/* ==========================================================
   Institution Admin Management
   ----------------------------------------------------------
   The Create / Edit / Suspend / View-all-administrators actions
   from this phase's Permission Model ("Institution Owner — Full
   control"). Deliberately its own function rather than another
   MODULE_PERMISSIONS entry: firestore.rules' users/{uid}
   create/list/update blocks (Phase 5.1.4) only ever check
   `myRole() == 'institution_owner'`, never a `permissions` map
   field, so a client-side permission flag claiming a delegated
   Institution Admin could do this would be lying — every such
   write would be rejected server-side regardless. Keeping this
   check role-only keeps the client and server answering the
   exact same question the exact same way (see this file's own
   header note on why that matters).
========================================================== */

export function canManageAdministrators(user) {

    if (!user) return false;

    return user.role === ROLES.INSTITUTION_OWNER;

}

export function canViewAdministratorDirectory(user) {

    return canManageAdministrators(user);

}

/* ==========================================================
   Authorization Errors
   ----------------------------------------------------------
   Same normalized-error contract auth.service.js's
   mapAuthError()/appError() and admin-directory.service.js's
   mapAdminError()/adminError() already use: callers never see
   framework internals, only a stable `.code` + a UI-safe
   message, so a permission failure renders through exactly the
   same catch/toast/error-state paths as any other controller
   error, no special-casing needed at the call site.
========================================================== */

const AUTHORIZATION_ERROR_MESSAGE = "You don't have permission to perform this action.";

export function authorizationError() {

    const error = new Error(AUTHORIZATION_ERROR_MESSAGE);

    error.code = "auth/forbidden";

    return error;

}

export function isAuthorizationError(error) {

    return error?.code === "auth/forbidden";

}
