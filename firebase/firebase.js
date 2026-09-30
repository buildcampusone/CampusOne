import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import {
    getStorage
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

const firebaseConfig = {

    apiKey: "AIzaSyDEIn2c2kgyMwwwSMyQg3DDZrNLoJF_fGw",

    authDomain: "campusone-bd5c5.firebaseapp.com",

    projectId: "campusone-bd5c5",

    storageBucket: "campusone-bd5c5.firebasestorage.app",

    messagingSenderId: "1056457840584",

    appId: "1:1056457840584:web:313eb137ebd5aedab912fd"

};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const googleProvider =
    new GoogleAuthProvider();
    
export const db = getFirestore(app);

export const storage = getStorage(app);

/**
 * ==========================================================
 * Secondary App — Admin Provisioning
 * ----------------------------------------------------------
 * Phase 5.1.4 — Firebase CRUD Integration
 *
 * createUserWithEmailAndPassword() against the DEFAULT auth
 * instance signs the browser in as the newly created user,
 * evicting whoever is currently signed in (the Institution
 * Owner running "Create Administrator"). That's a well-known
 * Firebase client-SDK behavior, not a bug in this app.
 *
 * The standard client-side workaround — and what this app
 * uses, since there is no Cloud Functions / Admin SDK backend
 * yet — is a second, independently-initialized Firebase App
 * pointed at the same project, with its own isolated Auth
 * instance. Creating a user there never touches the primary
 * `auth` export above, so the Owner's own session is
 * untouched throughout.
 *
 * Lazily created (not at module load) since most page loads
 * never provision an admin. Reused across calls within the
 * same tab; shared/services/admin-directory.service.js is the
 * only intended caller.
 */
let adminCreationApp = null;

export function getAdminCreationAuthApp() {

    if (!adminCreationApp) {

        adminCreationApp = getApps().some((existing) => existing.name === "AdminCreation")
            ? getApp("AdminCreation")
            : initializeApp(firebaseConfig, "AdminCreation");

    }

    return adminCreationApp;

}