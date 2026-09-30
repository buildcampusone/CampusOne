/**
 * ==========================================================
 * CampusOne
 * Institution Owner — Profile Controller (Foundation)
 * ----------------------------------------------------------
 * Phase 4.0B — Institution Profile Foundation (Infrastructure
 * Only). Same split every other Owner module already uses:
 *
 *   profile.page.js       -> WHERE things render + HOW they
 *                             look (Phase 4.1, not built yet)
 *   profile.controller.js -> WHAT the content is (this file)
 *
 * This phase deliberately stops short of a page.js — no UI, no
 * forms, no rendering. What this file DOES provide is the
 * business logic Phase 4.1 (read-only) and Phase 4.2 (editing)
 * will both build directly on top of, so neither phase has to
 * re-decide any of the architectural questions the Phase 4.0A
 * audit already answered:
 *
 *   - Section shape (what "Identity" / "Contact" / "Address" /
 *     "Owner" / "Branding" each contain)
 *   - Which sections are actually editable today, per the real
 *     firestore.rules update rule (not a guess)
 *   - profile.code stays read-only as a BUSINESS rule, even
 *     though the Firestore rule technically allows it (Critical
 *     Issue 2, Phase 4.0A audit)
 *   - Owner identity is read from users/{uid} via profile.data.js
 *     (session.userProfile), never institutions/{id}.owner
 *     (Critical Issue 3, Phase 4.0A audit)
 *   - institution_profile_updated activity logging happens in
 *     exactly one place (the write path below), the same
 *     non-blocking pattern registration.controller.js's own
 *     institution_created logging already uses — a logging
 *     failure never surfaces as a failed save.
 * ----------------------------------------------------------
 * Phase 4.1 — Institution Profile Overview (read-only UI)
 * ----------------------------------------------------------
 * profile.page.js now exists and consumes this file exclusively
 * (no direct Firestore access, no dashboard.data.js import — per
 * the Phase 4.1 spec). Three small read-only additions below,
 * same shape/discipline as every fetch*Section() above:
 *   - fetchSubscriptionSection() — read-only summary of
 *     institutions/{id}.subscription (plan/billingCycle/
 *     institutionSize/status), no billing actions.
 *   - fetchProfileCompletion() — the one place completion % /
 *     completed-fields / missing-fields is computed, so
 *     profile.page.js only renders it, never recalculates it.
 *   - fetchVerificationStatus() — always "Not Verified" today,
 *     honestly, same discipline dashboard.controller.js's own
 *     `isVerified` already follows everywhere.
 * Nothing above this section changed.
 * ==========================================================
 */

import {
    getProfileData
} from "./profile.data.js";

import {
    getSessionSnapshot
} from "../../../shared/services/auth.service.js";

import {
    updateInstitution
} from "../../../shared/services/institution.service.js";

import {
    logActivity
} from "../../../shared/services/activity.service.js";

import {
    ACTIVITY_TYPES
} from "../../../shared/constants/activity-types.js";

import {
    updateUser
} from "../../../shared/services/user.service.js";

import {
    refreshCurrentSession
} from "../../../shared/services/session.store.js";

/* ==========================================================
   Identity Section
   ----------------------------------------------------------
   institutions/{id}.profile — name, code, type, establishedYear,
   affiliation, description. `codeEditable: false` is the one
   business-rule exception inside an otherwise-editable section
   (Phase 4.0A audit, Critical Issue 2): firestore.rules'
   `hasOnly([...])` allows a `profile.code` write structurally
   (it can't restrict individual keys inside one map field), but
   changing it here would desync the institutionCodes/{code}
   uniqueness claim, which only registration.controller.js's
   atomic transaction knows how to move safely. Read-only until a
   dedicated code-migration flow exists to do that transaction.
========================================================== */

export async function fetchIdentitySection() {

    const { institution } = getProfileData();

    const profile = institution?.profile || {};

    return {

        name: profile.name ?? null,
        code: profile.code ?? null,
        type: profile.type ?? null,
        establishedYear: profile.establishedYear ?? null,
        affiliation: profile.affiliation ?? null,
        description: profile.description ?? null,

        editable: true,
        codeEditable: false

    };

}

