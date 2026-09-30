/**
 * ==========================================================
 * CampusOne
 * Institution Owner — Institution Admin Management
 * Administrator Actions (Menu + Edit/Suspend/Activate)
 * ----------------------------------------------------------
 * Phase 5.1.6 — Administrator Actions UI
 *
 * Owns everything admin-management.card.js's per-row "more
 * actions" menu can now do: open/close the panel it renders,
 * and dispatch each `data-menu-action` to the real controller
 * calls admin-management.controller.js already exposed back in
 * Phase 5.1.4/5.1.5 (suspendAdministrator/activateAdministrator/
 * updateAdministratorProfile) — this file adds no new business
 * logic and no new Firestore access of its own; it only wires a
 * UI to logic that already existed.
 *
 * Menu behavior is a small, page-scoped helper (one open panel
 * at a time, outside-click/Escape close, aria-expanded sync) —
 * deliberately NOT shared/core/navigation/topbar-panel.engine.js.
 * That engine is a registry of a fixed set of *named* panels
 * (profile/notification); this page renders one panel per
 * Administrator Directory row, a dynamic list the engine's
 * `registerPanel(name, els)` contract was never shaped for.
 * Reusing it here would mean either abusing `name` as a
 * per-admin-id key (nothing else in the app does that) or
 * widening the engine itself — both bigger changes than this
 * phase's Locked Scope allows. What IS reused is the *visual*
 * pattern (see admin-management.css's own Phase 5.1.6 section).
 *
 * Edit/Suspend/Activate all reuse the same generic
 * shared/components/modal (createModal) — its first real
 * caller; Create Administrator moved off it in Phase 5.1.2-B.
 * ========================================================== */

import { createModal } from "../../../shared/components/modal/modal.js";
import { Input } from "../../../shared/components/input/input.js";
import { Button } from "../../../shared/components/button/button.js";
import { showToast } from "../../../shared/components/toast/toast.js";
import { setButtonLoading, resetButton } from "../../../shared/utils/button-state.js";

import {
    UserIcon,
    BriefcaseIcon,
    PhoneIcon,
    LayersIcon
} from "../../../shared/components/icons/index.js";

import {
    suspendAdministrator,
    activateAdministrator,
    updateAdministratorProfile
} from "./admin-management.controller.js";

import {
    validateFullName,
    validateDesignation,
    validateMobile,
    validateDepartment
} from "./create-admin.validation.js";

import { canManageAdministrators } from "../../../shared/services/permission.service.js";
import { getUserProfile } from "../../../shared/services/auth.service.js";

/* ==========================================================
   Module State
   ----------------------------------------------------------
   One open card menu, and one open modal, at a time — mirrors
   the "only one dropdown panel open at once" rule every other
   panel in this app already follows. Reset on destroy so a
   re-mount of the Directory view never inherits a stale
   reference to DOM that's already been replaced.
========================================================== */

let openMenuWrap = null;
let activeModal = null;
let boundDirectoryWrap = null;
let delegatedClickHandler = null;
let documentClickHandler = null;
let documentKeydownHandler = null;

/* ==========================================================
   Public API
========================================================== */

/**
 * Binds the Directory's actions menu + Edit/Suspend/Activate
 * once per Directory-view mount. `#iamDirectoryWrap` itself is
 * never replaced by refreshDirectory() — only its innerHTML —
 * so event delegation here survives every re-render without
 * needing to be re-bound, the same reasoning bindToolbar()
 * already relies on for the Search/Filter controls.
 *
 * @param {HTMLElement} workspace
 * @param {{onActionComplete: () => void}} handlers
 *   onActionComplete is called after a successful Edit/Suspend/
 *   Activate — admin-management.page.js passes its own
 *   refreshDirectory(workspace) so this file never needs to
 *   know how the Directory re-renders itself.
 */
