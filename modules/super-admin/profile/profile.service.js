/**
 * ==========================================================
 * CampusOne
 * Super Admin Profile Service
 * ----------------------------------------------------------
 * Mock data layer for Phase 1. Every function here is the
 * seam where real Firebase calls plug in later — shapes are
 * kept identical to what Firestore/Auth/Storage will return
 * so the controller/page never need to change.
 * ==========================================================
 */

import { auth } from "../../../firebase/firebase.js";

import {
    getCurrentUser,
    updateUser
} from "../../../shared/services/user.service.js";

import { refreshCurrentSession } from "../../../shared/services/session.store.js";

// Future Firebase Imports (still mocked below)
// import { db, storage } from "../../../firebase/firebase.js";
// import { updatePassword, updateEmail } from "firebase/auth";
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Fired on window whenever the profile is created/changed, so
// any mounted UI (Topbar avatar/name, Profile page, etc.) can
// stay in sync without polling or tight coupling to this file.
export const PROFILE_UPDATED_EVENT = "campusone:profile-updated";

const DEFAULT_PROFILE = {

    photoURL: "",

    fullName: "",
    displayName: "",

    role: "",
    designation: "",
    institution: "",

    email: "",
    phone: "",

    username: "",
    adminId: "",

    status: "",

    lastLogin: null,
    joinedDate: null,

    dob: "",
    gender: "",
    country: "",
    state: "",
    city: "",
    address: "",

    timezone: "Asia/Kolkata",
    language: "English"

};

const MOCK_LOGIN_HISTORY = [
    { device: "Chrome · Windows", location: "Jaipur, India", ip: "49.36.XX.XX", time: new Date(Date.now() - 1000 * 60 * 30).toISOString(), status: "Success" },
    { device: "Chrome · Android", location: "Jaipur, India", ip: "103.21.XX.XX", time: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(), status: "Success" },
    { device: "Safari · iPhone", location: "Delhi, India", ip: "157.44.XX.XX", time: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), status: "Failed" }
];

const MOCK_SESSIONS = [
    { id: "sess-1", device: "Chrome · Windows", location: "Jaipur, India", lastActive: new Date().toISOString(), current: true },
    { id: "sess-2", device: "Chrome · Android", location: "Jaipur, India", lastActive: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), current: false }
];

/* ==========================================================
   Profile
========================================================== */

// Firestore stores role as a snake_case slug (e.g. "platform_super_admin").
// This turns it into a display-friendly label ("Platform Super Admin").
function formatRole(role) {

    return role
        ?.replaceAll("_", " ")
        .replace(/\b\w/g, c => c.toUpperCase());

}

export async function getProfile() {

    const firebaseUser = auth.currentUser;

    if (!firebaseUser) {
        throw new Error("No authenticated user.");
    }

    const user = await getCurrentUser(firebaseUser.uid);

    if (!user) {
        throw new Error("User profile not found.");
    }

    return {

        ...DEFAULT_PROFILE,

        photoURL: user.photoURL,

        fullName: user.fullName,
        displayName: user.fullName,

        role: formatRole(user.role),

        designation: user.designation,

        institution: user.institutionName,

        email: user.email,

        phone: user.phone,

        username: user.username,

        adminId: user.adminId,

        status: user.status,
        
        dob: user.dob || "",

        gender: user.gender,

        country: user.country,

        state: user.state,

        city: user.city,

        address: user.address,

        timezone: user.timezone,

        language: user.language,

        lastLogin: user.lastLogin?.toDate?.()?.toISOString() || null,

        joinedDate: user.createdAt?.toDate?.()?.toISOString() || null

    };

}

export async function updateProfile(partialData) {

    const firebaseUser = auth.currentUser;

    if (!firebaseUser) {
        throw new Error("No authenticated user.");
    }

    await updateUser(firebaseUser.uid, partialData);

    await refreshCurrentSession();

    const next = await getProfile();

    broadcastProfileUpdate(next);

    return next;

}

export async function uploadProfilePhoto(dataUrl) {

    // TODO: replace with
    // const fileRef = ref(storage, `platformUsers/${auth.currentUser.uid}/avatar.jpg`);
    // await uploadBytes(fileRef, blob);
    // const url = await getDownloadURL(fileRef);

    return updateProfile({ photoURL: dataUrl });

}

export async function removeProfilePhoto() {

    // TODO: replace with
    // await deleteObject(ref(storage, `platformUsers/${auth.currentUser.uid}/avatar.jpg`));

    return updateProfile({ photoURL: "" });

}

function broadcastProfileUpdate(profile) {

    window.dispatchEvent(
        new CustomEvent(PROFILE_UPDATED_EVENT, { detail: profile })
    );

}

/* ==========================================================
   Security
========================================================== */

export async function changePassword(currentPassword, newPassword) {

    // TODO: replace with
    // const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    // await reauthenticateWithCredential(auth.currentUser, credential);
    // await updatePassword(auth.currentUser, newPassword);

    await new Promise((resolve) => setTimeout(resolve, 600));

    if (!currentPassword) {
        throw new Error("Current password is required.");
    }

    return { success: true };

}

export async function getLoginHistory() {

    // TODO: replace with a Firestore query on a
    // "loginHistory" sub-collection, ordered by time desc.

    return [...MOCK_LOGIN_HISTORY];

}

export async function getActiveSessions() {

    // TODO: replace with real session records
    // (Firestore doc per session, or Firebase Auth
    // multi-device session listing once available).

    return [...MOCK_SESSIONS];

}

export async function revokeSession(sessionId) {

    // TODO: delete the session's Firestore record and
    // invalidate its refresh token server-side.

    return { success: true, sessionId };

}

export async function revokeAllSessions() {

    // TODO: revoke all Firebase refresh tokens for this
    // user (Admin SDK: auth.revokeRefreshTokens(uid)).

    return { success: true };

}