/* ==========================================================
   Contact Section
   ----------------------------------------------------------
   institutions/{id}.contact — email, mobile, website.
   `editable: true` only became honest as of Phase 4.0B — before
   this phase's firestore.rules change, `contact` wasn't in the
   Owner's update allow-list at all (Phase 4.0A audit, Critical
   Issue 1), so saving a Contact edit would have failed no matter
   what the UI did.
========================================================== */

export async function fetchContactSection() {

    const { institution } = getProfileData();

    const contact = institution?.contact || {};

    return {

        email: contact.email ?? null,
        mobile: contact.mobile ?? null,
        website: contact.website ?? null,

        editable: true

    };

}

/* ==========================================================
   Address Section
   ----------------------------------------------------------
   institutions/{id}.address — same Phase 4.0B rule-gap fix as
   Contact above.
========================================================== */

export async function fetchAddressSection() {

    const { institution } = getProfileData();

    const address = institution?.address || {};

    return {

        country: address.country ?? null,
        state: address.state ?? null,
        district: address.district ?? null,
        city: address.city ?? null,
        pinCode: address.pinCode ?? null,
        fullAddress: address.fullAddress ?? null,
        mapLink: address.mapLink ?? null,
        latitude: address.latitude ?? null,
        longitude: address.longitude ?? null,

        editable: true

    };

}

/* ==========================================================
   Owner Section
   ----------------------------------------------------------
   Deliberately sourced from users/{uid} (profile.data.js's
   `owner`, i.e. session.userProfile) — NOT
   institutions/{id}.owner, which is a denormalized snapshot
   written once at registration and never kept in sync
   (Phase 4.0A audit, Critical Issue 3). dashboard.data.js's own
   buildCurrentOwner() already made this exact call for the
   Dashboard; this section stays consistent with it.
   `editable: false` here on purpose — firestore.rules' users/{uid}
   update rule already permits the Owner to change their own
   fullName/phone/designation/photoURL, but no phase in the
   current roadmap (4.1 or 4.2) wires an edit path for it yet, so
   this stays honestly read-only rather than promising an action
   nothing behind it can perform.
========================================================== */

export async function fetchOwnerSection() {

    const { owner } = getProfileData();

    return {

        fullName: owner?.fullName ?? null,
        designation: owner?.designation ?? null,
        email: owner?.email ?? null,
        phone: owner?.phone ?? null,
        photoUrl: owner?.photoURL ?? null,

        source: "users/{uid}",
        editable: false

    };

}

/* ==========================================================
   My Profile Completion
   ----------------------------------------------------------
   Personal-fields-only counterpart to fetchProfileCompletion()
   above. That function scores the INSTITUTION (name/type/
   contact/address/branding/owner name+mobile) for the
   Institution Profile module (Phase A). This one scores only
   what My Profile now owns — Full Name, Designation, Personal
   Email, Personal Mobile, Profile Photo — reusing the same
   isFieldFilled() check and the same { percentage,
   completedFields, missingFields, totalFields } shape so
   CompletionCard's markup needs no changes to render either
   one.
========================================================== */

const OWNER_COMPLETION_FIELDS = [

    { label: "Full Name", get: (o) => o.fullName },
    { label: "Designation", get: (o) => o.designation },
    { label: "Personal Email", get: (o) => o.email },
    { label: "Personal Mobile", get: (o) => o.phone },
    { label: "Profile Photo", get: (o) => o.photoUrl }

];

export async function fetchOwnerCompletion() {

    const owner = await fetchOwnerSection();

    const completedFields = [];
    const missingFields = [];

    for (const field of OWNER_COMPLETION_FIELDS) {

        const value = field.get(owner);

        (isFieldFilled(value) ? completedFields : missingFields).push(field.label);

    }

    const totalFields = OWNER_COMPLETION_FIELDS.length;

    const percentage = totalFields > 0
        ? Math.round((completedFields.length / totalFields) * 100)
        : 0;

    return {

        percentage,
        completedFields,
        missingFields,
        totalFields

    };

}

