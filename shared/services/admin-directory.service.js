/**
 * ==========================================================
 * CampusOne
 * Institution Admin Directory — Repository
 * shared/services/admin-directory.service.js
 * ----------------------------------------------------------
 * Phase 5.1.4 — Firebase CRUD Integration
 *
 * Repository layer for the users/{uid} documents whose
 * `role` is ROLES.INSTITUTION_ADMIN (or the reserved
 * ROLES.DEPARTMENT_ADMIN), scoped to a single institution.
 * Sits under admin-management.controller.js and
 * create-admin.controller.js the same way user.service.js
 * sits under every other controller in the app:
 *
 *   Page -> Controller -> Repository (this file) -> Firestore
 *
 * No DOM, no UI strings, no toast/alert calls — every function
 * here either resolves with plain data or throws a normalized
 * Error whose `.code` starts with "admin/" (see mapAdminError()
 * at the bottom). Callers map that code to UI copy, exactly
 * the same split auth.service.js's mapAuthError() already
 * established for login/register.
 * ========================================================== */

import { db, auth, getAdminCreationAuthApp } from "../../firebase/firebase.js";

import {
    collection,
    query,
    where,
    getDocs,
    doc,
    setDoc,
    updateDoc,
    serverTimestamp,
    Timestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    deleteUser,
    signOut,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import { COLLECTIONS } from "../constants/collections.js";
import { ROLES } from "../constants/roles.js";
import { USER_STATUS } from "../constants/status.js";
import { DEFAULT_PERMISSIONS } from "../constants/permissions.js";

const ADMIN_ROLES = [ROLES.INSTITUTION_ADMIN, ROLES.DEPARTMENT_ADMIN];

/* ==========================================================
   Mapping Helpers
   ----------------------------------------------------------
   Firestore Timestamps don't survive `new Date(...)` the way
   admin-directory.filters.js's sortAdmins() expects (it does
   `new Date(admin.createdAt)`, which mock-admins.js always fed
   an ISO string). Converting here — once, at the repository
   boundary — means the filter engine, the card component, and
   every other consumer keep working unmodified, per Phase
   5.1.4's "no UI/filter changes" scope.
========================================================== */

function toIsoString(value) {

    if (!value) return null;

    if (value instanceof Timestamp) return value.toDate().toISOString();

    if (typeof value?.toDate === "function") return value.toDate().toISOString();

    return value;

}

function mapAdminDoc(snapshot) {

    const data = snapshot.data();

    return {
        id: snapshot.id,
        fullName: data.fullName ?? "",
        designation: data.designation ?? "",
        email: data.email ?? "",
        mobile: data.mobile ?? "",
        department: data.department ?? "",
        status: data.status ?? USER_STATUS.PENDING,
        role: data.role ?? ROLES.INSTITUTION_ADMIN,
        institutionId: data.institutionId ?? null,
        permissions: data.permissions ?? null,
        createdAt: toIsoString(data.createdAt),
        updatedAt: toIsoString(data.updatedAt),
        lastLogin: toIsoString(data.lastLogin)
    };

}

/* ==========================================================
   Read
========================================================== */

/**
 * All Institution Admin (+ Department Admin) documents scoped
 * to one institution. Unfiltered/unsorted by design — the
 * ordered search -> status -> department -> sort reduction
 * stays in admin-directory.filters.js, composed by
 * admin-management.controller.js, per this phase's Locked
 * Scope ("do not duplicate filtering logic").
 *
 * @param {string} institutionId
 * @returns {Promise<Array<object>>}
 */
export async function listInstitutionAdmins(institutionId) {

    if (!institutionId) {
        throw adminError("admin/institution-missing");
    }

    try {

        const adminsQuery = query(
            collection(db, COLLECTIONS.USERS),
            where("institutionId", "==", institutionId),
            where("role", "in", ADMIN_ROLES)
        );

        const snapshot = await getDocs(adminsQuery);

        return snapshot.docs.map(mapAdminDoc);

    } catch (error) {

        throw mapAdminError(error);

    }

}

/* ==========================================================
   Create
   ----------------------------------------------------------
   Two-step, best-effort-atomic write:
     1. Firebase Auth account (secondary app — see
        firebase/firebase.js's getAdminCreationAuthApp() for
        why the primary `auth` instance is never used here).
     2. Firestore users/{uid} document.
   If step 2 fails, step 1 is rolled back (the just-created
   Auth account is deleted) so a Firestore failure never
   leaves an orphaned, doc-less login floating in the project
   — the "Partial failure (Auth success but Firestore
   failure)" case this phase's spec calls out explicitly.
========================================================== */

function generateTempPassword() {

    // Never shown to, or typed by, anyone — the account holder
    // sets their own password via the reset email sent below.
    // Only needs to satisfy Firebase Auth's own minimum (6+
    // chars); the extra length/character mix is just defense
    // in depth against the few hours before that email is used.
    const random = crypto.getRandomValues(new Uint8Array(24));

    return Array.from(random, (byte) => byte.toString(36))
        .join("")
        .slice(0, 24) + "Aa1!";

}

/**
 * Creates one Institution Admin: a Firebase Auth account plus
 * its users/{uid} Firestore document, then emails the new
 * admin a "set your password" link. Preserves
 * create-admin.controller.js's existing buildPayload() shape —
 * this function adds institutionId/createdBy (neither of which
 * the create-admin form collects) and nothing else.
 *
 * @param {{fullName:string, designation:string, email:string, mobile:string, department:string, status:string, role:string}} payload
 * @param {{institutionId:string, createdBy:string}} context
 * @returns {Promise<object>} the created admin, shaped like listInstitutionAdmins() rows
 */
export async function createInstitutionAdmin(payload, { institutionId, createdBy }) {

    if (!institutionId || !createdBy) {
        throw adminError("admin/institution-missing");
    }

    const secondaryAuth = getAuth(getAdminCreationAuthApp());

    let credential;

    try {

        credential = await createUserWithEmailAndPassword(
            secondaryAuth,
            payload.email,
            generateTempPassword()
        );

    } catch (error) {

        throw mapAdminError(error);

    }

    const uid = credential.user.uid;

    try {

        await setDoc(doc(db, COLLECTIONS.USERS, uid), {

            uid,
            fullName: payload.fullName,
            designation: payload.designation,
            email: payload.email,
            mobile: payload.mobile,
            department: payload.department,
            status: payload.status || USER_STATUS.ACTIVE,
            role: payload.role || ROLES.INSTITUTION_ADMIN,
            institutionId,
            permissions: { ...DEFAULT_PERMISSIONS },
            createdBy,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLogin: null

        });

    } catch (firestoreError) {

        // Rollback: an Auth account with no Firestore doc can
        // never resolve a role (session.store.js requires the
        // doc), so it would otherwise sit orphaned forever.
        await deleteUser(credential.user).catch(() => {});

        await signOut(secondaryAuth).catch(() => {});

        throw mapAdminError(firestoreError, { partial: true });

    }

    try {

        // Lets the new admin set their own password rather than
        // this app ever generating/storing/transmitting one.
        // Uses the PRIMARY auth instance — sendPasswordResetEmail
        // doesn't require a signed-in user, and doing it here
        // (not on secondaryAuth) keeps the secondary app used for
        // nothing but account creation.
        await sendPasswordResetEmail(auth, payload.email);

    } catch (error) {

        // Non-fatal: the admin record and login both exist; the
        // Owner can resend an invite later. Never rolled back for
        // this alone.
    }

    await signOut(secondaryAuth).catch(() => {});

    return {
        id: uid,
        ...payload,
        institutionId,
        createdBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: null
    };

}

/* ==========================================================
   Update
========================================================== */

/**
 * Status change only (Active/Suspended/Pending) — the one
 * update path this phase's Deliverables call out by name.
 * Profile-field edits (name/designation/mobile/department) go
 * through updateInstitutionAdminProfile() below so each stays
 * a small, single-purpose write matching firestore.rules'
 * narrow `affectedKeys()` allow-list for Institution Owners.
 *
 * @param {string} uid
 * @param {string} status one of USER_STATUS
 */
export async function updateInstitutionAdminStatus(uid, status) {

    if (!uid) throw adminError("admin/not-found");

    try {

        await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
            status,
            updatedAt: serverTimestamp()
        });

    } catch (error) {

        throw mapAdminError(error);

    }

}

