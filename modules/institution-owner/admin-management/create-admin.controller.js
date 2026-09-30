/**
 * ==========================================================
 * CampusOne
 * Institution Owner — Create Institution Administrator
 * Controller
 * ----------------------------------------------------------
 * Phase 5.1.2 (Part 1) — Create Institution Administrator
 * UI & Validation Foundation
 * Phase 5.1.2-B — Modal → Full-Screen Page conversion
 *
 * Phase 5.1.4 — Firebase CRUD Integration
 *
 * Submit -> Validate -> Prepare payload -> real create (Firebase
 * Auth account + users/{uid} Firestore doc, via
 * shared/services/admin-directory.service.js) -> success/error.
 * The validation/payload/loading code below is otherwise
 * unchanged from Phase 5.1.2 — only what happens once the form
 * is valid (handleSubmit()'s tail) now calls
 * createInstitutionAdmin() instead of a simulated
 * setTimeout(). No Storage, no Activity Log — still out of
 * scope for this phase.
 *
 * Two entry points, one interface, per spec:
 *   #iamCreateAdmin      - header "+ Create Administrator" button
 *   #iamCreateFirstAdmin - Admin Directory's Empty State button
 * Both are still bound by initCreateAdminEntryPoints() exactly
 * as Part 1 left them — only what a click *does* changed: Part
 * 1 opened a modal; 5.1.2-B navigates to
 * "#/institution-owner/users-roles/create" instead, so
 * admin-management.page.js (the caller) needed no changes at
 * all to keep working.
 *
 * ----------------------------------------------------------
 * Modal -> Page — what changed and what didn't
 * ----------------------------------------------------------
 * Every validation/state helper below (readFormValues,
 * clearErrors, showError/showSuccess, isFormDirty,
 * setFormFieldsDisabled, validateSingleField, handleSubmit,
 * handleResetForm, bindFooterHandlers, bindBodyHandlers,
 * showDiscardConfirm/bindDiscardConfirmHandlers) is the exact
 * Part 1 logic, unmodified in body — only its scoping root
 * changed, from `modal.bodyEl`/`modal.footerEl` (an in-memory
 * DOM tree owned by shared/components/modal/modal.js) to
 * `bodyEl`/`footerEl` (two elements — #caPageBody/#caPageFooter
 * — that now live directly in the routed workspace). No
 * duplicate form/validation/submit code was written for this
 * phase.
 *
 * What's genuinely new is the *lifecycle* wrapped around that
 * logic:
 *   - openCreateAdminModal()/closeCreateAdminModal() ->
 *     renderCreateAdminPage()/destroyCreateAdminPage(), matching
 *     the render(workspace)/destroy() contract every other
 *     module page in this app already exposes.
 *   - Escape/backdrop/✕ (modal.js's own concerns) -> a header
 *     Back button plus two independent "is it safe to navigate
 *     away" hooks:
 *       1. setCreateExitGuard() (admin-management.page.js) —
 *          asked before the *internal* Directory<->Create hash
 *          switch (a Browser/Android Back press while already
 *          on /create), so a dirty form can block that switch
 *          and show the same inline discard-confirmation bar
 *          Part 1 showed inside the modal footer.
 *       2. setNavigationGuard() (router.institution-owner.js) —
 *          the same top-level guard hook profile.controller.js
 *          already uses for its own dirty-form case, so leaving
 *          Users & Roles entirely (Sidebar -> Dashboard, etc.)
 *          while /create is dirty asks a plain confirm() too.
 *          Reuses the existing hook rather than inventing a
 *          second navigation-guard concept.
 * ==========================================================
 */

import { showToast } from "../../../shared/components/toast/toast.js";

import { setButtonLoading, resetButton } from "../../../shared/utils/button-state.js";

import { setNavigationGuard } from "../router/router.institution-owner.js";

import { setCreateExitGuard } from "./admin-management.page.js";

import { getStatusFilterOptions } from "./admin-management.controller.js";

import {
    CreateAdminPage,
    CreateAdminFooter,
    DiscardConfirmFooter
} from "./create-admin.page.js";