/* ==========================================================
   Branding Section
   ----------------------------------------------------------
   institutions/{id}.branding — primaryColor/secondaryColor are
   plain metadata fields the Owner update rule already covers
   (`editableMetadata: true`). coverUrl/faviconUrl stay read-only
   display fields — only registration.controller.js's one-time
   upload writes them today, no update path exists for them yet.
   logoUrl is now editable too (Phase 4.3 — Institution Logo
   management): institution-profile.page.js uploads to Firebase
   Storage directly via shared/services/storage.service.js, then
   writes the resulting URL back through the same
   updateInstitutionProfile("branding", { logoUrl }) write path
   every other Branding field already goes through — no separate
   update function for it.
========================================================== */

export async function fetchBrandingSection() {

    const { institution } = getProfileData();

    const branding = institution?.branding || {};

    return {

        logoUrl: branding.logoUrl ?? null,
        coverUrl: branding.coverUrl ?? null,
        faviconUrl: branding.faviconUrl ?? null,
        primaryColor: branding.primaryColor ?? null,
        secondaryColor: branding.secondaryColor ?? null,

        editableMetadata: true,
        uploadAvailable: true

    };

}

/* ==========================================================
   Current Institution ID
   ----------------------------------------------------------
   Thin accessor over getSessionSnapshot().institutionId — the
   exact same value updateInstitutionProfile() below already
   reads internally for every write. Institution Logo management
   (Phase 4.3) needs this in institution-profile.page.js to build
   its Firebase Storage path (institution-logos/{institutionId}/
   logo.webp) — exposing this one primitive keeps page.js on the
   "no direct Firestore/session access, controller functions
   only" contract its own file header documents, instead of
   reaching into auth.service.js itself.
========================================================== */

export function getCurrentInstitutionId() {

    return getSessionSnapshot().institutionId || null;

}

/* ==========================================================
   Subscription Section
   ----------------------------------------------------------
   institutions/{id}.subscription — plan, billingCycle,
   institutionSize, status. Read-only summary for Phase 4.1:
   no billing actions live here (that's Owner Dashboard's own
   Section 7 / a future Subscription & Billing module) — this
   is just "what plan is this institution on", surfaced on the
   Profile Overview for context.
========================================================== */

export async function fetchSubscriptionSection() {

    const { institution } = getProfileData();

    const subscription = institution?.subscription || {};

    return {

        plan: subscription.plan ?? null,
        billingCycle: subscription.billingCycle ?? null,
        institutionSize: subscription.institutionSize ?? null,
        status: subscription.status ?? null,

        editable: false

    };

}

/* ==========================================================
   Profile Completion
   ----------------------------------------------------------
   Single place the completion percentage is decided, per the
   Phase 4.1 spec's "reuse the calculation, don't recalculate
   in the page" rule — same discipline dashboard.controller.js's
   fetchInstitutionHealth() already follows for its own score.
   Deliberately a small, honest checklist (name/type/established
   year/affiliation/description, email/mobile/website, address/
   city/PIN, logo, owner name/mobile) rather than every possible
   field — each entry is something a real Owner can see missing
   and go fill in, not an internal implementation detail.
========================================================== */

const COMPLETION_FIELDS = [

    { label: "Institution Name", get: (p) => p.institution?.profile?.name },
    { label: "Institution Type", get: (p) => p.institution?.profile?.type },
    { label: "Established Year", get: (p) => p.institution?.profile?.establishedYear },
    { label: "Affiliation", get: (p) => p.institution?.profile?.affiliation },
    { label: "Description", get: (p) => p.institution?.profile?.description },

    { label: "Contact Email", get: (p) => p.institution?.contact?.email },
    { label: "Contact Mobile", get: (p) => p.institution?.contact?.mobile },
    { label: "Website", get: (p) => p.institution?.contact?.website },

    { label: "Address", get: (p) => p.institution?.address?.fullAddress },
    { label: "City", get: (p) => p.institution?.address?.city },
    { label: "PIN Code", get: (p) => p.institution?.address?.pinCode },

    { label: "Institution Logo", get: (p) => p.institution?.branding?.logoUrl },

    { label: "Owner Name", get: (p) => p.owner?.fullName },
    { label: "Owner Mobile", get: (p) => p.owner?.phone }

];

