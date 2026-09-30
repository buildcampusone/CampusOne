/**
 * Firestore Collections
 */

export const COLLECTIONS = Object.freeze({
    USERS: "users",

    INSTITUTIONS: "institutions",

    INSTITUTION_CODES: "institutionCodes",

    SUBSCRIPTIONS: "subscriptions",

    // Subcollection: institutions/{institutionId}/activity/{activityId}
    // Not a top-level collection — always accessed nested under a
    // specific institution (see shared/services/activity.service.js),
    // same reasoning firestore.rules already documents for why
    // per-institution data doesn't need a flat collection + a
    // `where("institutionId", "==", ...)` composite index.
    ACTIVITY: "activity"
});

export default COLLECTIONS;