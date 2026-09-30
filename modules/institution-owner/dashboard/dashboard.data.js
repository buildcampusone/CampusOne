/**
 * ==========================================================
 * CampusOne
 * Institution Owner — Dashboard Data Foundation
 * ----------------------------------------------------------
 * Phase 3.1
 * ----------------------------------------------------------
 * Single reusable data layer for the Institution Owner
 * Dashboard. Every widget built in later phases
 * (dashboard.controller.js's fetchQuickStats(),
 * fetchInstitutionHealth(), fetchSubscriptionOverview(),
 * fetchResourceUsage(), etc.) is expected to read from this
 * file instead of touching Firestore or a shared service
 * directly — this is the ONLY file in the Owner Dashboard that
 * imports a Firestore-backed shared service.
 *
 * Reuses existing shared services only — nothing here opens a
 * new Firestore connection, listener, or collection:
 *
 *   - shared/services/auth.service.js
 *       getSessionSnapshot() -> current cached session (user,
 *       role, institutionId, institutionData, userProfile,
 *       roleResolved). Thin wrapper around session.store.js's
 *       single onAuthStateChanged + institution onSnapshot
 *       listener, already running (guards.js starts it before
 *       this dashboard ever mounts) — reading it here costs
 *       zero additional Firestore reads.
 *       onSessionChange() -> reactive subscription to the same
 *       cache, for live updates (e.g. Firestore-pushed
 *       subscription/plan changes) without polling.
 *   - shared/services/institution.service.js
 *       getInstitution(institutionId) -> one-off Firestore
 *       getDoc, used only for an explicit forceRefresh (the
 *       live cache above is the default path).
 *   - shared/services/user.service.js
 *       getCurrentUser(uid) -> one-off Firestore getDoc for the
 *       signed-in Owner's own users/{uid} doc, same forceRefresh
 *       role as getInstitution() above.
 *   - modules/institution-owner/router/modules.registry.js
 *       MODULES -> static config, not Firestore. Reused for
 *       Basic Dashboard Statistics exactly the way
 *       dashboard.controller.js's existing buildQuickStats()
 *       already counts "ready" modules today.
 *
 * Document shape this file reads (established by
 * modules/institution/registration/registration.controller.js's
 * collectRegistrationPayload() + shared/services/auth.service.js's
 * login() guard, not invented here):
 *
 *   institutions/{institutionId}
 *     .profile     { name, code, type, establishedYear,
 *                    affiliation, description }
 *     .contact     { email, mobile, website }
 *     .address     { country, state, district, city, pinCode,
 *                    fullAddress, mapLink, latitude, longitude }
 *     .owner       { fullName, designation, email, mobile, uid,
 *                    photoUrl }
 *     .branding    { primaryColor, secondaryColor, logoUrl,
 *                    coverUrl, faviconUrl }
 *     .modules     [ ...selected module ids ]
 *     .subscription{ plan, billingCycle, institutionSize,
 *                    status } -- login() already refuses to
 *                    resolve a session without this object, so
 *                    it is reliably present once roleResolved
 *                    is true.
 *     .academicSession -- NOT written by any code path in this
 *                    codebase today. No dedicated service or
 *                    collection exists for it yet. Read
 *                    defensively (same nested-on-institution
 *                    pattern subscription already uses) so this
 *                    foundation needs no changes the day a real
 *                    academic-session feature adds it — until
 *                    then it resolves to an honest `null`, never
 *                    invented data.
 *
 *   users/{uid}
 *     { uid, institutionId, role, status, fullName, email,
 *       phone, designation, photoURL, createdAt, updatedAt,
 *       lastLogin }
 *
 * No UI, no rendering, no widget wiring in this file — see the
 * file header rules dashboard.controller.js already documents
 * for itself; this phase adds the data layer underneath it,
 * nothing above it.
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

import {
    MODULES
} from "../router/modules.registry.js";

/* ==========================================================
   Build — pure transform, session snapshot -> dashboard model
   ----------------------------------------------------------
   Never called with anything other than a session.store.js
   snapshot shape ({ user, role, institutionId, institutionData,
   userProfile, roleResolved }). Every field on the returned
   model is either read straight off that snapshot, or an
   honest null/placeholder when the source doesn't exist yet —
   no field is ever invented.
========================================== */

function buildDashboardData(session) {

    const institutionData = session.institutionData || null;
    const userProfile = session.userProfile || null;

    return {

        institution: buildCurrentInstitution(session, institutionData),

        owner: buildCurrentOwner(session, userProfile),

        subscription: buildCurrentSubscription(institutionData),

        academicSession: buildCurrentAcademicSession(institutionData),

        stats: buildBasicStatistics(institutionData),

        meta: {

            isAuthenticated: Boolean(session.user),
            roleResolved: Boolean(session.roleResolved),
            institutionId: session.institutionId || null,
            generatedAt: new Date().toISOString()

        }

    };

}

/* ==========================================================
   Current Institution
========================================== */

function buildCurrentInstitution(session, institutionData) {

    if (!institutionData) {

        return {
            id: session.institutionId || null,
            name: null,
            code: null,
            type: null,
            establishedYear: null,
            email: null,
            mobile: null,
            website: null,
            address: null,
            logoUrl: null,
            primaryColor: null,
            secondaryColor: null,
            selectedModules: [],
            createdAt: null,
            updatedAt: null
        };

    }

    const profile = institutionData.profile || {};
    const contact = institutionData.contact || {};
    const branding = institutionData.branding || {};

    return {
        id: session.institutionId || null,
        name: profile.name ?? null,
        code: profile.code ?? null,
        type: profile.type ?? null,
        establishedYear: profile.establishedYear ?? null,
        email: contact.email ?? null,
        mobile: contact.mobile ?? null,
        website: contact.website ?? null,
        address: institutionData.address ?? null,
        logoUrl: branding.logoUrl ?? null,
        primaryColor: branding.primaryColor ?? null,
        secondaryColor: branding.secondaryColor ?? null,
        selectedModules: Array.isArray(institutionData.modules) ? institutionData.modules : [],
        createdAt: institutionData.createdAt ?? null,
        updatedAt: institutionData.updatedAt ?? null
    };

}