import {
    validateCreateAdminForm,
    validateFullName,
    validateDesignation,
    validateEmail,
    validateMobile,
    validateDepartment
} from "./create-admin.validation.js";

import ROLES from "../../../shared/constants/roles.js";

import { Animation } from "../../../shared/core/animation/animation.service.js";

import {
    createInstitutionAdmin
} from "../../../shared/services/admin-directory.service.js";

import { getUserProfile } from "../../../shared/services/auth.service.js";

import {
    canManageAdministrators,
    authorizationError
} from "../../../shared/services/permission.service.js";

/* ==========================================================
   Route
   ----------------------------------------------------------
   The only two hashes this file ever writes. admin-management.
   page.js is the one place that *reads* hashes to decide which
   view to mount — kept here too (not imported) so this file has
   no reverse dependency on admin-management.page.js's internal
   route-parsing, only on the small guard seam it exposes.
========================================================== */

const DIRECTORY_HASH = "#/institution-owner/users-roles";
const CREATE_HASH = "#/institution-owner/users-roles/create";

function navigateToCreateAdminPage() {

    window.location.hash = CREATE_HASH;

}

function navigateToDirectory() {

    window.location.hash = DIRECTORY_HASH;

}

/* ==========================================================
   Module State
   ----------------------------------------------------------
   One Create Administrator page is mounted at a time — a
   single set of element refs is enough. Reset to null on every
   teardown so the next mount always starts from a clean
   DOM/state, per Chapter 15 (no parallel copies of the same
   state drifting out of sync).
========================================================== */

let workspaceEl = null;
let bodyEl = null;
let footerEl = null;
let headerBackEl = null;

let isSubmitting = false;

/**
 * Set right before this file changes the hash itself (Discard
 * confirmed, or a clean-form Back/Cancel, or a successful
 * submit) so the very next canLeaveCreateAdminPage() call —
 * fired by admin-management.page.js's own hashchange handler
 * reacting to that same hash write — passes immediately instead
 * of re-asking a question the user (or the already-passed dirty
 * check) just answered.
 */
let bypassExitGuard = false;

/**
 * C2 fix (Part 1) — every field handleSubmit() must lock for
 * the duration of the simulated save, including the read-only
 * Role field (readonly !== disabled — it can still be
 * focused/tabbed to while "Creating..." is shown unless it's
 * disabled too).
 */
const FORM_FIELD_IDS = [
    "caFullName",
    "caDesignation",
    "caEmail",
    "caMobile",
    "caDepartment",
    "caStatus",
    "caRole"
];

/* ==========================================================
   Data Model — Payload Shape
   ----------------------------------------------------------
   Matches the users/{uid} shape admin-management.controller.js
   already documents (Data Model Preparation comment). Prepared
   here, never written anywhere — per phase scope, "Do NOT save
   it."
========================================================== */

function buildPayload({ fullName, designation, email, mobile, department, status }) {

    return {
        fullName: fullName.trim(),
        designation: designation.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        department: department.trim(),
        status,
        role: ROLES.INSTITUTION_ADMIN
    };

}

/* ==========================================================
   Field Helpers
   ----------------------------------------------------------
   Same clearErrors/showError/showSuccess shape
   register.controller.js already establishes, scoped to
   #caPageBody instead of `document` so a torn-down page never
   leaves stray query results behind and re-mounting the page's
   other forms is never affected by this one — same isolation
   rationale Part 1 documented for the modal's own bodyEl.
========================================================== */

function clearErrors(root) {

    root.querySelectorAll(".error-message").forEach((error) => {

        error.textContent = "";

        error.classList.remove("show");

    });

}

function resetValidationState(root) {

    root.querySelectorAll(".input").forEach((input) => {

        input.classList.remove("error", "success");

    });

}

function showError(root, field, message) {

    const errorEl = root.querySelector(`#ca${capitalize(field)}Error`);

    if (!errorEl) return;

    errorEl.textContent = message;

    errorEl.classList.add("show");

    const inputEl = root.querySelector(`#ca${capitalize(field)}`);

    if (inputEl) {

        inputEl.classList.remove("success");

        inputEl.classList.add("error");

        inputEl.focus();

    }

}

