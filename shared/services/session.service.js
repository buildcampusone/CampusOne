/**
 * ==========================================================
 * CampusOne
 * Session Service
 * ----------------------------------------------------------
 * Single place that knows how to end a Super Admin or
 * Institution Admin session. Sidebar, Topbar, and the Profile
 * module all call this instead of touching Firebase Auth or
 * sessionStorage directly.
 *
 * Now backed by real Firebase Auth (auth.service.js's
 * logout() -> signOut(auth)) instead of the old
 * sessionStorage["campusone-platform"] flag, which no longer
 * exists now that the Secret Super Admin login goes through
 * real authentication.
 * ==========================================================
 */

import { logout } from "./auth.service.js";

export async function clearSuperAdminSession() {

    await logout();

}

export async function clearInstitutionAdminSession() {

    await logout();

}