function isFieldFilled(value) {

    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;

    return true;

}

export async function fetchProfileCompletion() {

    const profileData = getProfileData();

    const completedFields = [];
    const missingFields = [];

    for (const field of COMPLETION_FIELDS) {

        const value = field.get(profileData);

        (isFieldFilled(value) ? completedFields : missingFields).push(field.label);

    }

    const totalFields = COMPLETION_FIELDS.length;

    const percentage = totalFields > 0
        ? Math.round((completedFields.length / totalFields) * 100)
        : 0;

    return {

        percentage,
        completedFields,
        missingFields,
        totalFields

    };

}

/* ==========================================================
   Verification Status
   ----------------------------------------------------------
   Honest placeholder — same discipline dashboard.controller.js
   already follows everywhere it touches `isVerified` (see that
   file's own notes): no verification infrastructure exists yet
   anywhere in the codebase, so this always resolves "Not
   Verified" with the real reason, never a fabricated verified
   state and never a silent guess.
========================================================== */

export async function fetchVerificationStatus() {

    return {

        verified: false,
        label: "Not Verified",
        reason: "Verification infrastructure is not implemented yet."

    };

}

/* ==========================================================
   Write Foundation — updateInstitutionProfile()
   ----------------------------------------------------------
   The one write path this phase adds. Deliberately generic
   (section key + partial data) rather than one function per
   section, so Phase 4.1/4.2's page.js has exactly one place to
   call regardless of which section its form is editing — same
   "one write primitive, not one per type" reasoning
   activity.service.js's own logActivity() already documents for
   itself.

   ALLOWED_SECTIONS mirrors firestore.rules' Owner update
   `hasOnly([...])` list exactly (minus `updatedAt`, which
   institution.service.js's updateInstitution() already adds to
   every write) — if that rule ever changes, this list needs to
   change with it, and vice versa.
========================================================== */

const ALLOWED_SECTIONS = ["profile", "contact", "address", "branding"];

/**
 * @param {"profile"|"contact"|"address"|"branding"} sectionKey
 * @param {object} partialData - only the fields being changed;
 *   merged with the current cached section before writing (see
 *   the merge note below), never a full section replacement.
 */
export async function updateInstitutionProfile(sectionKey, partialData) {

    if (!ALLOWED_SECTIONS.includes(sectionKey)) {

        throw new Error(
            `"${sectionKey}" cannot be updated through the Institution Profile foundation. ` +
            `Allowed sections are: ${ALLOWED_SECTIONS.join(", ")}.`
        );

    }

    // Business-rule exception inside "profile" — see
    // fetchIdentitySection()'s own header for why. Checked here
    // too (not just left to the UI) so this function is safe to
    // call directly, e.g. from a future automated flow, without
    // relying on a form having already filtered it out.
    if (sectionKey === "profile" && Object.prototype.hasOwnProperty.call(partialData || {}, "code")) {

        throw new Error(
            "Institution code is read-only here — it can only change through a dedicated " +
            "code-migration transaction re-run."
        );

    }

    const session = getSessionSnapshot();

    const institutionId = session.institutionId;

    if (!institutionId) {
        throw new Error("No institution in the current session — cannot update profile.");
    }

    // updateDoc() (institution.service.js's updateInstitution())
    // replaces a nested map field WHOLESALE, not per-key — it
    // does not merge `{ profile: { name: "New Name" } }` into the
    // existing profile map, it REPLACES the whole profile map
    // with just `{ name: "New Name" }`, silently dropping
    // code/type/establishedYear/affiliation/description. Merging
    // the current cached section with the incoming partial here
    // is what makes a single-field edit safe. This is exactly the
    // kind of landmine Phase 4.2's form work would otherwise hit
    // first — catching it now, at the foundation layer, is the
    // whole point of this phase.
    const currentSection = session.institutionData?.[sectionKey] || {};
    const mergedSection = { ...currentSection, ...partialData };

    await updateInstitution(institutionId, {
        [sectionKey]: mergedSection
    });

    // Activity Integration Hook (Phase 4.0B deliverable).
    // Non-blocking: the profile write above has already
    // succeeded by this point — a logging failure must never
    // surface as a failed save, same discipline
    // registration.controller.js's own institution_created
    // logging already follows.
    const actor = {
        uid: session.user?.uid ?? null,
        name: session.userProfile?.fullName ?? null,
        role: session.role ?? null
    };

    logActivity(institutionId, {

        type: ACTIVITY_TYPES.INSTITUTION_PROFILE_UPDATED,

        actor,

        metadata: {
            section: sectionKey,
            fields: Object.keys(partialData || {})
        }

    }).catch((error) => {

        console.warn(
            "Failed to log institution_profile_updated activity (non-blocking):",
            error
        );

    });

}

