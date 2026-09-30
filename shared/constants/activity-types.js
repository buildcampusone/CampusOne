/**
 * ==========================================================
 * CampusOne Activity Event Types
 * ----------------------------------------------------------
 * Phase 3.5A — Activity Infrastructure
 * ----------------------------------------------------------
 * The closed set of event types any caller of
 * shared/services/activity.service.js's logActivity() is
 * allowed to write. Closed on purpose — an unrecognized `type`
 * is a bug in the caller, not a new kind of activity, so
 * activity.service.js validates against this set before writing
 * anything (see its own header).
 *
 * Each type here corresponds to a REAL write path that already
 * exists somewhere in this codebase today, or is a same-shape
 * variant of one — nothing below is speculative. Institution
 * Owner Dashboard's Recent Activity widget (Phase 3.6+, not this
 * phase) will only ever be able to show events actually logged
 * through one of these types; this phase does not call
 * logActivity() from any existing write path yet — see
 * activity.service.js's own header for why that's deliberately
 * out of scope here.
 * ========================================================== */

export const ACTIVITY_TYPES = Object.freeze({

    // institutions/{id} created — registration.controller.js
    // Stage 4 (self-registration), the one write path that
    // exists today.
    INSTITUTION_CREATED: "institution_created",

    // institutions/{id}.profile / .branding updated — the same
    // update institution.service.js's updateInstitution() (and
    // firestore.rules' `hasOnly(['profile','branding',
    // 'updatedAt'])` owner-update rule) already allow.
    INSTITUTION_PROFILE_UPDATED: "institution_profile_updated",

    // institutions/{id}.subscription.status transitions into
    // "active" or "trial" — mirrors SUBSCRIPTION_STATUS
    // (shared/constants/status.js).
    SUBSCRIPTION_ACTIVATED: "subscription_activated",

    // Any other institutions/{id}.subscription.status change
    // (pending_payment -> expired, expired -> cancelled, etc.) —
    // one general type rather than one per transition, since the
    // before/after values themselves belong in `metadata`, not
    // the type name.
    SUBSCRIPTION_STATUS_CHANGED: "subscription_status_changed",

    // A users/{uid} doc created with role INSTITUTION_ADMIN under
    // this institution. Reserved (see shared/constants/roles.js —
    // institution_admin has no creation flow yet), included here
    // so the type exists the day that flow is built rather than
    // needing a second infrastructure pass.
    INSTITUTION_ADMIN_ADDED: "institution_admin_added",

    // A billing/payment action completes against the
    // subscription. Reserved — no billing write path exists yet
    // (see dashboard.controller.js's computeSubscriptionOverview()
    // header: "billingStatus" is honestly "N/A" today).
    BILLING_COMPLETED: "billing_completed",

    // A security-relevant action on the account (password
    // changed, MFA enabled, new device sign-in, etc.). Reserved —
    // no auth/security write path exists yet (see
    // dashboard.controller.js's buildSecuritySignals()).
    SECURITY_EVENT: "security_event",

    // institutions/{id} marked verified. Reserved — no
    // institution-verification field/flow exists yet (see
    // dashboard.controller.js's buildFoundationSignals()).
    VERIFICATION_COMPLETED: "verification_completed"

});

export default ACTIVITY_TYPES;
