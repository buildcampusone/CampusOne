/* =========================================
   auth.service.js
   -----------------------------------------
   Single entry point for Firebase Auth in
   CampusOne.

   RULE: No other file (pages, controllers,
   future dashboards) imports directly from
   "firebase-auth.js". Everything auth-related
   — sign in, sign up, sign out, password
   reset, email verification, role/institution
   lookups, error mapping — goes through here.

   session.store.js remains the single source of
   truth for *auth state* (it owns the one
   onAuthStateChanged listener). This service
   does not duplicate that listener — it reads
   from session.store.js and wraps Firebase SDK calls
   on top of it. Layer, not replacement:

     UI -> Controller -> auth.service.js -> session.store.js -> Firebase
========================================= */

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
    sendEmailVerification,
    sendPasswordResetEmail,
    confirmPasswordReset,
    verifyPasswordResetCode,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    auth,
    googleProvider
} from "../../firebase/firebase.js";

import {
    initSessionListener,
    subscribeSession,
    getSession
} from "./session.store.js";

import { ROLES } from "../constants/roles.js";

import { updateLastLogin } from "./user.service.js";


/* =========================================
   Error Handling
   -----------------------------------------
   Firebase's raw error objects/messages
   should never reach the UI. Every call site
   maps through here instead of hand-rolling
   its own switch statement (login.js,
   register.js and forgot-password.js each
   used to have their own copy of this).
========================================= */

const ERROR_MESSAGES = {
    "auth/invalid-credential": "Invalid email or password.",
    "auth/user-not-found": "User not found.",
    "auth/wrong-password": "Incorrect password.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/missing-email": "Email is required.",
    "auth/weak-password": "Password is too weak. Use at least 6 characters.",
    "auth/network-request-failed": "Network error. Please check your connection.",
    "auth/expired-action-code": "This link has expired. Please request a new one.",
    "auth/invalid-action-code": "This link is invalid or has already been used.",
    "auth/user-disabled": "This account has been disabled. Contact your institution admin.",
    "auth/requires-recent-login": "Please sign in again to continue.",

    // App-level error codes thrown by this
    // service itself (not raw Firebase codes),
    // kept in the same map so every call site
    // uses one mapper regardless of source.
    "auth/email-not-verified": "Please verify your email first. A new verification email has been sent.",
    "auth/role-missing": "Your account has no role assigned. Contact your institution admin.",
    "auth/institution-missing": "Institution not found.",
    "auth/subscription-missing": "Subscription information is missing for your institution.",
    "auth/invalid-institution-code": "Invalid institution code.",
    "auth/session-timeout": "Timed out loading your profile. Please try again.",
    "auth/login-timeout": "Login is taking too long. Please check your connection and try again.",
    "auth/access-denied": "Access Denied. This account is not authorized for the Super Admin Portal."
};

/**
 * Maps any error (Firebase or app-level) to a
 * user-safe message. Returns null for errors
 * that should be silently ignored (e.g. the
 * user closing a Google popup themselves).
 */
export function mapAuthError(error) {

    if (!error) {
        return "Something went wrong. Please try again.";
    }

    if (error.code === "auth/popup-closed-by-user") {
        return null;
    }

    const message = ERROR_MESSAGES[error.code];

    if (!message) {
        logAuthError(error);
        return "Something went wrong. Please try again.";
    }

    return message;

}

/**
 * Centralized logging point. Swap this for a
 * real logging/monitoring service later
 * without touching any call site.
 */
export function logAuthError(error) {

    console.error(
        "[auth.service]",
        error?.code || "unknown",
        error?.message || error
    );

}

/**
 * Retry helper for transient failures
 * (e.g. network blips). Not used for
 * credential checks — only wrap calls where
 * retrying is actually safe (idempotent).
 */
export async function withRetry(fn, { retries = 1, delayMs = 800 } = {}) {

    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {

        try {

            return await fn();

        } catch (error) {

            lastError = error;

            if (attempt < retries) {
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }

        }

    }

    throw lastError;

}


/* =========================================
   Authentication
========================================= */

/**
 * Full login flow: sign in, verify email,
 * wait for role/institution to resolve via
 * session.store.js, and optionally validate the
 * entered institution code against it.
 * Throws app-level error codes (see map
 * above) on any failure — auth state is left
 * clean (signed out) whenever it throws.
 */
