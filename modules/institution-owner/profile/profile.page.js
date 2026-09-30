/**
 * ==========================================================
 * CampusOne
 * Institution Owner — My Profile (Personal)
 * ----------------------------------------------------------
 * Phase B — My Profile Rebuild
 *
 * Reached only via the topbar avatar's "My Profile" menu item
 * (modules.registry.js's "profile" entry, group: "account", not
 * shown in the sidebar). Institution-level data now lives in its
 * own module (modules/institution-owner/institution-profile/,
 * Phase A) — this page owns ONLY the Owner's personal identity:
 *
 *   1. Personal Identity     -> fetchOwnerSection()
 *      (Profile Photo, Full Name, Designation, Personal Email,
 *      Personal Mobile)
 *   2. My Profile Completion -> fetchOwnerCompletion()
 *      (personal fields only — no institution fields)
 *   3. Preferences           -> Coming Soon placeholder
 *   4. Personal Activity     -> Coming Soon placeholder
 *
 * Card markup, skeleton/fade lifecycle, and the Edit/Cancel
 * state machine are carried over unchanged from the previous
 * combined page's Owner Information card — this is a scope
 * trim, not a redesign. What's new: Save is real. Clicking Save
 * validates Full Name, then calls profile.controller.js's
 * updateOwnerProfile() (users/{uid} via user.service.js's
 * updateUser() — never updateInstitutionProfile(), which has no
 * business writing to a user's own doc). photoURL and email stay
 * out of the writable set — no avatar-upload path exists yet,
 * and email changes are a distinct Firebase Auth flow this phase
 * doesn't touch (see profile.controller.js's own
 * updateOwnerProfile() header for why).
 * ==========================================================
 */

import {
    fetchOwnerSection,
    fetchOwnerCompletion,
    updateOwnerProfile,
    destroyProfile as destroyProfileData
} from "./profile.controller.js";

import { Animation } from "../../../shared/core/animation/animation.service.js";

import { BaseSkeleton } from "../../../shared/components/skeleton/base/base.skeleton.js";

import { Button } from "../../../shared/components/button/button.js";

import { Input } from "../../../shared/components/input/input.js";

import { ErrorMessage } from "../../../shared/components/error/error.js";

import { validateName } from "../../../shared/validation/name.js";

import {
    UserIcon,
    BarChartIcon,
    SettingsIcon,
    ClockIcon,
    EditIcon,
    CheckIcon,
    CloseIcon
} from "../../../shared/components/icons/index.js";

/* ==========================================================
   Icon Registry
========================================================== */

const ICONS = {

    owner: UserIcon,
    completion: BarChartIcon,
    preferences: SettingsIcon,
    activity: ClockIcon

};

function renderIcon(key) {

    const IconComponent = ICONS[key] || UserIcon;

    return IconComponent();

}

/* ==========================================================
   Shared Primitives
   ----------------------------------------------------------
   Same FieldRow/ErrorCard/EmptyCard/CardShell primitives every
   Owner module page composes with (see institution-profile.page.js).
   Kept local rather than a shared import — this module has no
   dependency on Institution Profile in either direction.
========================================================== */

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

}

function FieldRow(label, value, { readOnly = false } = {}) {

    const hasValue = value !== null && value !== undefined && String(value).trim().length > 0;

    return /* html */ `

        <div class="iop-field-row">

            <span class="iop-field-label">

                ${escapeHtml(label)}

                ${readOnly ? /* html */ `
                    <span class="iop-readonly-tag">Read Only</span>
                ` : ""}

            </span>

            <span class="iop-field-value ${hasValue ? "" : "iop-field-value--empty"}">
                ${hasValue ? escapeHtml(value) : "Not provided"}
            </span>

        </div>

    `;

}

function ErrorCard(sectionLabel) {

    return /* html */ `

        <div class="iop-error" role="alert">

            <p class="iop-error-title">Failed to load ${escapeHtml(sectionLabel)}.</p>
            <p class="iop-error-description">Please refresh the page to try again.</p>

        </div>

    `;

}

function EmptyCard(iconKey, title, description) {

    return /* html */ `

        <div class="iop-empty">

            <div class="iop-empty-icon" aria-hidden="true">
                ${renderIcon(iconKey)}
            </div>

            <p class="iop-empty-title">${escapeHtml(title)}</p>
            <p class="iop-empty-description">${escapeHtml(description)}</p>

        </div>

    `;

}

