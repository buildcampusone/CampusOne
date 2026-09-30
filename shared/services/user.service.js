/**
 * ==========================================================
 * CampusOne User Service
 * shared/services/user.service.js
 * ==========================================================
 */

import { db } from "../../firebase/firebase.js";

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { COLLECTIONS } from "../constants/collections.js";

/**
 * Get User
 */
export async function getCurrentUser(uid) {

    if (!uid) {
        throw new Error("User UID is required.");
    }

    const userRef = doc(db, COLLECTIONS.USERS, uid);

    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
        return null;
    }

    return {
        id: snapshot.id,
        ...snapshot.data()
    };

}

/**
 * Create User
 */
export async function createUser(uid, userData) {

    if (!uid) {
        throw new Error("User UID is required.");
    }

    const userRef = doc(db, COLLECTIONS.USERS, uid);

    await setDoc(userRef, {

        ...userData,

        createdAt: serverTimestamp(),

        updatedAt: serverTimestamp()

    });

}

/**
 * Update User
 */
export async function updateUser(uid, data) {

    if (!uid) {
        throw new Error("User UID is required.");
    }

    const userRef = doc(db, COLLECTIONS.USERS, uid);

    await updateDoc(userRef, {

        ...data,

        updatedAt: serverTimestamp()

    });

}

/**
 * Delete User
 */
export async function deleteUser(uid) {

    if (!uid) {
        throw new Error("User UID is required.");
    }

    await deleteDoc(
        doc(db, COLLECTIONS.USERS, uid)
    );

}

/**
 * Update Last Login
 */
export async function updateLastLogin(uid) {

    if (!uid) {
        throw new Error("User UID is required.");
    }

    await updateDoc(
        doc(db, COLLECTIONS.USERS, uid),
        {
            lastLogin: serverTimestamp()
        }
    );

}

/**
 * Get User Role
 */
export async function getUserRole(uid) {

    const user = await getCurrentUser(uid);

    if (!user) {
        return null;
    }

    return user.role ?? null;

}

/**
 * Check User Exists
 */
export async function userExists(uid) {

    const user = await getCurrentUser(uid);

    return !!user;

}