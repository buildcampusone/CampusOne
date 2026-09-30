/**
 * ==========================================================
 * CampusOne
 * Institution Owner — Create Institution Administrator
 * ----------------------------------------------------------
 * Phase 5.1.2 (Part 1) — Create Institution Administrator
 * UI & Validation Foundation
 * Phase 5.1.2-B — Modal → Full-Screen Page conversion
 *
 * Pure render layer: every function here returns an HTML
 * string and touches nothing else — no DOM queries, no event
 * binding, no state. create-admin.controller.js owns all of
 * that, same UI/Controller split every other module in the app
 * already follows (admin-management.page.js vs .controller.js,
 * register.page.js vs .controller.js, etc.).
 *
 * CreateAdminForm() and CreateAdminFooter()/DiscardConfirmFooter()
 * are unchanged from Part 1 — reused verbatim inside the new
 * CreateAdminPage() shell added below. Only the shell around
 * them is new; the form itself was never modal-specific markup
 * in the first place.
 * ==========================================================
 */

import { Input } from "../../../shared/components/input/input.js";

import { Select } from "../../../shared/components/select/select.js";

import { Button } from "../../../shared/components/button/button.js";

import {
    UserIcon,
    BriefcaseIcon,
    MailIcon,
    PhoneIcon,
    LayersIcon,
    ShieldCheckIcon,
    ArrowLeftIcon
} from "../../../shared/components/icons/index.js";

/* ==========================================================
   Form Body
========================================================== */

export function CreateAdminForm({ statusOptions = [] } = {}) {

    return /* html */ `

        <div
            id="createAdminForm"
            class="ca-form"
        >

            <div class="ca-form-grid">

                <div class="ca-form-field">

                    ${Input({
                        label: "Full Name *",
                        type: "text",
                        placeholder: "e.g. Priya Sharma",
                        id: "caFullName",
                        icon: UserIcon(),
                        errorId: "caFullNameError",
                        maxlength: "50"
                    })}

                </div>

                <div class="ca-form-field">

                    ${Input({
                        label: "Designation *",
                        type: "text",
                        placeholder: "e.g. Vice Principal",
                        id: "caDesignation",
                        icon: BriefcaseIcon(),
                        errorId: "caDesignationError",
                        maxlength: "60"
                    })}

                </div>

                <div class="ca-form-field">

                    ${Input({
                        label: "Official Email *",
                        type: "email",
                        placeholder: "name@institution.edu",
                        id: "caEmail",
                        icon: MailIcon(),
                        errorId: "caEmailError"
                    })}

                </div>

                <div class="ca-form-field">

                    ${Input({
                        label: "Mobile Number *",
                        type: "tel",
                        placeholder: "10-digit mobile number",
                        id: "caMobile",
                        icon: PhoneIcon(),
                        errorId: "caMobileError",
                        maxlength: "10"
                    })}

                </div>

                <div class="ca-form-field">

                    ${Input({
                        label: "Department *",
                        type: "text",
                        placeholder: "e.g. Admissions",
                        id: "caDepartment",
                        icon: LayersIcon(),
                        errorId: "caDepartmentError",
                        maxlength: "60"
                    })}

                </div>

                <div class="ca-form-field">

                    ${Select({
                        label: "Status",
                        id: "caStatus",
                        placeholder: "Select status",
                        options: statusOptions,
                        value: "active"
                    })}

                </div>

                <div class="ca-form-field ca-form-field-full">

                    ${Input({
                        label: "Role",
                        type: "text",
                        id: "caRole",
                        icon: ShieldCheckIcon(),
                        readonly: true,
                        value: "Institution Administrator",
                        hint: "Every administrator created here receives the Institution Administrator role."
                    })}

                </div>

            </div>

        </div>

    `;

}

/* ==========================================================
   Full Page Shell
   ----------------------------------------------------------
   Phase 5.1.2-B — replaces the modal chrome (co-modal-panel /
   co-modal-header / co-modal-body / co-modal-footer) with a
   page-level equivalent: a sticky header (title + Back button,
   in place of the modal's title + ✕), a scrollable body housing
   the exact same CreateAdminForm(), and a sticky footer housing
   the exact same CreateAdminFooter(). create-admin.controller.js
   targets #caPageBody/#caPageFooter as its scoping roots the
   same way it used to target modal.bodyEl/modal.footerEl — the
   validation/submit/discard logic underneath didn't need to
   change shape, only what it's attached to.
========================================================== */

export function CreateAdminPage({ statusOptions = [] } = {}) {

    return /* html */ `

        <section class="ca-page">

            <header class="ca-page-header">

                <button
                    type="button"
                    id="caBackButton"
                    class="ca-back-button co-touch-target co-ripple-surface"
                    aria-label="Back to Institution Admin Management"
                >

                    ${ArrowLeftIcon()}

                </button>

                <div class="ca-page-header-text">

                    <h1 class="ca-page-title" id="caPageTitle">Create Institution Administrator</h1>

                    <p class="ca-page-subtitle">Create an administrator who will manage your institution.</p>

                </div>

            </header>

            <div class="ca-page-body" id="caPageBody">

                ${CreateAdminForm({ statusOptions })}

            </div>

            <footer class="ca-page-footer" id="caPageFooter">

                ${CreateAdminFooter()}

            </footer>

        </section>

    `;

}

/* ==========================================================
   Footer — Default (Reset / Cancel / Create)
========================================================== */

export function CreateAdminFooter() {

    return /* html */ `

        <button
            type="button"
            id="caResetButton"
            class="ca-reset-link"
        >

            Reset Form

        </button>

        <div class="ca-footer-actions">

            ${Button({
                id: "caCancelButton",
                text: "Cancel",
                variant: "secondary",
                type: "button"
            })}

            ${Button({
                id: "caSubmitButton",
                text: "Create Administrator",
                variant: "primary",
                type: "button"
            })}

        </div>

    `;

}

/* ==========================================================
   Footer — Discard Confirmation
   ----------------------------------------------------------
   Swapped into the same footer slot (via modal.setFooter()) the
   moment Cancel/Escape/backdrop is triggered on a dirty form —
   no second modal stacked on top, per Chapter 15's "single
   source of truth" spirit: one modal, one footer, two states.
========================================================== */

export function DiscardConfirmFooter() {

    return /* html */ `

        <div class="ca-discard-bar" role="alertdialog" aria-label="Discard changes?">

            <span class="ca-discard-text">Discard the administrator details you've entered?</span>

            <div class="ca-footer-actions">

                ${Button({
                    id: "caKeepEditingButton",
                    text: "Keep Editing",
                    variant: "secondary",
                    type: "button"
                })}

                ${Button({
                    id: "caDiscardButton",
                    text: "Discard",
                    variant: "primary",
                    type: "button"
                })}

            </div>

        </div>

    `;

}