function FieldListSkeleton(rows = 2) {

    return /* html */ `

        <div class="iop-skeleton-rows" aria-hidden="true">

            ${Array.from({ length: rows }, () => /* html */ `
                <div class="iop-skeleton-row">
                    ${BaseSkeleton.rounded("35%", "14px")}
                    ${BaseSkeleton.rounded("40%", "14px")}
                </div>
            `).join("")}

        </div>

    `;

}

function CardShell({ className, accentClass, ariaId, iconKey, title, badge = "", bodyHtml }) {

    return /* html */ `

        <section
            class="co-card iop-card ${accentClass} ${className}"
            role="region"
            aria-labelledby="${ariaId}"
        >

            <div class="iop-card-header">

                <div class="iop-card-header-title">

                    <div class="iop-icon-badge" aria-hidden="true">
                        ${renderIcon(iconKey)}
                    </div>

                    <h3 class="iop-card-title" id="${ariaId}">${escapeHtml(title)}</h3>

                </div>

                ${badge}

            </div>

            ${bodyHtml}

        </section>

    `;

}

/* ==========================================================
   Header — personal (avatar, name, designation, actions)
========================================================== */

function HeaderCard(owner) {

    const initial = owner.fullName ? owner.fullName.trim().charAt(0).toUpperCase() : "";

    const avatar = owner.photoUrl
        ? /* html */ `<img src="${escapeHtml(owner.photoUrl)}" alt="" />`
        : (initial || renderIcon("owner"));

    return /* html */ `

        <header class="co-card iop-header-card" role="region" aria-labelledby="iopHeaderName">

            <div class="iop-header-identity">

                <div class="iop-header-logo" aria-hidden="true">
                    ${avatar}
                </div>

                <div class="iop-header-text">

                    <div class="iop-header-name-row">
                        <h1 class="iop-header-name" id="iopHeaderName" title="${escapeHtml(owner.fullName || "My Profile")}">
                            ${escapeHtml(owner.fullName || "My Profile")}
                        </h1>
                    </div>

                    <div class="iop-header-meta">

                        ${owner.designation ? /* html */ `
                            <span class="iop-header-pill">${escapeHtml(owner.designation)}</span>
                        ` : ""}

                    </div>

                </div>

            </div>

            <div class="iop-header-actions">

                ${Button({
                    id: "iopRefreshBtn",
                    text: "Refresh",
                    variant: "secondary",
                    icon: ClockIcon()
                })}

                <span id="iopSaveWrap" hidden>
                    ${Button({
                        id: "iopSaveBtn",
                        text: "Save",
                        variant: "primary",
                        icon: CheckIcon()
                    })}
                </span>

                <span id="iopCancelWrap" hidden>
                    ${Button({
                        id: "iopCancelBtn",
                        text: "Cancel",
                        variant: "secondary",
                        icon: CloseIcon()
                    })}
                </span>

                <span id="iopEditWrap">
                    ${Button({
                        id: "iopEditBtn",
                        text: "Edit Profile",
                        variant: "primary",
                        icon: EditIcon()
                    })}
                </span>

            </div>

        </header>

    `;

}

function HeaderSkeleton() {

    return /* html */ `

        <div class="co-card iop-header-card iop-header-skeleton" aria-hidden="true">

            <div class="iop-header-identity">

                ${BaseSkeleton.circle(64)}

                <div class="iop-header-text">
                    ${BaseSkeleton.rounded("220px", "24px")}
                    ${BaseSkeleton.rounded("160px", "16px")}
                </div>

            </div>

            <div class="iop-header-actions">
                ${BaseSkeleton.rounded("110px", "44px", "var(--radius-md)")}
                ${BaseSkeleton.rounded("180px", "44px", "var(--radius-md)")}
            </div>

        </div>

    `;

}

function HeaderErrorState() {

    return /* html */ `

        <div class="co-card iop-error" role="alert">
            <p class="iop-error-title">Failed to load My Profile header.</p>
            <p class="iop-error-description">Please refresh the page to try again.</p>
        </div>

    `;

}

/* ==========================================================
   Section 1 — Personal Identity
   ----------------------------------------------------------
   Edit mode makes Full Name / Designation / Personal Mobile
   editable inputs; Personal Email stays a read-only FieldRow in
   both modes (email changes are a distinct Firebase Auth flow,
   not part of this phase). Save reads these same input ids —
   see readIdentityFormValues() below.
========================================================== */