export async function login(email, password, institutionCode) {

    const credential = await signInWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    await user.reload();

    if (!user.emailVerified) {

        await sendEmailVerification(user);
        await signOut(auth);

        throw appError("auth/email-not-verified");

    }

    const session = await waitForSessionReady(user.uid);

    if (!session.role) {
        throw appError("auth/role-missing");
    }

    if (!session.institutionId || !session.institutionData) {
        throw appError("auth/institution-missing");
    }

    if (!session.institutionData.subscription) {
        throw appError("auth/subscription-missing");
    }

    if (institutionCode) {

        const valid = validateInstitutionCode(session.institutionData, institutionCode);

        if (!valid) {
            await signOut(auth);
            throw appError("auth/invalid-institution-code");
        }

    }

    // Defensive guard: role/institution should never be set
    // without a resolved userProfile (session.store.js sets
    // them together), but if Firestore ever returns a
    // partial/odd doc, fail closed instead of trusting bare
    // fields. Same guard as loginPlatformSuperAdmin() below.
    if (!session.userProfile) {

        await signOut(auth);
        throw appError("auth/role-missing");

    }

    await updateLastLogin(user.uid);

    return session;

}

/**
 * Login flow for the Platform Super Admin
 * portal (reached via the secret 5-tap logo
 * gesture on the normal login page).
 *
 * Deliberately does NOT reuse login() above:
 * login() requires an institutionId/institutionData
 * /subscription to exist, which platform-level
 * accounts never have. Everything else — real
 * Firebase Auth, email-verification check, and
 * role/status verification — goes through the
 * exact same path as every other login:
 * session.store.js's resolveUserDoc() already
 * rejects any user whose Firestore `status` is
 * not "active" (see session.store.js), so this
 * function does not run a second Firestore
 * lookup — it just waits for that resolution
 * and then checks the resolved role.
 *
 * Throws (and signs the user back out) unless
 * the resolved role is exactly
 * ROLES.PLATFORM_SUPER_ADMIN.
 */
const SUPER_ADMIN_LOGIN_TIMEOUT_MS = 30000;

export async function loginPlatformSuperAdmin(email, password) {

    // Caps the ENTIRE flow — signInWithEmailAndPassword and
    // user.reload() included, not just the Firestore
    // role-resolve step waitForSessionReady() already timed
    // out on. Those two calls have no timeout of their own,
    // so on a slow/unstable connection they're what actually
    // left the login button stuck on "Signing In..." far past
    // any reasonable wait. A valid Super Admin on a working
    // connection resolves in 1-3s, but slower/unstable mobile
    // networks need real headroom, so this is set generously
    // to 30s rather than tight.
    try {

        return await withTimeout(
            _loginPlatformSuperAdmin(email, password),
            SUPER_ADMIN_LOGIN_TIMEOUT_MS,
            "auth/login-timeout"
        );

    } catch (error) {

        // If we timed out, Firebase Auth may have finished
        // signing the user in on the wire after the UI already
        // gave up and reset — sign out defensively so a stale
        // half-authenticated session can't linger into the
        // next attempt (e.g. guards.js suddenly seeing a signed
        // -in user the login screen never told the person about).
        if (error.code === "auth/login-timeout") {
            await signOut(auth).catch(() => {});
        }

        throw error;

    }

}

async function _loginPlatformSuperAdmin(email, password) {

    const credential = await signInWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    await user.reload();

    if (!user.emailVerified) {

        await sendEmailVerification(user);
        await signOut(auth);

        throw appError("auth/email-not-verified");

    }

    const session = await waitForSessionReady(user.uid);

    // session.role is only ever set by session.store.js
    // when the Firestore user doc's status === "active"
    // (see resolveUserDoc() in session.store.js) — an
    // inactive/suspended account resolves to role: null
    // and falls into this same access-denied branch.
    if (session.role !== ROLES.PLATFORM_SUPER_ADMIN) {

        await signOut(auth);
        throw appError("auth/access-denied");

    }

    // Defensive guard: role should never be set without a
    // resolved userProfile (session.store.js sets them
    // together), but if Firestore ever returns a partial/odd
    // doc, fail closed instead of trusting a bare role string.
    if (!session.userProfile) {

        await signOut(auth);
        throw appError("auth/access-denied");

    }

    await updateLastLogin(user.uid);

    return session;

}

export async function loginWithGoogle() {

    try {

        const credential = await signInWithPopup(auth, googleProvider);
        return credential.user;

    } catch (error) {

        if (error.code === "auth/popup-closed-by-user") {
            return null;
        }

        logAuthError(error);
        throw error;

    }

}

export async function logout() {

    await signOut(auth);

}

export async function sendVerificationEmail(user) {

    const target = user || auth.currentUser;

    if (!target) {
        throw new Error("No signed-in user to verify.");
    }

    await sendEmailVerification(target);

}

export async function forgotPassword(email) {

    await sendPasswordResetEmail(auth, email);

}

export async function resetPassword(oobCode, newPassword) {

    await verifyPasswordResetCode(auth, oobCode);
    await confirmPasswordReset(auth, oobCode, newPassword);

}

export async function register(email, password, displayName) {

    const credential = await createUserWithEmailAndPassword(auth, email, password);

    if (displayName) {
        await updateProfile(credential.user, { displayName });
    }

    await sendEmailVerification(credential.user);

    return credential.user;

}

