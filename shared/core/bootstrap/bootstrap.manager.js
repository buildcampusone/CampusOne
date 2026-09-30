/**
 * ==========================================================
 * CampusOne
 * App Bootstrap Manager
 * ----------------------------------------------------------
 * Runs exactly ONCE, on app start, before the router renders
 * its first real page. Owns the decision of "what should the
 * very first screen be" so that decision is never split
 * between main.js's old setTimeout and each page's own
 * session-restore listener.
 *
 * WRONG flow (what this replaces):
 *
 *   Splash -> setTimeout(2s) -> navigate("login")
 *                                     |
 *                          login.controller.js's own
 *                          onSessionChange() fires later
 *                          and navigates again if the
 *                          restored session turns out to
 *                          be a Super Admin
 *
 * This is what produced the "Login flashes for 4-5s before
 * the Super Admin Dashboard appears" bug on refresh — the
 * login page was never actually the right first page, it
 * just always rendered first regardless of session state.
 *
 * CORRECT flow (this file):
 *
 *   Splash
 *     -> Restore Firebase Session (wait for roleResolved)
 *     -> Session?
 *          YES -> Role Check -> route for that role
 *          NO  -> "login"
 *     -> navigate(route)   (called exactly once)
 *
 * Nothing here duplicates session.store.js's single
 * onAuthStateChanged listener — it just subscribes to it via
 * auth.service.js's onSessionChange(), same as every other
 * consumer.
 * ==========================================================
 */

import { onSessionChange } from "../../services/auth.service.js";
import { resolveRouteForRole } from "../auth/role-router.js";

/* ==========================================================
   Route Resolution
   ----------------------------------------------------------
   The role -> route mapping itself now lives in the shared
   resolveRouteForRole() (shared/core/auth/role-router.js), so
   it's never duplicated between this file and
   login.controller.js. This function only adds the two things
   that are specific to bootstrap: the signed-out/unverified
   check, and the "login" fallback for any role that doesn't
   have a route yet (unchanged from previous behavior, where
   login.controller.js itself just shows an alert for roles
   without a dashboard yet).
========================================================== */

function resolveInitialRoute(session) {

    if (!session.user || !session.user.emailVerified) {
        return "login";
    }

    return resolveRouteForRole(session.role) || "login";

}

/* ==========================================================
   Bootstrap
   ----------------------------------------------------------
   Resolves once the session has finished restoring
   (session.roleResolved === true) with the route name the
   app should navigate to. Never resolves more than once —
   the caller is responsible for the actual navigate() call,
   keeping this module free of any router import cycle.
========================================================== */

export function runBootstrap() {

    return new Promise((resolve) => {

        let unsubscribe;

        unsubscribe = onSessionChange((session) => {

            if (!session.roleResolved) return;

            unsubscribe?.();

            resolve(resolveInitialRoute(session));

        });

    });

}