export function bindDirectoryActions(workspace, { onActionComplete } = {}) {

    const directoryWrap = workspace.querySelector("#iamDirectoryWrap");

    if (!directoryWrap || directoryWrap.dataset.actionsBound === "true") return;

    directoryWrap.dataset.actionsBound = "true";

    boundDirectoryWrap = directoryWrap;

    // Permission-aware visibility (Locked Guideline: hide/disable
    // rather than relying on the fact this whole page is already
    // route-gated to Institution Owner — a second, cheap check
    // here rather than trusting only the page-level guard).
    if (!canManageAdministrators(getUserProfile())) {

        directoryWrap
            .querySelectorAll(".iam-admin-card-menu-btn")
            .forEach((button) => {
                button.disabled = true;
                button.setAttribute("aria-disabled", "true");
            });

        return;

    }

    delegatedClickHandler = (event) => handleDelegatedClick(event, workspace, onActionComplete);

    directoryWrap.addEventListener("click", delegatedClickHandler);

    documentClickHandler = (event) => {

        if (!openMenuWrap) return;

        if (!openMenuWrap.contains(event.target)) {
            closeOpenMenu();
        }

    };

    documentKeydownHandler = (event) => {

        if (event.key === "Escape" && openMenuWrap) {
            closeOpenMenu(true);
        }

    };

    document.addEventListener("click", documentClickHandler);
    document.addEventListener("keydown", documentKeydownHandler);

}

/**
 * Undoes bindDirectoryActions() — called from
 * admin-management.page.js's destroyDirectoryView() alongside
 * every other teardown it already runs.
 */
export function destroyDirectoryActions() {

    if (boundDirectoryWrap && delegatedClickHandler) {
        boundDirectoryWrap.removeEventListener("click", delegatedClickHandler);
    }

    if (documentClickHandler) {
        document.removeEventListener("click", documentClickHandler);
    }

    if (documentKeydownHandler) {
        document.removeEventListener("keydown", documentKeydownHandler);
    }

    if (activeModal) {
        activeModal.destroy();
    }

    openMenuWrap = null;
    activeModal = null;
    boundDirectoryWrap = null;
    delegatedClickHandler = null;
    documentClickHandler = null;
    documentKeydownHandler = null;

}

/* ==========================================================
   Menu Open / Close
========================================================== */

function openMenu(wrap) {

    if (openMenuWrap && openMenuWrap !== wrap) {
        closeOpenMenu();
    }

    const button = wrap.querySelector(".iam-admin-card-menu-btn");
    const panel = wrap.querySelector(".iam-admin-card-menu");

    if (!button || !panel) return;

    panel.hidden = false;
    wrap.classList.add("is-open");
    button.setAttribute("aria-expanded", "true");

    openMenuWrap = wrap;

}

function closeOpenMenu(focusTrigger = false) {

    if (!openMenuWrap) return;

    const wrap = openMenuWrap;

    const button = wrap.querySelector(".iam-admin-card-menu-btn");
    const panel = wrap.querySelector(".iam-admin-card-menu");

    if (panel) panel.hidden = true;

    wrap.classList.remove("is-open");

    if (button) {

        button.setAttribute("aria-expanded", "false");

        if (focusTrigger) button.focus();

    }

    openMenuWrap = null;

}

/* ==========================================================
   Delegated Click Routing
========================================================== */

function handleDelegatedClick(event, workspace, onActionComplete) {

    const menuButton = event.target.closest(".iam-admin-card-menu-btn");

    if (menuButton) {

        const wrap = menuButton.closest(".iam-admin-card-menu-wrap");

        if (!wrap) return;

        if (openMenuWrap === wrap) {
            closeOpenMenu();
        } else {
            openMenu(wrap);
        }

        return;

    }

    const menuItem = event.target.closest("[data-menu-action]");

    if (menuItem) {

        const wrap = menuItem.closest(".iam-admin-card-menu-wrap");

        if (!wrap) return;

        const admin = readAdminFromWrap(wrap);

        closeOpenMenu();

        const action = menuItem.dataset.menuAction;

        if (action === "edit") {
            openEditModal(admin, workspace, onActionComplete);
        } else if (action === "suspend" || action === "activate") {
            openConfirmModal(admin, action, workspace, onActionComplete);
        }

    }

}

function readAdminFromWrap(wrap) {

    return {
        id: wrap.dataset.adminId || "",
        fullName: wrap.dataset.fullName || "",
        designation: wrap.dataset.designation || "",
        mobile: wrap.dataset.mobile || "",
        department: wrap.dataset.department || "",
        status: wrap.dataset.status || ""
    };

}

