/**
 * ---------------------------------------------------------
 * CampusOne
 * Super Admin Login Service
 * ---------------------------------------------------------
 * Handles:
 * • Authentication
 * • Role Verification
 * • Session Creation
 * • Dashboard Navigation
 * ---------------------------------------------------------
 * Thin wrapper over auth.service.js's loginPlatformSuperAdmin().
 * No Firebase imports here and no sessionStorage — session state
 * lives in exactly one place (session.store.js), same as every
 * other login flow in the app. Navigation is intentionally NOT
 * done here (see note below) — login.controller.js is the single
 * place responsible for navigating after a successful login.
 */

import { loginPlatformSuperAdmin } from "../../../shared/services/auth.service.js";

export async function loginSuperAdmin(email, password) {

    try {

        // =====================================================
        // Firebase Authentication + Role/Status Verification
        //
        // loginPlatformSuperAdmin() (auth.service.js):
        //   1. Signs in with Firebase Auth
        //   2. Requires a verified email
        //   3. Waits for session.store.js to resolve the
        //      Firestore user doc — which itself rejects
        //      any status !== "active" before role is ever set
        //   4. Requires role === "platform_super_admin",
        //      otherwise signs out and throws "auth/access-denied"
        // =====================================================

        const session = await loginPlatformSuperAdmin(email, password);

        return session;

        // =====================================================
        // Navigation is intentionally NOT done here.
        //
        // Services handle auth/session only; the caller
        // (login.controller.js) is the single place responsible
        // for navigating after a successful login.
        // =====================================================

    } catch (error) {

        console.error(error);

        // Re-thrown as-is (not wrapped in a new Error) so that
        // error.code (e.g. "auth/access-denied") survives for
        // login.controller.js to map to the right on-screen
        // message via auth.service.js's mapAuthError().
        throw error;

    }

}