function showSuccess(root, field) {

    const inputEl = root.querySelector(`#ca${capitalize(field)}`);

    if (!inputEl) return;

    inputEl.classList.remove("error");

    inputEl.classList.add("success");

}

function capitalize(field) {

    return field.charAt(0).toUpperCase() + field.slice(1);

}

function readFormValues(root) {

    return {
        fullName: root.querySelector("#caFullName")?.value || "",
        designation: root.querySelector("#caDesignation")?.value || "",
        email: root.querySelector("#caEmail")?.value || "",
        mobile: root.querySelector("#caMobile")?.value || "",
        department: root.querySelector("#caDepartment")?.value || "",
        status: root.querySelector("#caStatus")?.value || "active"
    };

}

/**
 * C2 fix (Part 1) — toggles `.disabled` on every field in
 * FORM_FIELD_IDS (the five text inputs, the Status select, and
 * the read-only Role field), so a submission in progress makes
 * the form genuinely inert rather than just disabling the
 * surrounding buttons.
 */
function setFormFieldsDisabled(root, disabled) {

    FORM_FIELD_IDS.forEach((id) => {

        const field = root.querySelector(`#${id}`);

        if (field) field.disabled = disabled;

    });

}

/* ==========================================================
   Field-Level Validators
   ----------------------------------------------------------
   Maps a field name -> its single-field validator, for onBlur
   inline feedback — each function already exists in
   create-admin.validation.js, this just picks the right one.
========================================================== */

const FIELD_VALIDATORS = {
    fullName: validateFullName,
    designation: validateDesignation,
    email: validateEmail,
    mobile: validateMobile,
    department: validateDepartment
};

function validateSingleField(field, root) {

    const validator = FIELD_VALIDATORS[field];

    if (!validator) return;

    const input = root.querySelector(`#ca${capitalize(field)}`);

    if (!input) return;

    const result = validator(input.value);

    if (result.valid) {

        showSuccess(root, field);

    } else {

        const errorEl = root.querySelector(`#ca${capitalize(field)}Error`);

        if (errorEl) {

            errorEl.textContent = result.message;

            errorEl.classList.add("show");

        }

        input.classList.remove("success");

        input.classList.add("error");

    }

}

/* ==========================================================
   Dirty Tracking
   ----------------------------------------------------------
   Mi1 fix (Part 1) — purely derived from the form's current
   values (already computed below) rather than a separate
   sticky flag, so clearing every field back out correctly
   reports "not dirty" again instead of staying stuck true from
   the first keystroke onward.
========================================================== */

function isFormDirty(root) {

    if (!root) return false;

    const values = readFormValues(root);

    return (
        values.fullName.trim() !== "" ||
        values.designation.trim() !== "" ||
        values.email.trim() !== "" ||
        values.mobile.trim() !== "" ||
        values.department.trim() !== "" ||
        values.status !== "active"
    );

}

/* ==========================================================
   Reset Form
========================================================== */

function handleResetForm(root) {

    root.querySelectorAll("input").forEach((input) => {

        if (input.id === "caRole") return; // read-only, never resets

        input.value = "";

    });

    const statusEl = root.querySelector("#caStatus");

    if (statusEl) statusEl.value = "active";

    clearErrors(root);

    resetValidationState(root);

    root.querySelector("#caFullName")?.focus();

}

/* ==========================================================
   Discard Confirmation
   ----------------------------------------------------------
   Swaps #caPageFooter's content in place — one page, two footer
   states — same "no second dialog stacked on top" spirit Part
   1's modal.setFooter() swap already established, just against
   the page's own sticky footer element instead of the modal's.
========================================================== */