/* ==========================================================
   Edit Administrator Modal
   ----------------------------------------------------------
   Only the fields firestore.rules' users/{uid} update rule
   (Phase 5.1.4) actually lets an Institution Owner change via
   this path — fullName, designation, mobile, department. Email
   and role are never shown here; they're not editable through
   this write path (see admin-directory.service.js's
   updateInstitutionAdminProfile() and the rule it maps to).
========================================================== */

function EditAdminForm(admin) {

    return /* html */ `

        <div id="iamEditForm" class="iam-edit-form">

            <div class="iam-edit-form-field">

                ${Input({
                    label: "Full Name *",
                    type: "text",
                    id: "iamEditFullName",
                    icon: UserIcon(),
                    errorId: "iamEditFullNameError",
                    value: admin.fullName,
                    maxlength: "50"
                })}

            </div>

            <div class="iam-edit-form-field">

                ${Input({
                    label: "Designation *",
                    type: "text",
                    id: "iamEditDesignation",
                    icon: BriefcaseIcon(),
                    errorId: "iamEditDesignationError",
                    value: admin.designation,
                    maxlength: "60"
                })}

            </div>

            <div class="iam-edit-form-field">

                ${Input({
                    label: "Mobile Number *",
                    type: "tel",
                    id: "iamEditMobile",
                    icon: PhoneIcon(),
                    errorId: "iamEditMobileError",
                    value: admin.mobile,
                    maxlength: "10"
                })}

            </div>

            <div class="iam-edit-form-field">

                ${Input({
                    label: "Department *",
                    type: "text",
                    id: "iamEditDepartment",
                    icon: LayersIcon(),
                    errorId: "iamEditDepartmentError",
                    value: admin.department,
                    maxlength: "60"
                })}

            </div>

        </div>

    `;

}

function EditAdminFooter() {

    return /* html */ `

        ${Button({
            text: "Cancel",
            type: "button",
            variant: "secondary",
            id: "iamEditCancelBtn"
        })}

        ${Button({
            text: "Save Changes",
            type: "button",
            variant: "primary",
            id: "iamEditSaveBtn"
        })}

    `;

}

function showFieldError(root, fieldId, message) {

    const errorEl = root.querySelector(`#${fieldId}Error`);
    const inputEl = root.querySelector(`#${fieldId}`);

    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add("show");
    }

    if (inputEl) {
        inputEl.classList.add("error");
    }

}

function clearFieldErrors(root, fieldIds) {

    fieldIds.forEach((fieldId) => {

        const errorEl = root.querySelector(`#${fieldId}Error`);
        const inputEl = root.querySelector(`#${fieldId}`);

        if (errorEl) {
            errorEl.textContent = "";
            errorEl.classList.remove("show");
        }

        if (inputEl) {
            inputEl.classList.remove("error");
        }

    });

}

function openEditModal(admin, workspace, onActionComplete) {

    if (activeModal) activeModal.destroy();

    activeModal = createModal({
        id: "iamEditAdminModal",
        title: "Edit Administrator",
        subtitle: admin.fullName || "",
        bodyHtml: EditAdminForm(admin),
        footerHtml: EditAdminFooter()
    });

    const modalEl = activeModal.element;

    const cancelBtn = modalEl.querySelector("#iamEditCancelBtn");
    const saveBtn = modalEl.querySelector("#iamEditSaveBtn");

    const fieldIds = [
        "iamEditFullName",
        "iamEditDesignation",
        "iamEditMobile",
        "iamEditDepartment"
    ];

    cancelBtn?.addEventListener("click", () => activeModal?.close());

    saveBtn?.addEventListener("click", () => {

        clearFieldErrors(modalEl, fieldIds);

        const values = {
            fullName: modalEl.querySelector("#iamEditFullName")?.value.trim() || "",
            designation: modalEl.querySelector("#iamEditDesignation")?.value.trim() || "",
            mobile: modalEl.querySelector("#iamEditMobile")?.value.trim() || "",
            department: modalEl.querySelector("#iamEditDepartment")?.value.trim() || ""
        };

        const validators = [
            ["iamEditFullName", validateFullName(values.fullName)],
            ["iamEditDesignation", validateDesignation(values.designation)],
            ["iamEditMobile", validateMobile(values.mobile)],
            ["iamEditDepartment", validateDepartment(values.department)]
        ];

        const firstInvalid = validators.find(([, result]) => !result.valid);

        if (firstInvalid) {

            const [fieldId, result] = firstInvalid;

            showFieldError(modalEl, fieldId, result.message);
            modalEl.querySelector(`#${fieldId}`)?.focus();

            return;

        }

        setButtonLoading(saveBtn, "Saving...");
        if (cancelBtn) cancelBtn.disabled = true;
        activeModal?.setCloseDisabled(true);

        updateAdministratorProfile(admin.id, values)
            .then(() => {

                showToast({
                    type: "success",
                    title: "Administrator Updated",
                    message: `${values.fullName}'s details have been saved.`
                });

                activeModal?.destroy();
                activeModal = null;

                onActionComplete?.();

            })
            .catch((error) => {

                resetButton(saveBtn, "Save Changes");
                if (cancelBtn) cancelBtn.disabled = false;
                activeModal?.setCloseDisabled(false);

                showToast({
                    type: "error",
                    title: "Couldn't Save Changes",
                    message: error.message || "Something went wrong. Please try again."
                });

            });

    });

    activeModal.open();

}