function IdentityCard(owner, isEditing = false) {

    const initial = owner.fullName ? owner.fullName.trim().charAt(0).toUpperCase() : "";

    const avatarHtml = /* html */ `
        <div class="iop-owner-avatar" aria-hidden="true">
            ${owner.photoUrl ? /* html */ `<img src="${escapeHtml(owner.photoUrl)}" alt="" />` : (initial || renderIcon("owner"))}
        </div>
    `;

    const identityHtml = isEditing ? /* html */ `

        <div class="iop-owner-identity iop-owner-identity--editing">

            ${avatarHtml}

            <div class="iop-owner-edit-fields">

                ${Input({
                    label: "Full Name",
                    type: "text",
                    id: "iopOwnerFullNameInput",
                    placeholder: "Full Name",
                    errorId: "iopOwnerFullNameError"
                })}

                ${Input({
                    label: "Designation",
                    type: "text",
                    id: "iopOwnerDesignationInput",
                    placeholder: "Designation"
                })}

            </div>

        </div>

    ` : /* html */ `

        <div class="iop-owner-identity">

            ${avatarHtml}

            <div>
                <p class="iop-owner-name">${escapeHtml(owner.fullName || "Not provided")}</p>
                <p class="iop-owner-designation">${escapeHtml(owner.designation || "Designation not provided")}</p>
            </div>

        </div>

    `;

    const fieldsHtml = isEditing ? /* html */ `

        <div class="iop-field-list">

            ${FieldRow("Personal Email", owner.email, { readOnly: true })}

            <div class="iop-owner-edit-fields">
                ${Input({
                    label: "Personal Mobile",
                    type: "tel",
                    id: "iopOwnerPhoneInput",
                    placeholder: "Personal Mobile"
                })}
            </div>

            ${ErrorMessage({ id: "iopSaveError", message: "" })}

        </div>

    ` : /* html */ `

        <div class="iop-field-list">
            ${FieldRow("Personal Email", owner.email)}
            ${FieldRow("Personal Mobile", owner.phone)}
        </div>

    `;

    const body = identityHtml + fieldsHtml;

    return CardShell({
        className: "iop-card--owner",
        accentClass: "iop-card--owner",
        ariaId: "iopIdentityHeading",
        iconKey: "owner",
        title: "Personal Identity",
        bodyHtml: body
    });

}

/**
 * Pre-fills edit-mode inputs from the same fetchOwnerSection()
 * payload the card was just rendered with — Input() has no
 * `value` prop, so this sets .value on the DOM node after
 * render, same convention every other form in this codebase
 * follows (registration.controller.js, previously OwnerCard()).
 */
function prefillIdentityInputs(wrap, owner) {

    const fullNameInput = wrap.querySelector("#iopOwnerFullNameInput");
    const designationInput = wrap.querySelector("#iopOwnerDesignationInput");
    const phoneInput = wrap.querySelector("#iopOwnerPhoneInput");

    if (fullNameInput) fullNameInput.value = owner.fullName || "";
    if (designationInput) designationInput.value = owner.designation || "";
    if (phoneInput) phoneInput.value = owner.phone || "";

}

function IdentitySkeleton() {

    return /* html */ `
        <div class="co-card iop-card iop-card--owner iop-owner-skeleton" aria-hidden="true">
            <div class="iop-card-header">
                ${BaseSkeleton.circle(40)}
                ${BaseSkeleton.rounded("160px", "20px")}
            </div>
            <div class="iop-owner-identity">
                ${BaseSkeleton.circle(48)}
                <div>
                    ${BaseSkeleton.rounded("140px", "16px")}
                    ${BaseSkeleton.rounded("100px", "12px")}
                </div>
            </div>
            ${FieldListSkeleton(2)}
        </div>
    `;

}

/* ==========================================================
   Section 2 — My Profile Completion
   ----------------------------------------------------------
   Renders fetchOwnerCompletion()'s { percentage, completedFields,
   missingFields, totalFields } — personal fields only, per
   profile.controller.js's own OWNER_COMPLETION_FIELDS. Markup is
   identical to Institution Profile's completion card (same data
   shape), just fed a different fetch and title.
========================================================== */

