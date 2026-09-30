/**
 * ==========================================================
 * CampusOne Activity Service
 * shared/services/activity.service.js
 * ----------------------------------------------------------
 * Phase 3.5A — Activity Infrastructure
 * ----------------------------------------------------------
 * Read/write access to the per-institution activity log —
 * institutions/{institutionId}/activity/{activityId} (see
 * shared/constants/collections.js's COLLECTIONS.ACTIVITY and
 * firestore.rules' matching `match` block for why this is a
 * subcollection, not a flat top-level one).
 *
 * FOUNDATION ONLY — this phase does not call logActivity() from
 * anywhere. No existing write path (registration, institution
 * profile updates, etc.) has been touched to actually log an
 * event yet, and no dashboard UI reads through
 * getRecentActivity()/subscribeToActivity() below yet either.
 * Wiring a real caller to logActivity() and wiring Institution
 * Owner Dashboard's Recent Activity widget to
 * getRecentActivity() are both later, separate phases — this
 * phase only builds the service those phases will call. This
 * mirrors dashboard.data.js's own precedent (Phase 3.1 built a
 * fully working Data Foundation with zero dashboard callers on
 * day one; Phase 3.2 was the phase that wired it up).
 *
 * ----------------------------------------------------------
 * Document Schema — institutions/{institutionId}/activity/{activityId}
 * ----------------------------------------------------------
 *   type          string   — one of ACTIVITY_TYPES
 *                             (shared/constants/activity-types.js).
 *                             Validated by logActivity() below;
 *                             an unrecognized value throws rather
 *                             than writing a malformed document.
 *   institutionId string   — denormalized copy of the parent
 *                             institution id. Redundant with the
 *                             document's own path, kept anyway so
 *                             a document is self-describing if it
 *                             is ever read outside its natural
 *                             path context (export, backup,
 *                             collectionGroup query), and so
 *                             firestore.rules can validate
 *                             `request.resource.data.institutionId
 *                             == institutionId` on create without
 *                             a second read.
 *   actor         object   — { uid, name, role } of the signed-in
 *                             user whose action produced this
 *                             entry. Required on every write this
 *                             service makes from client code —
 *                             firestore.rules enforces
 *                             actor.uid == request.auth.uid, so a
 *                             user can only ever log activity as
 *                             themselves. (A future server-side
 *                             writer — e.g. a Cloud Function
 *                             reacting to a payment webhook — runs
 *                             under the Admin SDK, which bypasses
 *                             these rules entirely and could write
 *                             a null/system actor; nothing here
 *                             assumes that today.)
 *   metadata      object   — small, event-specific extra fields
 *                             (e.g. { previousStatus, newStatus }
 *                             for SUBSCRIPTION_STATUS_CHANGED).
 *                             Always optional, defaults to `{}`.
 *                             Deliberately unstructured/per-type
 *                             rather than a rigid schema, same
 *                             reasoning dashboard.controller.js's
 *                             `metadata`-style fields elsewhere
 *                             (e.g. Subscription Overview's
 *                             `usage`) already use — the type
 *                             name is what's validated, not the
 *                             shape of every possible payload.
 *   createdAt     Timestamp — see "Timestamp Strategy" below.
 *
 * ----------------------------------------------------------
 * Timestamp Strategy
 * ----------------------------------------------------------
 * Always Firestore's serverTimestamp() — never `new Date()` or
 * any other client-clock value, same rule institution.service.js
 * already follows for createdAt/updatedAt. A client clock can be
 * wrong, skewed, or manipulated; an activity LOG's entire purpose
 * is to be a trustworthy record of when something happened, so
 * this is non-negotiable, not just a style preference.
 * `serverTimestamp()` resolves to `null` in the write's own local
 * cache until the server confirms it — callers that need the
 * resolved value should re-read, not rely on the object they just
 * wrote with.
 *
 * ----------------------------------------------------------
 * Query Strategy
 * ----------------------------------------------------------
 * `orderBy("createdAt", "desc")` + `limit(n)`, always bounded —
 * never an unbounded `getDocs()` over the whole subcollection.
 * Because this is a subcollection scoped to one institution
 * (rather than a flat collection filtered by a `where
 * ("institutionId", "==", ...)` clause), a single-field index on
 * `createdAt` is all Firestore needs — it creates that
 * automatically, so no firestore.indexes.json change is required
 * for either function below. `getRecentActivity()` accepts an
 * optional `cursor` (a QueryDocumentSnapshot from a previous
 * page's last entry) for future "load more" pagination without
 * needing a second function; nothing in this phase calls it with
 * one yet.
 * ========================================================== */