/* ==========================================================
   Suspend / Activate Confirmation Modal
========================================================== */

const CONFIRM_COPY = {
    suspend: {
        title: "Suspend Administrator",
        message: (name) => `${name} will lose access to the Institution Admin dashboard immediately. You can reactivate them at any time.`,
        confirmText: "Suspend",
        confirmVariant: "primary",
        confirmDangerStyle: true
    },
    activate: {
        title: "Activate Administrator",
        message: (name) => `${name} will regain access to the Institution Admin dashboard.`,
        confirmText: "Activate",
        confirmVariant: "primary",
        confirmDangerStyle: false
    }
};

function ConfirmActionFooter(copy) {

    return /* html */ `

        ${Button({
            text: "Cancel",
            type: "button",
            variant: "secondary",
            id: "iamConfirmCancelBtn"
        })}

        ${Button({
            text: copy.confirmText,
            type: "button",
            variant: copy.confirmVariant,
            id: "iamConfirmActionBtn"
        })}

    `;

}

function openConfirmModal(admin, action, workspace, onActionComplete) {

    const copy = CONFIRM_COPY[action];

    if (!copy) return;

    if (activeModal) activeModal.destroy();

    activeModal = createModal({
        id: "iamConfirmActionModal",
        title: copy.title,
        bodyHtml: `<p class="iam-confirm-message">${copy.message(admin.fullName || "This administrator")}</p>`,
        footerHtml: ConfirmActionFooter(copy)
    });

    const modalEl = activeModal.element;

    const cancelBtn = modalEl.querySelector("#iamConfirmCancelBtn");
    const confirmBtn = modalEl.querySelector("#iamConfirmActionBtn");

    if (copy.confirmDangerStyle) {
        confirmBtn?.classList.add("iam-confirm-btn--danger");
    }

    cancelBtn?.addEventListener("click", () => activeModal?.close());

    confirmBtn?.addEventListener("click", () => {

        setButtonLoading(confirmBtn, copy.confirmText + "...");
        if (cancelBtn) cancelBtn.disabled = true;
        activeModal?.setCloseDisabled(true);

        const request = action === "suspend"
            ? suspendAdministrator(admin.id)
            : activateAdministrator(admin.id);

        request
            .then(() => {

                showToast({
                    type: "success",
                    title: action === "suspend" ? "Administrator Suspended" : "Administrator Activated",
                    message: `${admin.fullName || "The administrator"} has been ${action === "suspend" ? "suspended" : "activated"}.`
                });

                activeModal?.destroy();
                activeModal = null;

                onActionComplete?.();

            })
            .catch((error) => {

                resetButton(confirmBtn, copy.confirmText);
                if (cancelBtn) cancelBtn.disabled = false;
                activeModal?.setCloseDisabled(false);

                showToast({
                    type: "error",
                    title: "Couldn't Complete Action",
                    message: error.message || "Something went wrong. Please try again."
                });

            });

    });

    activeModal.open();

}