function CompletionCard(completion) {

    const body = /* html */ `

        <div class="iop-completion-top">

            <span class="iop-completion-percent">${completion.percentage}%</span>

            <span class="iop-field-label">
                ${completion.completedFields.length} of ${completion.totalFields} fields complete
            </span>

        </div>

        <div class="iop-completion-progress" role="progressbar" aria-valuenow="${completion.percentage}" aria-valuemin="0" aria-valuemax="100" aria-label="My Profile completion">
            <div class="iop-completion-progress-fill" style="width:${completion.percentage}%"></div>
        </div>

        <div class="iop-completion-columns">

            <div>
                <p class="iop-completion-column-title">Completed</p>
                <ul class="iop-completion-list">
                    ${completion.completedFields.length
                        ? completion.completedFields.map((field) => /* html */ `
                            <li class="iop-completion-item iop-completion-item--done">
                                ${CheckIcon()} ${escapeHtml(field)}
                            </li>
                        `).join("")
                        : /* html */ `<li class="iop-completion-item iop-completion-item--missing">None yet</li>`}
                </ul>
            </div>

            <div>
                <p class="iop-completion-column-title">Missing</p>
                <ul class="iop-completion-list">
                    ${completion.missingFields.length
                        ? completion.missingFields.map((field) => /* html */ `
                            <li class="iop-completion-item iop-completion-item--missing">
                                ${CloseIcon()} ${escapeHtml(field)}
                            </li>
                        `).join("")
                        : /* html */ `<li class="iop-completion-item iop-completion-item--done">${CheckIcon()} All fields complete</li>`}
                </ul>
            </div>

        </div>

    `;

    return CardShell({
        className: "iop-card--completion iop-card--full",
        accentClass: "iop-card--completion",
        ariaId: "iopCompletionHeading",
        iconKey: "completion",
        title: "My Profile Completion",
        bodyHtml: body
    });

}

function CompletionSkeleton() {

    return /* html */ `
        <div class="co-card iop-card iop-card--completion iop-card--full iop-completion-skeleton" aria-hidden="true">
            <div class="iop-card-header">
                ${BaseSkeleton.circle(40)}
                ${BaseSkeleton.rounded("180px", "20px")}
            </div>
            ${BaseSkeleton.rounded("60px", "36px")}
            ${BaseSkeleton.rounded("100%", "8px", "var(--radius-full)")}
            <div class="iop-completion-columns">
                ${FieldListSkeleton(3)}
                ${FieldListSkeleton(3)}
            </div>
        </div>
    `;

}

/* ==========================================================
   Section 3 — Preferences (Coming Soon)
   Section 4 — Personal Activity (Coming Soon)
   ----------------------------------------------------------
   Honest placeholders — no preferences store and no personal
   activity feed exist anywhere in this codebase yet, same
   discipline fetchVerificationStatus() documents for itself in
   Institution Profile: never fabricate a state, never silently
   guess.
========================================================== */

function PreferencesCard() {

    return CardShell({
        className: "iop-card--preferences",
        accentClass: "iop-card--preferences",
        ariaId: "iopPreferencesHeading",
        iconKey: "preferences",
        title: "Preferences",
        bodyHtml: EmptyCard(
            "preferences",
            "Coming Soon",
            "Theme, notification, and language preferences will live here in a future phase."
        )
    });

}

function ActivityCard() {

    return CardShell({
        className: "iop-card--activity",
        accentClass: "iop-card--activity",
        ariaId: "iopActivityHeading",
        iconKey: "activity",
        title: "Personal Activity",
        bodyHtml: EmptyCard(
            "activity",
            "Coming Soon",
            "A log of your own recent actions will appear here once personal activity tracking exists."
        )
    });

}

/* ==========================================================
   Page Assembly
========================================================== */

function ProfilePage() {

    return /* html */ `

        <div class="iop-profile">

            <div id="iopHeaderWrap" aria-busy="true">
                ${HeaderSkeleton()}
            </div>

            <section class="iop-section-grid">

                <div id="iopIdentityWrap" aria-busy="true">
                    ${IdentitySkeleton()}
                </div>

                <div id="iopCompletionWrap" aria-busy="true">
                    ${CompletionSkeleton()}
                </div>

                <div id="iopPreferencesWrap">
                    ${PreferencesCard()}
                </div>

                <div id="iopActivityWrap">
                    ${ActivityCard()}
                </div>

            </section>

        </div>

    `;

}

/* ==========================================================
   Loaders
   ----------------------------------------------------------
   Preferences/Activity are static Coming Soon cards (no fetch,
   no skeleton lifecycle) — rendered once in ProfilePage() above
   and never reloaded, same as any other honest placeholder in
   this codebase.
========================================================== */

