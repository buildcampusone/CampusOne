/**
 * ==========================================================
 * CampusOne
 * Institution Owner — Institution Admin Management Controller
 * ----------------------------------------------------------
 * Phase 5.1.1 — Institution Admin Management Foundation
 * Phase 5.1.3 — Institution Administrator Directory
 * Phase 5.1.4 — Firebase CRUD Integration
 *
 * Phase 5.1.1 established this file's job: prepare the page
 * that lets an Institution Owner manage the admins
 * (ROLES.INSTITUTION_ADMIN) delegated to run their institution's
 * day-to-day operations — NOT the Institution Admin's own
 * dashboard experience (that's modules/institution-admin/,
 * gated on ROLES.INSTITUTION_ADMIN itself; an Owner reaches this
 * page instead, per that module's guards.js Part 3.9 note).
 *
 * Phase 5.1.3 filled the seam Phase 5.1.1 deliberately left
 * open: fetchAdminDirectory()/fetchAdminSummary() ran through a
 * pure, ordered filter/sort pipeline (admin-directory.filters.js)
 * against a mock array, kept Firestore-ready on purpose — same
 * contract, same Promise-returning signatures.
 *
 * Phase 5.1.4 swaps exactly what 5.1.3 promised it would: both
 * functions now read shared/services/admin-directory.service.js
 * (a real `users` collection query scoped to the signed-in
 * Owner's institutionId) instead of mock-admins.js, and run the
 * result through the same, unmodified filter/sort pipeline.
 * Nothing in this file's public API, or any caller of it,
 * changed.
 *
 * Still explicitly OUT of scope this phase:
 *   - Creating/editing/suspending an admin from *this* file
 *     (that's create-admin.controller.js's own phase; untouched
 *     here — this file only reads)
 *   - Per-field Firestore queries — filtering/sorting stays
 *     client-side against the array fetchAdminDirectory()
 *     returns, by design (see this function's own doc comment)
 * ==========================================================
 */

import { MOCK_DEPARTMENTS } from "./mock-admins.js";

import {
    filterBySearch,
    filterByStatus,
    filterByDepartment,
    sortAdmins
} from "./admin-directory.filters.js";

import {
    listInstitutionAdmins,
    updateInstitutionAdminStatus,
    updateInstitutionAdminProfile
} from "../../../shared/services/admin-directory.service.js";

import { USER_STATUS } from "../../../shared/constants/status.js";

import { getUserProfile } from "../../../shared/services/auth.service.js";

/**
 * Phase 5.1.4 — the mock array itself (mockAdmins) is no longer
 * imported: fetchAdminDirectory()/fetchAdminSummary() below read
 * a real Firestore query instead. mock-admins.js is kept, not
 * deleted, per this phase's "No mock deletion until migration is
 * verified" constraint — MOCK_DEPARTMENTS (a filter-option
 * fixture, not directory data) is still sourced from it, since
 * the Departments module it will eventually come from doesn't
 * exist yet.
 */
import {
    canManageAdministrators,
    authorizationError
} from "../../../shared/services/permission.service.js";

/**
 * Phase 5.1.5 — every exported fetch below is a protected
 * action (per this phase's Permission Model, viewing/managing
 * the Institution Admin Directory is Institution Owner-only).
 * This is the one place that check happens for this file —
 * repeated per-function rather than once at module scope, since
 * a signed-out/role-changed session can happen between calls
 * (e.g. a long-lived tab) and each fetch already re-reads the
 * session fresh via getUserProfile().
 *
 * @returns {{uid:string, institutionId:string}} the calling Owner's profile
 * @throws authorizationError() if the caller isn't an Institution Owner
 */
function assertCanManageAdministrators() {

    const profile = getUserProfile();

    if (!canManageAdministrators(profile)) {
        throw authorizationError();
    }

    return profile;

}