import { db, auth } from "../../firebase/firebase.js";

import {
    collection,
    doc,
    addDoc,
    getDocs,
    onSnapshot,
    query,
    orderBy,
    limit as fsLimit,
    startAfter,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { COLLECTIONS } from "../constants/collections.js";
import { ACTIVITY_TYPES } from "../constants/activity-types.js";

const DEFAULT_PAGE_SIZE = 10;

/**
 * institutions/{institutionId}/activity collection reference.
 * Every function below goes through this — there is no other
 * place in this file (or meant to be anywhere else in the app)
 * that builds this path by hand.
 */
function activityCollectionRef(institutionId) {

    return collection(
        db,
        COLLECTIONS.INSTITUTIONS,
        institutionId,
        COLLECTIONS.ACTIVITY
    );

}

/**
 * Log Activity
 * ----------------------------------------------------------
 * The single write primitive every event type goes through —
 * deliberately one function parametrized by `type`, not one
 * function per event (logInstitutionCreated(),
 * logSubscriptionActivated(), etc.), so there is exactly one
 * place that builds the document shape and validates `type`.
 * Per-type convenience wrappers, if ever wanted, belong in the
 * caller (whichever future phase wires registration.controller.js
 * or institution.service.js to actually call this), not here.
 *
 * @param {string} institutionId
 * @param {object} entry
 * @param {string} entry.type - one of ACTIVITY_TYPES.
 * @param {{ uid: string, name?: string, role?: string }} entry.actor
 * @param {object} [entry.metadata]
 * @returns {Promise<string>} the new activity document's id.
 */
export async function logActivity(institutionId, { type, actor, metadata = {} } = {}) {

    if (!institutionId) {
        throw new Error("Institution ID is required.");
    }

    if (!Object.values(ACTIVITY_TYPES).includes(type)) {
        throw new Error(`Unrecognized activity type: "${type}".`);
    }

    if (!actor?.uid) {
        throw new Error("actor.uid is required to log activity.");
    }

    const docRef = await addDoc(activityCollectionRef(institutionId), {

        type,

        institutionId,

        actor: {
            uid: actor.uid,
            name: actor.name ?? null,
            role: actor.role ?? null
        },

        metadata,

        createdAt: serverTimestamp()

    });

    return docRef.id;

}

/**
 * Get Recent Activity
 * ----------------------------------------------------------
 * One-shot read (getDocs, not a listener) of the most recent
 * activity entries, newest first. One-shot rather than
 * real-time on purpose: a live onSnapshot listener per dashboard
 * load would be a second listener alongside session.store.js's
 * existing institution listener, which is exactly the "zero
 * duplicate listeners" constraint every dashboard integration
 * phase (3.2–3.4) has held to. A future dashboard-wiring phase
 * that wants this can call it the same way dashboard.data.js's
 * fetchDashboardData() is called — once, cached, refreshed on
 * demand — not subscribeToActivity() below.
 *
 * @param {string} institutionId
 * @param {object} [options]
 * @param {number} [options.limit] - defaults to 10.
 * @param {import("firebase/firestore").QueryDocumentSnapshot} [options.cursor] -
 *   last document from a previous page, for pagination. Omit for
 *   the first page.
 * @returns {Promise<{ entries: Array<object>, lastDoc: import("firebase/firestore").QueryDocumentSnapshot|null }>}
 *   `entries` is plain data (`{ id, ...docData }` per entry, same
 *   `{ id, ...snapshot.data() }` convention institution.service.js's
 *   getInstitution() already uses) — never raw QueryDocumentSnapshots.
 *   `lastDoc` is the raw snapshot the caller passes back in as
 *   `cursor` for the next page; `null` once fewer than a full page
 *   came back (nothing more to fetch).
 */
export async function getRecentActivity(institutionId, { limit = DEFAULT_PAGE_SIZE, cursor } = {}) {

    if (!institutionId) {
        throw new Error("Institution ID is required.");
    }

    const constraints = [
        orderBy("createdAt", "desc"),
        fsLimit(limit)
    ];

    if (cursor) {
        constraints.splice(1, 0, startAfter(cursor));
    }

    const collectionRef = activityCollectionRef(institutionId);

    let snapshot;

    try {

        snapshot = await getDocs(query(collectionRef, ...constraints));

    } catch (error) {

        // Diagnostic only — logs everything needed to identify a
        // real Firestore rejection at its actual source, then
        // rethrows unchanged. Never suppressed: the caller
        // (dashboard.controller.js's loadRecentActivityIntoCache())
        // still receives and handles this exact error exactly as
        // before.
        console.error("[CampusOne] getRecentActivity() Firestore query failed:", {
            code: error?.code || null,
            message: error?.message || String(error),
            stack: error?.stack || null,
            queryPath: collectionRef.path,
            institutionId,
            uid: auth.currentUser?.uid || null
        });

        throw error;

    }

    const entries = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
    }));

    return {
        entries,
        lastDoc: snapshot.docs.length === limit
            ? snapshot.docs[snapshot.docs.length - 1]
            : null
    };

}