async function loadHeader(workspace) {

    const wrap = workspace.querySelector("#iopHeaderWrap");
    if (!wrap) return;

    try {

        const owner = await fetchOwnerSection();

        if (!document.body.contains(wrap)) return;

        const skeletonEl = wrap.querySelector(".iop-header-skeleton");
        await Animation.fadeOut(skeletonEl, { hideOnFinish: false });

        wrap.innerHTML = HeaderCard(owner);
        wrap.removeAttribute("aria-busy");

        await Animation.fadeIn(wrap.querySelector(".iop-header-card"));

    } catch (error) {

        console.error("[CampusOne] My Profile Header Error:", error);

        wrap.innerHTML = HeaderErrorState();
        wrap.removeAttribute("aria-busy");

    }

}

async function loadIdentity(workspace) {

    const wrap = workspace.querySelector("#iopIdentityWrap");
    if (!wrap) return;

    try {

        const owner = await fetchOwnerSection();

        if (!document.body.contains(wrap)) return;

        const skeletonEl = wrap.querySelector(".iop-owner-skeleton");
        await Animation.fadeOut(skeletonEl, { hideOnFinish: false });

        wrap.innerHTML = IdentityCard(owner, isEditing);
        wrap.removeAttribute("aria-busy");

        if (isEditing) {
            prefillIdentityInputs(wrap, owner);
        }

        await Animation.fadeIn(wrap.querySelector(".iop-card"));

    } catch (error) {

        console.error("[CampusOne] Personal Identity Error:", error);

        wrap.innerHTML = ErrorCard("Personal Identity");
        wrap.removeAttribute("aria-busy");

    }

}

async function loadCompletion(workspace) {

    const wrap = workspace.querySelector("#iopCompletionWrap");
    if (!wrap) return;

    try {

        const completion = await fetchOwnerCompletion();

        if (!document.body.contains(wrap)) return;

        const skeletonEl = wrap.querySelector(".iop-completion-skeleton");
        await Animation.fadeOut(skeletonEl, { hideOnFinish: false });

        wrap.innerHTML = CompletionCard(completion);
        wrap.removeAttribute("aria-busy");

        await Animation.fadeIn(wrap.querySelector(".iop-card"));

    } catch (error) {

        console.error("[CampusOne] My Profile Completion Error:", error);

        wrap.innerHTML = ErrorCard("My Profile Completion");
        wrap.removeAttribute("aria-busy");

    }

}

function loadAllSections(workspace) {

    return Promise.all([
        loadHeader(workspace),
        loadIdentity(workspace),
        loadCompletion(workspace)
    ]);

}

/* ==========================================================
   Header Actions — Refresh / Edit / Cancel / Save
   ----------------------------------------------------------
   Refresh/Edit/Cancel keep the same contract the combined page
   already established: isEditing is a page-local UI mode,
   Cancel re-runs loadAllSections() to discard unsaved edits.

   Save is new this phase: validates Full Name, then calls
   updateOwnerProfile() (profile.controller.js -> users/{uid}).
   On success, exits edit mode and reloads Header/Identity/
   Completion so the page reflects exactly what was just written
   (no local-only optimistic state to fall out of sync). On
   failure, the button re-enables and the error renders inline
   under Full Name (validation) or under the Save button
   (write failure) — never a silent failure.
========================================================== */

function bindHeaderActions(workspace) {

    workspace.addEventListener("click", handleHeaderActionClick);

}

function unbindHeaderActions(workspace) {

    workspace.removeEventListener("click", handleHeaderActionClick);

}

let refreshWorkspaceRef = null;
let isEditing = false;
let isSaving = false;

function handleHeaderActionClick(event) {

    if (!refreshWorkspaceRef) return;

    if (event.target.closest("#iopRefreshBtn")) {
        loadAllSections(refreshWorkspaceRef);
        return;
    }

    if (event.target.closest("#iopEditBtn")) {
        enterEditMode(refreshWorkspaceRef);
        return;
    }

    if (event.target.closest("#iopCancelBtn")) {
        exitEditMode(refreshWorkspaceRef);
        return;
    }

    if (event.target.closest("#iopSaveBtn")) {
        handleSaveClick(refreshWorkspaceRef);
        return;
    }

}

/**
 * Default state must stay read-only — this is the only place
 * isEditing is ever set to true, and it only runs on an explicit
 * Edit click.
 */
function enterEditMode(workspace) {

    if (isEditing) return;

    isEditing = true;

    applyEditingUI(workspace);

    // Only Personal Identity has editable fields — Completion/
    // Preferences/Activity never re-fetch or re-render on Edit.
    loadIdentity(workspace);

}