function showDiscardConfirm() {

    // Mi5 fix (Part 1) — the discard bar is already up; asking
    // again (a second Back press, a second Cancel click) should
    // just keep focus on it, not re-render and re-bind an
    // identical footer.
    if (footerEl.querySelector(".ca-discard-bar")) {

        footerEl.querySelector("#caKeepEditingButton")?.focus();

        return;

    }

    footerEl.innerHTML = DiscardConfirmFooter();

    bindDiscardConfirmHandlers();

    footerEl.querySelector("#caKeepEditingButton")?.focus();

}

function bindDiscardConfirmHandlers() {

    footerEl
        .querySelector("#caKeepEditingButton")
        ?.addEventListener("click", () => {

            footerEl.innerHTML = CreateAdminFooter();

            bindFooterHandlers();

        });

    footerEl
        .querySelector("#caDiscardButton")
        ?.addEventListener("click", () => {

            bypassExitGuard = true;

            navigateToDirectory();

        });

}

/* ==========================================================
   Leave Pipeline
   ----------------------------------------------------------
   Every attempt to leave the Create Administrator page — the
   header Back button, the footer Cancel button, a Browser/
   Android Back press, or a Sidebar jump to a different module —
   funnels through here in one of two ways:
     - A direct click (Back/Cancel) calls attemptLeave() itself,
       *before* touching the hash.
     - A Back press reaches this page's own exit guard instead
       (canLeaveCreateAdminPage(), below), since the hash has
       already changed by the time that fires.
   Exactly one place (isFormDirty()) decides whether either path
   needs confirmation first.
========================================================== */

function attemptLeaveCreateAdminPage() {

    if (isSubmitting) return; // no-op mid-submission, per spec

    if (footerEl.querySelector(".ca-discard-bar")) {

        footerEl.querySelector("#caKeepEditingButton")?.focus();

        return;

    }

    if (isFormDirty(bodyEl)) {

        showDiscardConfirm();

        return;

    }

    navigateToDirectory();

}

/**
 * The exit guard registered with admin-management.page.js
 * (setCreateExitGuard) — asked whenever the Directory<->Create
 * hash switches away from /create for a reason that didn't
 * already go through attemptLeaveCreateAdminPage() above (i.e.
 * a real Browser/Android Back press: the hash has already
 * reverted to the Directory route by the time this runs).
 * Returning false tells admin-management.page.js to leave the
 * Create page mounted; showDiscardConfirm() above has already
 * surfaced the same inline confirmation bar the direct-click
 * path uses.
 */
function canLeaveCreateAdminPage() {

    if (bypassExitGuard) {

        bypassExitGuard = false;

        return true;

    }

    if (isSubmitting) return false;

    if (!isFormDirty(bodyEl)) return true;

    showDiscardConfirm();

    return false;

}

/**
 * The plain confirm()-based guard registered with the top-level
 * router (setNavigationGuard) for the *cross-module* case — e.g.
 * Sidebar -> Dashboard while /create is dirty. Same convention
 * super-admin/profile.controller.js's confirmDiscardIfDirty()
 * already established for this exact hook; reused rather than
 * building a second navigation-guard mechanism.
 */
function confirmDiscardIfDirty() {

    if (!isFormDirty(bodyEl)) return true;

    return confirm(
        "You have unsaved changes. Are you sure you want to leave?"
    );

}

/* ==========================================================
   Submission Pipeline
   ----------------------------------------------------------
   Submit -> Validate -> Prepare payload -> simulated loading
   -> success callback placeholder. No Firebase, no Firestore,
   no network call of any kind — the setTimeout below only
   stands in for one, per Chapter 6's Skeleton/loading-state
   discipline (a real async action always shows processing
   feedback, even a simulated one). Unchanged from Part 1 aside
   from what happens once the simulated save resolves — closing
   a modal is now navigating back to the Directory.
========================================================== */

