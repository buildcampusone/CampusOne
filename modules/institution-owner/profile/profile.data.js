/**
 * ==========================================================
 * CampusOne
 * Institution Owner — Profile Data Foundation
 * ----------------------------------------------------------
 * Phase 4.0B — Institution Profile Foundation (Infrastructure
 * Only). No UI, no forms, no rendering — see
 * profile.controller.js for the business-logic layer built on
 * top of this file, and the Phase 4.0A audit for why this file
 * exists in its own module folder.
 * ----------------------------------------------------------
 * Architecture decision (Phase 4.0A audit, Critical Issue 1):
 * this file reads shared/services/auth.service.js's session
 * cache DIRECTLY — the same shared foundation
 * modules/institution-owner/dashboard/dashboard.data.js and
 * modules/institution-owner/topbar/topbar.controller.js both
 * already sit on — instead of importing dashboard.data.js
 * itself. Profile and Dashboard are siblings on one shared
 * session layer, not one depending on the other. Reading here
 * costs ZERO additional Firestore reads: session.store.js
 * already keeps one live onSnapshot listener on
 * institutions/{institutionId} running (started by guards.js
 * before any Owner module ever mounts), and getSessionSnapshot()
 * just returns whatever it already has cached.
 *
 * Unlike dashboard.data.js's buildCurrentInstitution(), this
 * file does NOT trim the institution doc down to a reduced field
 * set — it hands back the raw `.profile` / `.contact` / `.address`
 * / `.branding` / `.subscription` maps as Firestore actually
 * stores them (see registration.controller.js's
 * collectRegistrationPayload() for the schema this mirrors).
 * profile.controller.js decides what to shape/display from this
 * raw data; keeping exactly one place responsible for that
 * shaping avoids the "two places mapping the same profile"
 * duplication the Phase 4.0A audit flagged as a code-quality
 * risk.
 *
 * `owner` below is deliberately NOT institutionData.owner (the
 * denormalized snapshot written once at registration) — it's the
 * live users/{uid} doc (session.userProfile), per the Phase 4.0A
 * audit's Critical Issue 3: the institution document's `owner`
 * object stays a historical registration snapshot; the current,
 * editable Institution Owner identity always comes from
 * users/{uid}, exactly like dashboard.data.js's own
 * buildCurrentOwner() already does.
 * ==========================================================
 */

import {
    getSessionSnapshot,
    onSessionChange
} from "../../../shared/services/auth.service.js";

import {
    getInstitution as fetchInstitutionDoc
} from "../../../shared/services/institution.service.js";

import {
    getCurrentUser as fetchOwnerDoc
} from "../../../shared/services/user.service.js";

/* ==========================================================
   Build — pure transform, session snapshot -> profile model
   ----------------------------------------------------------
   Never called with anything other than a session.store.js
   snapshot shape ({ user, role, institutionId, institutionData,
   userProfile, roleResolved }). `institution` and `owner` are
   `null` (never an invented shape) until the session has
   actually resolved them.
========================================================== */

function buildProfileData(session) {

    return {

        institutionId: session.institutionId || null,

        // Raw institutions/{id} doc as Firestore stores it —
        // .profile / .contact / .address / .branding / .modules /
        // .subscription / .owner (denormalized, historical —
        // see file header) / .createdAt / .updatedAt.
        institution: session.institutionData || null,

        // Live users/{uid} doc — the canonical, editable
        // Institution Owner identity (see file header).
        owner: session.userProfile || null,

        meta: {

            isAuthenticated: Boolean(session.user),
            roleResolved: Boolean(session.roleResolved),
            institutionId: session.institutionId || null,
            generatedAt: new Date().toISOString()

        }

    };

}

/* ==========================================================
   Public API
========================================================== */

/**
 * Synchronous snapshot of the current Profile Data Model. Safe
 * to call at any time — reads whatever session.store.js already
 * has cached via getSessionSnapshot(), no network call, no
 * Firestore read.
 */
export function getProfileData() {

    return buildProfileData(getSessionSnapshot());

}

/**
 * Firestore-ready async form, matching the same await shape
 * dashboard.data.js's own fetchDashboardData() already uses, so
 * a future Profile page loader doesn't need to change how it
 * calls this once real widgets are wired.
 *
 * Default (forceRefresh: false) resolves the live cached
 * snapshot — zero extra Firestore reads, same as
 * getProfileData(). Pass { forceRefresh: true } for an explicit
 * one-off re-read via institution.service.js / user.service.js
 * (e.g. a future "Refresh" action), bypassing the cache for that
 * one call without disturbing session.store.js's own live
 * listener. This is the ONLY path in this file that can cause a
 * duplicate read against the live cache — callers should reach
 * for it deliberately, not by default (Phase 4.0A audit,
 * Firestore Reads section).
 */
export async function fetchProfileData({ forceRefresh = false } = {}) {

    const session = getSessionSnapshot();

    if (!forceRefresh || !session.institutionId || !session.user?.uid) {
        return buildProfileData(session);
    }

    const [institutionData, userProfile] = await Promise.all([
        fetchInstitutionDoc(session.institutionId),
        fetchOwnerDoc(session.user.uid)
    ]);

    return buildProfileData({
        ...session,
        institutionData,
        userProfile
    });

}

/**
 * Reactive subscription: fires immediately with the current
 * Profile Data Model, then again every time session.store.js's
 * single shared listener sees a change (auth state, role
 * resolution, or a live institution-doc update — including the
 * Owner's own profile.controller.js writes landing back through
 * the same listener). Returns an unsubscribe function.
 *
 * Intended way for a future Profile page to stay in sync without
 * polling or opening its own Firestore listener — same contract
 * dashboard.data.js's subscribeDashboardData() already offers.
 */
export function subscribeProfileData(listener) {

    return onSessionChange((session) => {

        listener(buildProfileData(session));

    });

}
