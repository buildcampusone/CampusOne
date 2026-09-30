/**
 * ==========================================================
 * CampusOne
 * Institution Owner — Institution Profile Controller
 * ----------------------------------------------------------
 * Phase A — Institution Profile Split
 *
 * This module is the sidebar-facing "Institution Profile" page
 * (Identity / Contact / Address / Branding / Subscription /
 * Verification / Institution Completion) — everything that
 * describes the INSTITUTION, none of the Owner's own personal
 * identity (that stays under the avatar menu's "My Profile",
 * modules/institution-owner/profile/).
 *
 * Deliberately a thin re-export shim, not a rewrite: every
 * function below already exists, already tested, already wired
 * to the live session cache and firestore.rules' ALLOWED
 * institution sections, in
 * modules/institution-owner/profile/profile.controller.js.
 * Duplicating that logic here would create two places reading/
 * writing institutions/{id} — exactly the "two places mapping
 * the same profile" risk this codebase's own conventions guard
 * against. Re-exporting keeps ONE source of truth while giving
 * this module its own conventional controller.js entry point.
 *
 * fetchOwnerSection() is intentionally NOT re-exported here —
 * Owner identity (name/designation/mobile/email) is out of
 * scope for Institution Profile.
 *
 * Follow-up (Phase B, when My Profile is rebuilt as
 * Owner-only): physically move fetchIdentitySection /
 * fetchContactSection / fetchAddressSection /
 * fetchBrandingSection / fetchSubscriptionSection /
 * fetchProfileCompletion / fetchVerificationStatus /
 * updateInstitutionProfile out of profile.controller.js and
 * into this file for real, so neither module depends on the
 * other's folder. Left as a re-export for now so Phase A ships
 * without touching profile.controller.js or risking My
 * Profile's current (still-mounted) behavior.
 * ==========================================================
 */

export {
    fetchIdentitySection,
    fetchContactSection,
    fetchAddressSection,
    fetchBrandingSection,
    fetchSubscriptionSection,
    fetchProfileCompletion,
    fetchVerificationStatus,
    updateInstitutionProfile,
    getCurrentInstitutionId,
    destroyProfile as destroyInstitutionProfile
} from "../profile/profile.controller.js";