function handleSubmit() {

    if (isSubmitting) return; // prevents multiple clicks/double submit

    const ownerProfile = getUserProfile();

    if (!canManageAdministrators(ownerProfile)) {

        showToast({
            type: "error",
            title: "Couldn't Create Administrator",
            message: authorizationError().message
        });

        return;

    }

    const root = bodyEl;

    const footerRoot = footerEl;

    clearErrors(root);

    resetValidationState(root);

    const values = readFormValues(root);

    const result = validateCreateAdminForm(values);

    if (!result.valid) {

        showError(root, result.field, result.message);

        return;

    }

    [
        "fullName",
        "designation",
        "email",
        "mobile",
        "department"
    ].forEach((field) => showSuccess(root, field));

    const payload = buildPayload(values);

    const submitButton = footerRoot.querySelector("#caSubmitButton");

    const cancelButton = footerRoot.querySelector("#caCancelButton");

    const resetLink = footerRoot.querySelector("#caResetButton");

    isSubmitting = true;

    setButtonLoading(submitButton, "Creating...");

    if (cancelButton) cancelButton.disabled = true;

    if (resetLink) resetLink.disabled = true;

    // C2 fix (Part 1) — previously only the footer buttons were
    // disabled; the six text/select fields and the read-only
    // Role field stayed editable, so anything typed
    // mid-"submission" was silently discarded once the snapshot
    // above already ran.
    setFormFieldsDisabled(root, true);

    // M1 fix (Part 1), carried into 5.1.2-B — the header Back
    // button is otherwise still a live, clickable no-op while
    // submitting (attemptLeaveCreateAdminPage() itself already
    // no-ops on isSubmitting, but the button looked and behaved
    // as if it should do something).
    if (headerBackEl) headerBackEl.disabled = true;

    const { uid: ownerUid, institutionId } = ownerProfile;

    createInstitutionAdmin(payload, { institutionId, createdBy: ownerUid })
        .then((createdAdmin) => {

            handleCreateAdminSuccess(createdAdmin);

            isSubmitting = false;

            bypassExitGuard = true;

            navigateToDirectory();

            showToast({
                type: "success",
                title: "Administrator Created",
                message: "A password-setup email has been sent to " + payload.email + "."
            });

        })
        .catch((error) => {

            isSubmitting = false;

            resetButtonState(submitButton, cancelButton, resetLink);

            setFormFieldsDisabled(root, false);

            if (headerBackEl) headerBackEl.disabled = false;

            if (error.code === "admin/duplicate-email") {

                showError(root, "email", error.message);

                root.querySelector("#caEmail")?.focus();

                return;

            }

            showToast({
                type: "error",
                title: "Couldn't Create Administrator",
                message: error.message || "Something went wrong. Please try again."
            });

        });

}

/**
 * Undoes setButtonLoading()/the Cancel/Reset disable from
 * handleSubmit()'s start — the mirror image of that block, used
 * only on a failed create so the form is genuinely usable again
 * rather than stuck mid-"Creating...".
 */
function resetButtonState(submitButton, cancelButton, resetLink) {

    resetButton(submitButton, "Create Administrator");

    if (cancelButton) cancelButton.disabled = false;

    if (resetLink) resetLink.disabled = false;

}

/**
 * Post-create hook, called once the Auth account + Firestore
 * doc both exist. Intentionally still empty — an Activity Log
 * entry is the obvious next use for this seam, but that's out
 * of this phase's Locked Scope (see file header).
 *
 * @param {object} createdAdmin the record createInstitutionAdmin() resolved with
 */
function handleCreateAdminSuccess(createdAdmin) {

    // Intentionally empty — see doc comment above.

}

/* ==========================================================
   Footer Bindings
========================================================== */

function bindFooterHandlers() {

    footerEl
        .querySelector("#caSubmitButton")
        ?.addEventListener("click", () => handleSubmit());

    footerEl
        .querySelector("#caCancelButton")
        ?.addEventListener("click", () => attemptLeaveCreateAdminPage());

    footerEl
        .querySelector("#caResetButton")
        ?.addEventListener("click", () => handleResetForm(bodyEl));

}

/* ==========================================================
   Body Bindings — Inline Validation + Accessibility
========================================================== */