/* ==========================================================
   My Profile — Write Path (updateOwnerProfile)
   ----------------------------------------------------------
   Phase B. Writes to users/{uid} via user.service.js's
   updateUser() — deliberately NOT updateInstitutionProfile()
   above, which only ever touches institutions/{id} and has no
   business writing to a user's own doc. Same generic
   "allow-list of fields, throw on anything else" discipline as
   updateInstitutionProfile()'s ALLOWED_SECTIONS.

   photoURL is intentionally excluded from OWNER_ALLOWED_FIELDS:
   no upload path exists yet for the Owner's own avatar (same
   "not already supported" reasoning fetchBrandingSection() above
   documents for institution branding uploads), so this never
   promises a write nothing behind it can perform. email is also
   excluded — Firebase Auth email changes are a distinct flow
   (reauth + verification) this phase doesn't touch.

   After the Firestore write, refreshCurrentSession()
   (session.store.js) re-reads users/{uid} and notifies every
   subscribeSession()/onSessionChange() listener — Topbar avatar/
   name, Sidebar, and this page's own next fetchOwnerSection()
   call all pick up the new values without a page reload. Same
   pattern modules/super-admin/profile/profile.service.js's own
   updateProfile() already established.
========================================================== */

const OWNER_ALLOWED_FIELDS = ["fullName", "designation", "phone"];

/**
 * @param {object} partialData - only the fields being changed;
 *   keys outside OWNER_ALLOWED_FIELDS throw rather than being
 *   silently dropped, so a form bug fails loudly instead of
 *   quietly writing less than the user thinks it did.
 */
export async function updateOwnerProfile(partialData) {

    const invalidKeys = Object.keys(partialData || {})
        .filter((key) => !OWNER_ALLOWED_FIELDS.includes(key));

    if (invalidKeys.length) {

        throw new Error(
            `"${invalidKeys.join(", ")}" cannot be updated through My Profile. ` +
            `Allowed fields are: ${OWNER_ALLOWED_FIELDS.join(", ")}.`
        );

    }

    const session = getSessionSnapshot();

    const uid = session.user?.uid;

    if (!uid) {
        throw new Error("No signed-in user — cannot update profile.");
    }

    await updateUser(uid, partialData);

    await refreshCurrentSession();

}

/* ==========================================================
   Destroy
   ----------------------------------------------------------
   Nothing to tear down yet (no listeners, no timers opened by
   this file — profile.data.js's subscribeProfileData(), if a
   future page.js uses it, owns its own unsubscribe) — kept as a
   named export so this module matches the render()/destroy()
   contract every other Owner module already follows, once
   Phase 4.1 adds a page.js that actually calls it.
========================================================== */

export function destroyProfile() {

    // Future: unsubscribe any Phase 4.1 subscribeProfileData()
    // listener here, once a page.js exists to own one.

}