/* ==========================================================
   Data Model Preparation
   ----------------------------------------------------------
   Documents the shape Phase 5.1.2 started writing to
   users/{uid} once admin creation exists (create-admin.
   controller.js's buildPayload()). mock-admins.js's records
   mirror this shape field-for-field so 5.1.4 needs zero
   remapping when Firestore documents replace the mock array.

   users/{uid}
     role:          ROLES.INSTITUTION_ADMIN (shared/constants/roles.js)
     institutionId: string — the owning institution's document id
     status:        USER_STATUS.ACTIVE | PENDING | SUSPENDED
                    (shared/constants/status.js — reused, not a
                    new enum)
     permissions:   object — shape owned by the future Permission
                    Engine phase; not designed yet
     department:    string | null — shape owned by the future
                    Departments module; not designed yet
     createdBy:     string — uid of the Institution Owner who
                    provisioned this admin
     createdAt:     Firestore Timestamp
     updatedAt:     Firestore Timestamp
========================================================== */

/* ==========================================================
   Query State
   ----------------------------------------------------------
   Single source of truth for "what the user currently wants to
   see" — lives here, not in the DOM and not in page.js. Toolbar
   inputs are *display*, not *storage*: page.js reads their
   values on input/change and hands them to updateQueryState().
   Defaults match each control's own "no filter" placeholder
   ("all"/"") and getSortOptions()'s first entry.
========================================================== */

const DEFAULT_QUERY_STATE = Object.freeze({
    search: "",
    status: "all",
    department: "all",
    sort: "alphabetical"
});

let queryState = { ...DEFAULT_QUERY_STATE };

/**
 * Merges a partial patch into the current query state — e.g.
 * updateQueryState({ search: "ritika" }) leaves status/
 * department/sort untouched. Doesn't re-fetch or re-render
 * anything itself; the caller (page.js's refreshDirectory())
 * decides when to re-run fetchAdminDirectory() against the new
 * state.
 *
 * @param {Partial<typeof DEFAULT_QUERY_STATE>} partial
 * @returns {typeof DEFAULT_QUERY_STATE} the resulting state
 */
export function updateQueryState(partial) {

    queryState = { ...queryState, ...partial };

    return { ...queryState };

}

/**
 * Resets query state back to defaults — e.g. a "Clear Search /
 * Filters" action, or a fresh mount so a previous visit's search
 * term doesn't leak into the next one.
 *
 * @returns {typeof DEFAULT_QUERY_STATE}
 */
export function resetQueryState() {

    queryState = { ...DEFAULT_QUERY_STATE };

    return { ...queryState };

}

/**
 * Read-only snapshot of the current query state, for callers
 * that need to reflect it back into the toolbar controls
 * (e.g. after a reset) without keeping their own copy.
 *
 * @returns {typeof DEFAULT_QUERY_STATE}
 */
export function getQueryState() {

    return { ...queryState };

}

/**
 * Summary counts for the four header cards. Deliberately counts
 * the *unfiltered* result of listInstitutionAdmins(), not the
 * current query-state result — these are ground-truth totals,
 * independent of whatever the Search/Filter Bar currently shows
 * (see fetchAdminDirectory()'s own doc comment for why that
 * split matters).
 *
 * @returns {Promise<{total:number, active:number, suspended:number, pending:number}>}
 */
export async function fetchAdminSummary() {

    const { institutionId } = assertCanManageAdministrators();

    const admins = await listInstitutionAdmins(institutionId);

    const total = admins.length;
    const active = admins.filter((admin) => admin.status === "active").length;
    const suspended = admins.filter((admin) => admin.status === "suspended").length;
    const pending = admins.filter((admin) => admin.status === "pending").length;

    return { total, active, suspended, pending };

}