/**
 * Lower-level than register(): creates the
 * Firebase Auth account only, with no profile
 * update and no verification email sent.
 * Intended for flows like institution
 * registration that need the raw credential
 * as one step inside a larger multi-stage
 * transaction (Firestore + Storage) with their
 * own rollback logic — register() above bundles
 * steps that flow can't treat as a single unit.
 */
export async function createAuthAccount(email, password) {

    return createUserWithEmailAndPassword(auth, email, password);

}


/* =========================================
   Session
   -----------------------------------------
   Thin wrapper around session.store.js. Never
   creates a second onAuthStateChanged —
   initSessionListener() is itself guarded
   there and is a no-op after the first call.
========================================= */

export function getCurrentUser() {

    return getSession().user;

}

export function isAuthenticated() {

    const session = getSession();
    return Boolean(session.user && session.user.emailVerified);

}

export function getSessionSnapshot() {

    initSessionListener();
    return getSession();

}

/**
 * Resolves once session.store.js has finished
 * resolving role/institution for the given
 * uid (or for whatever user is currently
 * signed in, if uid is omitted).
 */
export function waitForSessionReady(uid, timeoutMs = 10000) {

    initSessionListener();

    return new Promise((resolve, reject) => {

        let timeoutId;
        let unsubscribe;

        unsubscribe = subscribeSession((session) => {

            if (uid && (!session.user || session.user.uid !== uid)) return;
            if (!session.roleResolved) return;

            clearTimeout(timeoutId);
            unsubscribe?.();
            resolve(session);

        });

        timeoutId = setTimeout(() => {

            unsubscribe?.();
            reject(appError("auth/session-timeout"));

        }, timeoutMs);

    });

}

/**
 * Subscribes to session changes for as long
 * as the caller needs (e.g. session restore
 * on app boot, or a role guard on a
 * dashboard route). Returns an unsubscribe
 * function — callers are responsible for
 * calling it once they no longer need updates,
 * so we don't accumulate listeners across
 * navigations.
 */
export function onSessionChange(callback) {

    initSessionListener();
    return subscribeSession(callback);

}

export async function refreshUser() {

    const user = auth.currentUser;

    if (!user) return null;

    await user.reload();
    return user;

}


/* =========================================
   Role & Institution
========================================= */

export function getUserProfile() {

    const session = getSession();

    return {
        uid: session.user?.uid || null,
        email: session.user?.email || null,
        emailVerified: session.user?.emailVerified || false,
        role: session.role,
        institutionId: session.institutionId,
        // Phase 5.1.5 — only meaningful for Institution Admin /
        // Department Admin profiles; permission.service.js reads
        // this. Institution Owner/Platform Super Admin never need
        // it (they always pass every check), so it's left
        // undefined for them rather than fetched separately.
        permissions: session.userProfile?.permissions || null
    };

}

export function getInstitution() {

    return getSession().institutionData;

}

export function getUserRole() {

    return getSession().role;

}

export function validateInstitutionCode(institutionData, enteredCode) {

    const actual = institutionData?.profile?.code?.trim()?.toUpperCase();
    const entered = enteredCode?.trim()?.toUpperCase();

    return Boolean(actual) && actual === entered;

}


/* =========================================
   Security
========================================= */

export function isEmailVerified() {

    return Boolean(getSession().user?.emailVerified);

}

/**
 * Future-ready: Firebase Admin SDK (server
 * side / Cloud Functions) is what actually
 * disables an account. This just recognizes
 * the resulting client-side error so the UI
 * can show a proper message instead of a
 * generic one.
 */
export function isAccountDisabled(error) {

    return error?.code === "auth/user-disabled";

}

export function hasPermission(allowedRoles = []) {

    const role = getUserRole();
    return Boolean(role) && allowedRoles.includes(role);

}

/**
 * Throws if session.store.js hasn't finished
 * resolving yet or nobody is signed in.
 * Intended for router guards once Phase 1C
 * adds protected routes.
 */
export function requireSession() {

    const session = getSession();

    if (!session.user || !session.roleResolved) {
        throw new Error("Session not ready.");
    }

    return session;

}


/* =========================================
   Internal helpers
========================================= */

function appError(code) {

    const error = new Error(ERROR_MESSAGES[code] || "Something went wrong.");
    error.code = code;
    return error;

}

/**
 * Races `promise` against a timer. If the timer wins, rejects
 * with appError(code) instead of leaving the caller waiting on
 * a Firebase call that has no timeout of its own. The original
 * promise is not cancelled (Firebase gives no way to abort it)
 * — it's left to settle in the background — but the caller
 * moves on immediately once the timer fires.
 */
function withTimeout(promise, ms, code) {

    let timeoutId;

    const timeout = new Promise((_, reject) => {

        timeoutId = setTimeout(() => reject(appError(code)), ms);

    });

    return Promise.race([promise, timeout]).finally(() => {

        clearTimeout(timeoutId);

    });

}
