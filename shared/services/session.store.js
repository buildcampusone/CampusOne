/* =========================================
   Session Module
   -----------------------------------------
   Single source of truth for "who is signed
   in, what role do they have, which
   institution do they belong to".

   IMPORTANT: this file owns the ONE
   onAuthStateChanged listener for the whole
   app. Any code that needs auth/role state
   (login page restore, the Super Admin
   guard, the shell, etc.) must subscribe
   through subscribeSession() instead of
   creating its own Firebase listener.
========================================= */

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    doc,
    getDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { auth, db } from "../../firebase/firebase.js";

import { COLLECTIONS } from "../constants/collections.js";
import { USER_STATUS } from "../constants/status.js";

let initialized = false;

let unsubscribeInstitution = null;

const listeners = new Set();

const state = {
    user: null,
    role: null,
    institutionId: null,
    institutionData: null,
    userProfile: null,
    // false while we are still resolving the
    // Firestore user/institution docs after
    // an auth state change.
    roleResolved: false
};

function getSnapshot() {

    return { ...state };

}

function notify() {

    const snapshot = getSnapshot();

    listeners.forEach((listener) => listener(snapshot));

}

function stopInstitutionListener() {

    if (unsubscribeInstitution) {

        unsubscribeInstitution();

        unsubscribeInstitution = null;

    }

    state.institutionData = null;

}

function startInstitutionListener(institutionId) {

    return new Promise((resolveFirstSnapshot) => {

        let firstSnapshotSeen = false;

        unsubscribeInstitution = onSnapshot(

            doc(db, COLLECTIONS.INSTITUTIONS, institutionId),

            (snapshot) => {

                state.institutionData = snapshot.exists()
                    ? snapshot.data()
                    : null;

                if (!firstSnapshotSeen) {

                    firstSnapshotSeen = true;

                    resolveFirstSnapshot();

                }

                notify();

            },

            (error) => {

                console.error("Institution listener failed:", error);

                state.institutionData = null;

                if (!firstSnapshotSeen) {

                    firstSnapshotSeen = true;

                    resolveFirstSnapshot();

                }

            }

        );

    });

}

async function resolveUserDoc(user) {

    try {

        const userSnap = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));

        if (!userSnap.exists()) {

            state.role = null;
            state.institutionId = null;
            state.userProfile = null;

            return;

        }

        const data = userSnap.data();

        // An inactive/disabled user should never resolve to a
        // role or institution, no matter what those fields say.
        if (data.status !== USER_STATUS.ACTIVE) {

            state.role = null;
            state.institutionId = null;
            state.userProfile = null;

            return;

        }

        state.userProfile = data;
        state.role = data.role || null;
        state.institutionId = data.institutionId || null;

        if (state.institutionId) {

            await startInstitutionListener(state.institutionId);

        }

    } catch (error) {

        console.error("Failed to resolve user profile:", error);

        state.role = null;
        state.institutionId = null;
        state.userProfile = null;

    }

}

/**
 * Starts the single global auth listener.
 * Safe to call multiple times; only the
 * first call has any effect.
 */
export function initSessionListener() {

    if (initialized) return;

    initialized = true;

    onAuthStateChanged(auth, async (user) => {

        stopInstitutionListener();

        state.role = null;
        state.institutionId = null;
        state.userProfile = null;
        state.roleResolved = false;

        if (!user) {

            state.user = null;
            state.roleResolved = true;

            notify();

            return;

        }

        await user.reload().catch(() => {});

        state.user = user;

        if (!user.emailVerified) {

            state.roleResolved = true;

            notify();

            return;

        }

        await resolveUserDoc(user);

        state.roleResolved = true;

        notify();

    });

}

/**
 * Subscribe to session changes. Immediately
 * invoked once with the current snapshot.
 * Returns an unsubscribe function.
 */
export function subscribeSession(listener) {

    listeners.add(listener);

    listener(getSnapshot());

    return () => listeners.delete(listener);

}

/**
 * Re-resolves the current user's Firestore doc (and, if
 * present, restarts the institution listener against any new
 * institutionId) and notifies subscribers — without waiting
 * for a fresh onAuthStateChanged firing.
 *
 * Used after a direct Firestore write to the user's own doc
 * (e.g. profile.service.js's updateProfile()) so every consumer
 * of subscribeSession()/getSession() — Topbar, Sidebar, Profile —
 * reflects the change immediately. No-op if nobody is signed in.
 */
export async function refreshCurrentSession() {

    if (!state.user) return;

    stopInstitutionListener();

    await resolveUserDoc(state.user);

    notify();

}

export function getSession() {

    return getSnapshot();

}