/**
 * Admin Directory rows, run through the ordered, pure reduction
 * Firestore result -> search -> status -> department -> sort
 * (admin-directory.filters.js) against either the current module
 * query state or an explicit override passed by the caller.
 *
 * Returns the filtered/sorted list plus two flags so page.js
 * never has to string-match or re-derive which empty state (if
 * any) applies:
 *   - hasAnyAdmins: true if any admin exists at all, ignoring
 *     the current filters — false only means "zero admins were
 *     ever created" (the "Create First Administrator" state).
 *   - hasResults: true if the *filtered* list is non-empty —
 *     false while hasAnyAdmins is true means "no admin matches
 *     this search/filter" (the search-empty state, no Create
 *     CTA).
 *
 * @param {Partial<typeof DEFAULT_QUERY_STATE>} [overrideQueryState]
 *   Optional partial query state to filter/sort by instead of
 *   the module's current state — doesn't mutate queryState
 *   itself. Omit to use whatever updateQueryState() last set.
 * @returns {Promise<{admins:Array<object>, hasAnyAdmins:boolean, hasResults:boolean}>}
 */
export async function fetchAdminDirectory(overrideQueryState) {

    const { institutionId } = assertCanManageAdministrators();

    const activeQueryState = overrideQueryState
        ? { ...queryState, ...overrideQueryState }
        : queryState;

    const admins = await listInstitutionAdmins(institutionId);

    let result = filterBySearch(admins, activeQueryState.search);
    result = filterByStatus(result, activeQueryState.status);
    result = filterByDepartment(result, activeQueryState.department);
    result = sortAdmins(result, activeQueryState.sort);

    return {
        admins: result,
        hasAnyAdmins: admins.length > 0,
        hasResults: result.length > 0
    };

}

/* ==========================================================
   Filter / Sort Option Sources
   ----------------------------------------------------------
   Plain option lists for the Filter Bar's Select() components —
   no backend logic, per spec. Kept here (not hardcoded in
   admin-management.page.js) so page.js stays a pure renderer,
   same split every other Owner page in this codebase follows.
========================================================== */

export function getStatusFilterOptions() {

    return [
        { value: "active", label: "Active" },
        { value: "suspended", label: "Suspended" },
        { value: "pending", label: "Pending" }
    ];

}

/**
 * Departments now has a small fixed data source
 * (mock-admins.js's MOCK_DEPARTMENTS) so this filter's options
 * stay in sync with the records it's filtering by construction,
 * not by convention. Still "Future Ready" in spirit — a real
 * Departments module will eventually own this list — but the
 * control is no longer empty this phase.
 *
 * @returns {Array<{value:string, label:string}>}
 */
export function getDepartmentFilterOptions() {

    return MOCK_DEPARTMENTS.map((department) => ({
        value: department,
        label: department
    }));

}

export function getSortOptions() {

    return [
        { value: "newest", label: "Newest" },
        { value: "oldest", label: "Oldest" },
        { value: "alphabetical", label: "Alphabetical" }
    ];

}

/* ==========================================================
   Protected Actions
   ----------------------------------------------------------
   Phase 5.1.5 — Create Administrator already enforces
   permission at its own call site (create-admin.controller.js).
   These cover the rest of this phase's Permission Model
   ("Institution Owner — ... Edit administrators, Suspend
   administrators"). Not called from any page yet — no
   edit/suspend button exists in admin-management.card.js (out
   of this phase's Locked Scope, same as Phase 5.1.4's own
   deactivateInstitutionAdmin()) — but the enforcement is real
   and in place for whichever future phase wires a button to
   these.
========================================================== */

export async function suspendAdministrator(uid) {

    assertCanManageAdministrators();

    return updateInstitutionAdminStatus(uid, USER_STATUS.SUSPENDED);

}

export async function activateAdministrator(uid) {

    assertCanManageAdministrators();

    return updateInstitutionAdminStatus(uid, USER_STATUS.ACTIVE);

}

export async function updateAdministratorProfile(uid, data) {

    assertCanManageAdministrators();

    return updateInstitutionAdminProfile(uid, data);

}

/* ==========================================================
   Destroy
   ----------------------------------------------------------
   No listeners, timers, or subscriptions exist in this phase —
   the toolbar's own listeners live in page.js and are torn down
   there. This resets query state so a later re-mount of the
   page starts from a clean Search/Filter Bar rather than
   silently carrying over a previous visit's search term.
========================================================== */
export function destroyAdminManagement() {

    resetQueryState();

    // Future: unsubscribe any realtime listeners here.

}