/* ==========================================================
   Current Owner
   ----------------------------------------------------------
   userProfile is the users/{uid} Firestore doc (session.store.js
   resolves it once per auth-state change). Falls back to the
   bare Firebase Auth user for email/uid when the Firestore doc
   hasn't resolved yet, same defensive shape session.store.js
   itself already applies before roleResolved is true.
========================================== */

function buildCurrentOwner(session, userProfile) {

    return {
        uid: session.user?.uid ?? null,
        fullName: userProfile?.fullName ?? null,
        email: userProfile?.email ?? session.user?.email ?? null,
        phone: userProfile?.phone ?? null,
        designation: userProfile?.designation ?? null,
        photoUrl: userProfile?.photoURL ?? null,
        role: session.role ?? null,
        status: userProfile?.status ?? null,
        emailVerified: session.user?.emailVerified ?? false,
        lastLogin: userProfile?.lastLogin ?? null
    };

}

/* ==========================================================
   Current Subscription
   ----------------------------------------------------------
   Nested on the institution doc (institutionData.subscription),
   the same place shared/services/institution.service.js's own
   updateSubscription() already writes to — no separate
   Firestore collection/service exists for this, so none is
   invented here. shared/services/auth.service.js's login()
   already refuses to resolve a session without this object
   present, so once meta.roleResolved is true this is reliably
   populated for a real Owner session.
========================================== */

function buildCurrentSubscription(institutionData) {

    const subscription = institutionData?.subscription;

    if (!subscription) {
        return null;
    }

    return {
        plan: subscription.plan ?? null,
        billingCycle: subscription.billingCycle ?? null,
        institutionSize: subscription.institutionSize ?? null,
        status: subscription.status ?? null
    };

}

/* ==========================================================
   Current Academic Session
   ----------------------------------------------------------
   No collection, service, or registration-time field for this
   exists anywhere in the codebase today (verified against
   registration.controller.js's collectRegistrationPayload() and
   every shared/services/*.js file). Read defensively off
   institutionData.academicSession — the same nested-field
   pattern subscription above already uses — so this stays a
   one-line change (not a new read path) the day a real
   Academic Session feature starts writing it. Until then this
   is an honest `null`, never a seeded/fake session.
========================================== */

function buildCurrentAcademicSession(institutionData) {

    const academicSession = institutionData?.academicSession;

    if (!academicSession) {
        return null;
    }

    return { ...academicSession };

}

/* ==========================================================
   Basic Dashboard Statistics
   ----------------------------------------------------------
   Derived from static config (MODULES) and whatever's already
   on the cached institution doc — no separate Firestore read.
   Same "count what's real, don't invent a number" discipline
   dashboard.controller.js's existing buildQuickStats() already
   follows for its Active Modules figure.
========================================== */

function buildBasicStatistics(institutionData) {

    const activeModuleCount = MODULES.filter(
        (module) => module.status === "ready"
    ).length;

    const selectedModules = Array.isArray(institutionData?.modules)
        ? institutionData.modules
        : null;

    return {
        activeModuleCount,
        totalModuleCount: MODULES.length,
        comingSoonModuleCount: MODULES.length - activeModuleCount,
        selectedModuleCount: selectedModules ? selectedModules.length : null
    };

}

/* ==========================================================
   Public API
========================================== */

/**
 * Synchronous snapshot of the current Dashboard Data Model.
 * Safe to call at any time (e.g. on first render, before a
 * subscription is set up) — reads whatever session.store.js
 * already has cached via getSessionSnapshot(), no network call.
 */
export function getDashboardData() {

    return buildDashboardData(getSessionSnapshot());

}

/**
 * Firestore-ready async form, matching the same await shape
 * dashboard.controller.js's existing fetchWelcomeBannerData() /
 * fetchQuickStats() already use so a future caller doesn't need
 * to change how it calls this once real widgets are wired.
 *
 * Default (forceRefresh: false) resolves the live cached
 * snapshot — zero extra Firestore reads. Pass
 * { forceRefresh: true } to explicitly re-read the institution
 * and Owner documents via institution.service.js /
 * user.service.js (e.g. a future "Refresh" button), bypassing
 * the cache for that one call without disturbing session.store.js's
 * own live listener.
 */
export async function fetchDashboardData({ forceRefresh = false } = {}) {

    const session = getSessionSnapshot();

    if (!forceRefresh || !session.institutionId || !session.user?.uid) {
        return buildDashboardData(session);
    }

    const [institutionData, userProfile] = await Promise.all([
        fetchInstitutionDoc(session.institutionId),
        fetchOwnerDoc(session.user.uid)
    ]);

    return buildDashboardData({
        ...session,
        institutionData,
        userProfile
    });

}

/**
 * Reactive subscription: fires immediately with the current
 * Dashboard Data Model, then again every time session.store.js's
 * single shared listener sees a change (auth state, role
 * resolution, or a live institution-doc update — e.g. a
 * subscription/plan change pushed from elsewhere). Returns an
 * unsubscribe function.
 *
 * This is the intended way for a future widget to stay in sync
 * without polling or opening its own Firestore listener.
 */
export function subscribeDashboardData(listener) {

    return onSessionChange((session) => {

        listener(buildDashboardData(session));

    });

}