function bindBodyHandlers() {

    const root = bodyEl;

    const textFieldIds = [
        "caFullName",
        "caDesignation",
        "caEmail",
        "caMobile",
        "caDepartment"
    ];

    textFieldIds.forEach((id) => {

        const input = root.querySelector(`#${id}`);

        if (!input) return;

        input.addEventListener("keydown", (event) => {

            if (event.key === "Enter") {

                event.preventDefault();

                handleSubmit();

            }

        });

    });

    // Mi3 fix (Part 1) — readonly !== disabled: the Role field
    // was still a reachable, inert tab stop. It carries no
    // interactive affordance, so it's pulled out of the tab
    // order entirely rather than just marked readonly.
    root.querySelector("#caRole")?.setAttribute("tabindex", "-1");

}

/* ==========================================================
   Header Binding
========================================================== */

function bindHeaderHandlers() {

    headerBackEl = workspaceEl.querySelector("#caBackButton");

    headerBackEl?.addEventListener("click", () => attemptLeaveCreateAdminPage());

}

/* ==========================================================
   Render / Destroy
   ----------------------------------------------------------
   Same render(workspace) -> destroy() contract every other
   module page in this app exposes (admin-management.page.js's
   own render()/destroy, dashboard.page.js's, etc.) —
   admin-management.page.js's internal Directory<->Create router
   (see setCreateExitGuard()'s doc comment there) mounts/tears
   this down the exact same way the top-level router mounts/
   tears down a whole module.
========================================================== */

export function renderCreateAdminPage(workspace) {

    if (!workspace) {

        console.error(
            "[CampusOne] Create Institution Administrator workspace not found."
        );

        return () => {};

    }

    workspaceEl = workspace;

    isSubmitting = false;

    bypassExitGuard = false;

    workspaceEl.innerHTML = CreateAdminPage({ statusOptions: getStatusFilterOptions() });

    bodyEl = workspaceEl.querySelector("#caPageBody");

    footerEl = workspaceEl.querySelector("#caPageFooter");

    const pageEl = workspaceEl.querySelector(".ca-page");

    if (pageEl) {

        Animation.fadeIn(pageEl);

    }

    bindHeaderHandlers();

    bindBodyHandlers();

    bindFooterHandlers();

    // Cross-module leave (Sidebar -> another module while dirty)
    // — reuses the top-level router's existing hook rather than
    // inventing a second navigation-guard mechanism.
    setNavigationGuard(confirmDiscardIfDirty);

    // Internal leave (Browser/Android Back while already on
    // /create) — admin-management.page.js's own hook, since the
    // top-level router never sees this sub-route change (see its
    // doc comment).
    setCreateExitGuard(canLeaveCreateAdminPage);

    bodyEl.querySelector("#caFullName")?.focus();

    return destroyCreateAdminPage;

}

export function destroyCreateAdminPage() {

    setNavigationGuard(null);

    setCreateExitGuard(null);

    workspaceEl = null;
    bodyEl = null;
    footerEl = null;
    headerBackEl = null;

    isSubmitting = false;
    bypassExitGuard = false;

}

/* ==========================================================
   Entry Points
   ----------------------------------------------------------
   Unchanged surface from Part 1 — admin-management.page.js
   still calls exactly these two functions the exact same way.
   Only the click behavior changed: navigate to the /create
   route instead of opening a modal.
========================================================== */

export function initCreateAdminEntryPoints(workspace) {

    if (!workspace) return;

    const headerButton = workspace.querySelector("#iamCreateAdmin");

    const emptyStateButton = workspace.querySelector("#iamCreateFirstAdmin");

    [headerButton, emptyStateButton]
        .filter(Boolean)
        .forEach((button) => {

            if (button.dataset.bound === "true") return;

            button.dataset.bound = "true";

            button.addEventListener("click", () => navigateToCreateAdminPage());

        });

}

/**
 * Nothing to tear down on the Directory side any more — the two
 * buttons just navigate, they don't own any state of their own.
 * Kept as a named export (rather than removed) since
 * admin-management.page.js still calls it symmetrically with
 * initCreateAdminEntryPoints() on every destroy, the same
 * "acquire in render(), release in destroy()" shape every module
 * in this app follows.
 */
export function destroyCreateAdminEntryPoints() {

    // Intentionally empty — see doc comment above.

}