/**
 * Exits edit mode and restores the original values by re-running
 * the same fetch*() calls the page loaded with — safe even after
 * a successful Save, since by then the "original values" already
 * are the saved ones.
 */
function exitEditMode(workspace) {

    if (!isEditing) return;

    isEditing = false;

    applyEditingUI(workspace);

    loadAllSections(workspace);

}

function applyEditingUI(workspace) {

    const contentEl = workspace.querySelector(".iop-profile");
    if (contentEl) {
        contentEl.classList.toggle("iop-profile--editing", isEditing);
    }

    const editWrap = workspace.querySelector("#iopEditWrap");
    const saveWrap = workspace.querySelector("#iopSaveWrap");
    const cancelWrap = workspace.querySelector("#iopCancelWrap");
    const editBtn = workspace.querySelector("#iopEditBtn");

    if (editWrap) editWrap.hidden = isEditing;
    if (saveWrap) saveWrap.hidden = !isEditing;
    if (cancelWrap) cancelWrap.hidden = !isEditing;
    if (editBtn) editBtn.setAttribute("aria-pressed", String(isEditing));

}

/* ==========================================================
   Save — validation + write
========================================================== */

function clearFieldError(workspace, errorId) {

    const errorEl = workspace.querySelector(`#${errorId}`);
    if (!errorEl) return;

    errorEl.textContent = "";
    errorEl.classList.remove("show");

}

function showFieldError(workspace, errorId, message) {

    const errorEl = workspace.querySelector(`#${errorId}`);
    if (!errorEl) return;

    errorEl.textContent = message;
    errorEl.classList.add("show");

}

function readIdentityFormValues(workspace) {

    const fullNameInput = workspace.querySelector("#iopOwnerFullNameInput");
    const designationInput = workspace.querySelector("#iopOwnerDesignationInput");
    const phoneInput = workspace.querySelector("#iopOwnerPhoneInput");

    return {
        fullName: (fullNameInput?.value ?? "").trim(),
        designation: (designationInput?.value ?? "").trim(),
        phone: (phoneInput?.value ?? "").trim()
    };

}

function setSaveButtonState(workspace, { saving }) {

    const saveBtn = workspace.querySelector("#iopSaveBtn");
    if (!saveBtn) return;

    saveBtn.disabled = saving;

    const textEl = saveBtn.querySelector(".btn-text");
    if (textEl) {
        textEl.textContent = saving ? "Saving..." : "Save";
    }

}

async function handleSaveClick(workspace) {

    if (isSaving) return;

    clearFieldError(workspace, "iopOwnerFullNameError");
    clearFieldError(workspace, "iopSaveError");

    const values = readIdentityFormValues(workspace);

    const nameCheck = validateName(values.fullName);

    if (!nameCheck.valid) {
        showFieldError(workspace, "iopOwnerFullNameError", nameCheck.message);
        return;
    }

    isSaving = true;
    setSaveButtonState(workspace, { saving: true });

    try {

        await updateOwnerProfile({
            fullName: values.fullName,
            designation: values.designation,
            phone: values.phone
        });

        isSaving = false;

        isEditing = false;
        applyEditingUI(workspace);

        await loadAllSections(workspace);

    } catch (error) {

        console.error("[CampusOne] My Profile Save Error:", error);

        isSaving = false;
        setSaveButtonState(workspace, { saving: false });

        showFieldError(
            workspace,
            "iopSaveError",
            "Couldn't save your changes. Please try again."
        );

    }

}

/* ==========================================================
   Render / Destroy
========================================================== */

export async function render(workspace) {

    if (!workspace) {

        console.error(
            "[CampusOne] My Profile workspace not found."
        );

        return destroyProfilePage;

    }

    workspace.innerHTML = ProfilePage();

    const contentEl = workspace.querySelector(".iop-profile");
    if (contentEl) {
        Animation.fadeIn(contentEl);
    }

    // Default state must remain read-only on every mount.
    isEditing = false;
    isSaving = false;

    refreshWorkspaceRef = workspace;
    bindHeaderActions(workspace);

    await loadAllSections(workspace);

    return destroyProfilePage;

}

function destroyProfilePage() {

    if (refreshWorkspaceRef) {
        unbindHeaderActions(refreshWorkspaceRef);
        refreshWorkspaceRef = null;
    }

    isEditing = false;
    isSaving = false;

    destroyProfileData();

}