/**
 * Subscribe To Activity
 * ----------------------------------------------------------
 * Real-time variant of getRecentActivity() — a live listener on
 * the same bounded, ordered query. Exists for completeness (a
 * true "live activity feed" UI, if one is ever built, needs
 * this rather than polling getRecentActivity() on a timer) but,
 * per this phase's own scope, nothing calls it yet. Returns the
 * listener's own unsubscribe function, same convention
 * session.store.js's subscribeSession() already uses — the
 * caller owns the listener's lifecycle and must call this when
 * done, exactly like every other listener in this codebase.
 *
 * @param {string} institutionId
 * @param {(entries: Array<object>) => void} listener
 * @param {object} [options]
 * @param {number} [options.limit] - defaults to 10.
 * @returns {() => void} unsubscribe function.
 */
export function subscribeToActivity(institutionId, listener, { limit = DEFAULT_PAGE_SIZE } = {}) {

    if (!institutionId) {
        throw new Error("Institution ID is required.");
    }

    const activityQuery = query(
        activityCollectionRef(institutionId),
        orderBy("createdAt", "desc"),
        fsLimit(limit)
    );

    return onSnapshot(activityQuery, (snapshot) => {

        const entries = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data()
        }));

        listener(entries);

    });

}

/**
 * Get Activity Ref
 * ----------------------------------------------------------
 * Escape hatch for a caller that needs the bare document
 * reference (e.g. to read a single entry back after logActivity()
 * resolves an id) without duplicating activityCollectionRef()'s
 * path-building logic. Not expected to be a commonly used export —
 * getRecentActivity()/subscribeToActivity() cover the normal
 * read paths.
 */
export function getActivityDocRef(institutionId, activityId) {

    if (!institutionId || !activityId) {
        throw new Error("Institution ID and activity ID are required.");
    }

    return doc(
        db,
        COLLECTIONS.INSTITUTIONS,
        institutionId,
        COLLECTIONS.ACTIVITY,
        activityId
    );

}
