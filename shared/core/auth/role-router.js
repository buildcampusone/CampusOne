/**
 * ==========================================================
 * CampusOne
 * Shared Role Router
 * ----------------------------------------------------------
 * Part 3.6 — Shared Role Router
 * ----------------------------------------------------------
 * Single source of truth for "which registered route does
 * this role land on". Previously this mapping was duplicated
 * across login.controller.js (twice — post-login redirect and
 * session-restore) and bootstrap.manager.js (first-screen
 * resolution on app start). All three now call the one
 * function below instead of maintaining their own role checks.
 *
 * This module is intentionally pure: it takes a role string
 * and returns a route name, nothing else. It never imports the
 * router, never calls navigate(), and never touches the DOM or
 * Firebase — the caller always owns the actual navigation.
 *
 * Institution Owner now routes to its own dedicated
 * "institution-owner" shell (modules/institution-owner/),
 * completing the Owner-first routing migration started in
 * Part 3.4. It previously routed to the "institution-admin"
 * shell as a temporary stand-in — that was intentional then,
 * and is now retired by this change.
 * ========================================================== */

import { ROLES } from "../../constants/roles.js";

/* =========================================
   Role -> Route map

   Only roles with a real, registered route
   belong here. Any role not listed below
   (department_admin, faculty, student,
   parent — still reserved/not yet built)
   simply isn't in this map, and
   resolveRouteForRole() returns null for it
   until a route exists.

   institution_admin now has a real shell
   (modules/institution-admin/) wired into
   router/router.js, so it's mapped here too
   — Owner-created admins can finally land
   somewhere on login instead of hitting the
   "not built yet" alert.
========================================= */

const ROLE_ROUTES = {

    [ROLES.PLATFORM_SUPER_ADMIN]: "super-admin",

    [ROLES.INSTITUTION_OWNER]: "institution-owner",

    [ROLES.INSTITUTION_ADMIN]: "institution-admin"

};

/* =========================================
   resolveRouteForRole(role)
   ----------------------------------------
   Pure lookup — no navigation, no side
   effects. Returns the registered route
   name for a role, or null if that role
   has no route yet.
========================================= */

export function resolveRouteForRole(role) {

    return ROLE_ROUTES[role] || null;

}
