/**
 * ==========================================================
 * CampusOne Institution Service
 * shared/services/institution.service.js
 * ==========================================================
 */

import { db } from "../../firebase/firebase.js";

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    query,
    where,
    collection,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { COLLECTIONS } from "../constants/collections.js";

/**
 * Create Institution
 */
export async function createInstitution(institutionId, institutionData) {

    if (!institutionId) {
        throw new Error("Institution ID is required.");
    }

    const institutionRef = doc(
        db,
        COLLECTIONS.INSTITUTIONS,
        institutionId
    );

    await setDoc(institutionRef, {
        ...institutionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

}

/**
 * Get Institution
 */
export async function getInstitution(institutionId) {

    if (!institutionId) {
        throw new Error("Institution ID is required.");
    }

    const snapshot = await getDoc(
        doc(db, COLLECTIONS.INSTITUTIONS, institutionId)
    );

    if (!snapshot.exists()) {
        return null;
    }

    return {
        id: snapshot.id,
        ...snapshot.data()
    };

}

/**
 * Update Institution
 */
export async function updateInstitution(institutionId, data) {

    const payload = {
        ...data,
        updatedAt: serverTimestamp()
    };

    await updateDoc(
        doc(db, COLLECTIONS.INSTITUTIONS, institutionId),
        payload
    );

}

/**
 * Delete Institution
 */
export async function deleteInstitution(institutionId) {

    await deleteDoc(
        doc(db, COLLECTIONS.INSTITUTIONS, institutionId)
    );

}

/**
 * Check Institution Exists
 */
export async function institutionExists(institutionId) {

    const institution = await getInstitution(institutionId);

    return !!institution;

}

/**
 * Get Institution By Code
 */
export async function getInstitutionByCode(code) {

    const q = query(
        collection(db, COLLECTIONS.INSTITUTIONS),
        where("institutionCode", "==", code)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return null;
    }

    const docSnap = snapshot.docs[0];

    return {
        id: docSnap.id,
        ...docSnap.data()
    };

}

/**
 * Check Code Exists
 */
export async function checkInstitutionCodeExists(code) {

    const institution = await getInstitutionByCode(code);

    return !!institution;

}

/**
 * Update Subscription
 */
export async function updateSubscription(
    institutionId,
    subscriptionData
) {

    await updateInstitution(institutionId, {
        subscription: subscriptionData
    });

}

/**
 * Update Institution Status
 */
export async function updateInstitutionStatus(
    institutionId,
    status
) {

    await updateInstitution(institutionId, {
        status
    });

}

/**
 * Generate Institution ID
 * Reserves a new Firestore document ID under the institutions
 * collection without writing any data yet. Lets a caller (e.g.
 * the registration wizard) know the institutionId ahead of time,
 * so it can be used for file-upload paths and the code claim
 * before the institution document itself is written.
 */
export function generateInstitutionId() {

    return doc(collection(db, COLLECTIONS.INSTITUTIONS)).id;

}

/**
 * Claim Institution Code
 * Atomically reserves a human-readable institution code using a
 * dedicated `institutionCodes/{code}` claim document, instead of
 * a plain read-then-write on the institution document itself. A
 * transaction fails atomically if two callers race for the same
 * code, so there is no window where both can "pass" the
 * uniqueness check and one silently overwrites the other's data.
 * Throws an error with code "app/code-taken" if already claimed.
 */
export async function claimInstitutionCode(
    institutionCode,
    { institutionId, claimedBy }
) {

    if (!institutionCode) {
        throw new Error("Institution code is required.");
    }

    const codeRef = doc(
        db,
        COLLECTIONS.INSTITUTION_CODES,
        institutionCode
    );

    await runTransaction(db, async (transaction) => {

        const codeSnapshot = await transaction.get(codeRef);

        if (codeSnapshot.exists()) {

            const takenError =
                new Error("Institution code already taken.");

            takenError.code = "app/code-taken";

            throw takenError;

        }

        transaction.set(codeRef, {

            institutionId,

            claimedBy,

            claimedAt: serverTimestamp()

        });

    });

}

/**
 * Release Institution Code
 * Rolls back a code claim made by claimInstitutionCode(), e.g.
 * when a later registration step fails and the whole attempt
 * needs to be undone. Safe to call even if nothing was claimed —
 * failures are swallowed so a rollback can never itself throw.
 */
export async function releaseInstitutionCode(institutionCode) {

    if (!institutionCode) return;

    await deleteDoc(
        doc(db, COLLECTIONS.INSTITUTION_CODES, institutionCode)
    ).catch(() => {});

}