/**
 * Profile-field edit (designation/mobile/department) — never
 * touches role/status/institutionId/email, so it can't be used
 * to smuggle a privilege change through this narrower path.
 *
 * @param {string} uid
 * @param {{designation?:string, mobile?:string, department?:string, fullName?:string}} data
 */
export async function updateInstitutionAdminProfile(uid, data) {

    if (!uid) throw adminError("admin/not-found");

    const { role, status, institutionId, email, ...safeData } = data;

    try {

        await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
            ...safeData,
            updatedAt: serverTimestamp()
        });

    } catch (error) {

        throw mapAdminError(error);

    }

}

/* ==========================================================
   Delete / Deactivate
   ----------------------------------------------------------
   "Architecture-ready" per this phase's spec, not wired to any
   UI button yet. Deletion is a status flip (SUSPENDED-style
   soft delete) rather than a hard deleteDoc()/deleteUser() —
   a client SDK can only delete the currently-signed-in Auth
   user, never an arbitrary other account, so a real hard
   delete needs Cloud Functions / Admin SDK, not this phase.
========================================================== */

export async function deactivateInstitutionAdmin(uid) {

    return updateInstitutionAdminStatus(uid, USER_STATUS.SUSPENDED);

}

/* ==========================================================
   Error Normalization
   ----------------------------------------------------------
   Mirrors auth.service.js's mapAuthError()/appError() split:
   callers (controllers) never see a raw Firebase error object,
   only an Error with a stable `.code` they can switch on to
   decide which field/toast to show.
========================================================== */

function adminError(code, message) {

    const error = new Error(message || ADMIN_ERROR_MESSAGES[code] || "Something went wrong.");

    error.code = code;

    return error;

}

const ADMIN_ERROR_MESSAGES = {
    "admin/institution-missing": "Your institution could not be found. Please sign in again.",
    "admin/duplicate-email": "An administrator with this email already exists.",
    "admin/network-error": "Network error. Please check your connection and try again.",
    "admin/permission-denied": "You don't have permission to perform this action.",
    "admin/partial-failure": "The administrator's login was created, but saving their details failed. Please try again — no duplicate account will be created.",
    "admin/not-found": "This administrator could not be found.",
    "admin/unknown": "Something went wrong. Please try again."
};

function mapAdminError(error, { partial = false } = {}) {

    if (partial) return adminError("admin/partial-failure");

    const code = error?.code;

    if (code === "auth/email-already-in-use") {
        return adminError("admin/duplicate-email");
    }

    if (code === "auth/network-request-failed" || code === "unavailable") {
        return adminError("admin/network-error");
    }

    if (code === "permission-denied") {
        return adminError("admin/permission-denied");
    }

    console.error("[admin-directory.service]", code || "unknown", error?.message || error);

    return adminError("admin/unknown");

}
