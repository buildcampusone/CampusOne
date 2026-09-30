/**
 * ==========================================================
 * CampusOne
 * Institution Owner — Institution Profile Page
 * ----------------------------------------------------------
 * Phase A — Institution Profile Split
 *
 * Sidebar-facing "Institution Profile" module: Identity /
 * Contact / Address / Branding / Subscription / Verification /
 * Institution Completion. Split out of what was previously
 * modules/institution-owner/profile/profile.page.js (which
 * incorrectly mixed institution data with the Owner's own
 * personal identity under "My Profile"). Owner Information is
 * deliberately NOT here — see modules/institution-owner/profile/
 * for that.
 *
 * Card markup, skeletons, and the Edit/Save/Cancel state
 * machine below are carried over unchanged from that file's
 * Phase 4.1/4.2 work (same fetch*Section() calls, same
 * co-card/iop- class names, same fade-in lifecycle) — this is a
 * relocation, not a rewrite. Save is still disabled: no section
 * here has a write path wired to a click handler yet (Phase C).
 * ==========================================================
 */

import {
    fetchIdentitySection,
    fetchContactSection,
    fetchAddressSection,
    fetchBrandingSection,
    fetchSubscriptionSection,
    fetchProfileCompletion,
    fetchVerificationStatus,
    updateInstitutionProfile,
    getCurrentInstitutionId,
    destroyInstitutionProfile
} from "./institution-profile.controller.js";

import { Animation } from "../../../shared/core/animation/animation.service.js";

import { showToast } from "../../../shared/components/toast/toast.js";

import { BaseSkeleton } from "../../../shared/components/skeleton/base/base.skeleton.js";

import { Badge } from "../../../shared/components/badge/badge.js";

import { Button } from "../../../shared/components/button/button.js";

import { Input } from "../../../shared/components/input/input.js";

import { Select } from "../../../shared/components/select/select.js";

import {
    BRANDING_UPLOADS_ENABLED,
    BRANDING_UPLOAD_UNAVAILABLE_MESSAGE,
    uploadBrandingImage,
    deleteBrandingImage
} from "../../../shared/services/branding-upload.service.js";

import {
    InstitutionIcon,
    BuildingIcon,
    MailIcon,
    GlobeIcon,
    SparklesIcon,
    CreditCardIcon,
    BarChartIcon,
    ShieldCheckIcon,
    EditIcon,
    CheckIcon,
    CloseIcon,
    ClockIcon,
    PlusIcon
} from "../../../shared/components/icons/index.js";

/* ==========================================================
   Icon Registry
========================================================== */

/* ==========================================================
   Icon Registry
   ----------------------------------------------------------
   Same "controller hands back a plain string key, page.js maps
   it to a live icon component" convention dashboard.page.js's
   own ICONS registry already established — no new icon assets,
   100% reuse of shared/components/icons.
========================================================== */

const ICONS = {

    identity: BuildingIcon,
    contact: MailIcon,
    address: GlobeIcon,
    branding: SparklesIcon,
    subscription: CreditCardIcon,
    completion: BarChartIcon,
    verification: ShieldCheckIcon,
    institution: InstitutionIcon

};

function renderIcon(key) {

    const IconComponent = ICONS[key] || InstitutionIcon;

    return IconComponent();

}

/* ==========================================================
   Institution Type Options
   ----------------------------------------------------------
   Phase 4.2 — Part 4. Mirrors registration.page.js's own
   INSTITUTION_TYPE_OPTIONS exactly — institutions/{id}.profile.type
   is written from that same fixed set at registration, so editing
   it here has to offer the identical set rather than free text.
   Kept local (not imported from the registration module) since
   Owner Profile has no dependency on the Registration flow
   anywhere else in this file.
========================================================== */

const INSTITUTION_TYPE_OPTIONS = [
    { value: "school", label: "School" },
    { value: "college", label: "College" },
    { value: "university", label: "University" },
    { value: "coaching", label: "Coaching Institute" },
    { value: "training-center", label: "Training Center" },
    { value: "other", label: "Other" }
];
/* ==========================================================
   Shared Primitives
   ----------------------------------------------------------
   FieldRow() is the base every read-only field-list section
   (Identity / Contact / Address / Subscription) renders with.
   `value` is escaped as plain text; `null`/`undefined`/empty
   string always render the same honest empty state — never an
   invented placeholder value.
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

/**
 * Generic error card — every section falls back to this on a
 * thrown/rejected fetch, per the Phase 4.1 spec's "never
 * silently fall back to empty content" rule. Distinct from the
 * Empty state below: this means the fetch itself failed, not
 * that the data legitimately has nothing in it.
 */
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

/** Skeleton for a simple N-row field list, reused by every card that renders via FieldRow(). */
function FieldListSkeleton(rows = 4) {

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
   Section 1 — Page Header
   ----------------------------------------------------------
   Combines fetchIdentitySection() + fetchBrandingSection() for
   display only (logo + name + code + type + affiliation) — no
   business logic beyond picking fields already resolved by the
   controller, same "page composes, controller decides" split
   every section below follows.
========================================================== */

function HeaderCard(identity, branding) {

    const logo = branding.logoUrl
        ? /* html */ `<img src="${escapeHtml(branding.logoUrl)}" alt="" />`
        : renderIcon("institution");

    return /* html */ `

        <header class="co-card iop-header-card" role="region" aria-labelledby="iopHeaderName">

            <div class="iop-header-identity">

                <div class="iop-header-logo" aria-hidden="true">
                    ${logo}
                </div>

                <div class="iop-header-text">

                    <div class="iop-header-name-row">
                        <h1 class="iop-header-name" id="iopHeaderName" title="${escapeHtml(identity.name || "Institution")}">
                            ${escapeHtml(identity.name || "Institution")}
                        </h1>
                    </div>

                    <div class="iop-header-meta">

                        ${identity.code ? /* html */ `
                            <span class="iop-header-pill" title="Institution Code (read-only)">
                                ${identity.code}
                            </span>
                        ` : ""}

                        ${identity.type ? /* html */ `
                            <span class="iop-header-pill">${escapeHtml(identity.type)}</span>
                        ` : ""}

                        ${identity.affiliation ? /* html */ `
                            <span class="iop-header-pill">${escapeHtml(identity.affiliation)}</span>
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
                        icon: CheckIcon(),
                        disabled: true
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
            <p class="iop-error-title">Failed to load Institution Profile header.</p>
            <p class="iop-error-description">Please refresh the page to try again.</p>
        </div>

    `;

}
/* ==========================================================
   Section 2 — Institution Identity
========================================================== */

/**
 * @param {object} identity - fetchIdentitySection() payload.
 * @param {boolean} isEditing - Phase 4.2 Part 4: when true, Name /
 *   Type / Established Year / Affiliation render as shared
 *   Input()/Select() fields instead of plain text. Code stays a
 *   FieldRow (marked Read Only) in both modes — `codeEditable:
 *   false` (profile.controller.js) is a business rule, not a UI
 *   choice, so it is never given an input here. Card shell,
 *   spacing, and every other section are untouched by this flag.
 *   Description moved out to its own dedicated DescriptionCard()
 *   below (Phase 4.3) — it no longer renders here in either mode.
 */
function IdentityCard(identity, isEditing = false) {

    const fieldsHtml = isEditing ? /* html */ `

        <div class="iop-field-list">

            <div class="iop-owner-edit-fields">

                ${Input({
                    label: "Name",
                    type: "text",
                    id: "iopIdentityNameInput",
                    placeholder: "Institution Name"
                })}

                ${FieldRow("Code", identity.code, { readOnly: true })}

                ${Select({
                    label: "Type",
                    id: "iopIdentityTypeSelect",
                    placeholder: "Select Institution Type",
                    options: INSTITUTION_TYPE_OPTIONS
                })}

                ${Input({
                    label: "Established Year",
                    type: "number",
                    id: "iopIdentityEstablishedYearInput",
                    placeholder: "Established Year"
                })}

                ${Input({
                    label: "Affiliation",
                    type: "text",
                    id: "iopIdentityAffiliationInput",
                    placeholder: "Affiliation"
                })}

            </div>

        </div>

    ` : /* html */ `

        <div class="iop-field-list">

            ${FieldRow("Name", identity.name)}
            ${FieldRow("Code", identity.code, { readOnly: true })}
            ${FieldRow("Type", identity.type)}
            ${FieldRow("Established Year", identity.establishedYear)}
            ${FieldRow("Affiliation", identity.affiliation)}

        </div>

    `;

    return CardShell({
        className: "iop-card--identity",
        accentClass: "iop-card--identity",
        ariaId: "iopIdentityHeading",
        iconKey: "identity",
        title: "Institution Identity",
        bodyHtml: fieldsHtml
    });

}

/**
 * Pre-fills the Institution Identity edit-mode inputs from the same
 * fetchIdentitySection() payload the card was just rendered with —
 * same pattern as prefillOwnerInputs()/prefillContactInputs(). Safe
 * to call unconditionally; each querySelector is a no-op when read
 * mode is showing (the inputs don't exist in that markup).
 */
function prefillIdentityInputs(wrap, identity) {

    const nameInput = wrap.querySelector("#iopIdentityNameInput");
    const typeSelect = wrap.querySelector("#iopIdentityTypeSelect");
    const establishedYearInput = wrap.querySelector("#iopIdentityEstablishedYearInput");
    const affiliationInput = wrap.querySelector("#iopIdentityAffiliationInput");

    if (nameInput) nameInput.value = identity.name || "";
    if (typeSelect) typeSelect.value = identity.type || "";
    if (establishedYearInput) establishedYearInput.value = identity.establishedYear ?? "";
    if (affiliationInput) affiliationInput.value = identity.affiliation || "";

}

function IdentitySkeleton() {

    return /* html */ `
        <div class="co-card iop-card iop-card--identity iop-identity-skeleton" aria-hidden="true">
            <div class="iop-card-header">
                ${BaseSkeleton.circle(40)}
                ${BaseSkeleton.rounded("160px", "20px")}
            </div>
            ${FieldListSkeleton(5)}
        </div>
    `;

}

/* ==========================================================
   Section 2B — Institution Description (Phase 4.3)
   ----------------------------------------------------------
   institutions/{id}.profile.description — split out of
   IdentityCard into its own full-width Premium Card, per its own
   editing rules (a long-form textarea with a live counter is a
   different UI shape than the short single-line Name/Type/
   Established Year/Affiliation fields above it). Still the exact
   same underlying Firestore field
   (fetchIdentitySection().description, written through
   updateInstitutionProfile("profile", { description })) — this
   is a UI split, not a new data source.
========================================================== */

const DESCRIPTION_MIN_LENGTH = 50;
const DESCRIPTION_MAX_LENGTH = 1000;

const DESCRIPTION_PLACEHOLDER =
    "Tell students, parents and visitors about your institution, " +
    "its mission, academic excellence, facilities, achievements and vision.";

/**
 * @param {object} identity - fetchIdentitySection() payload (same
 *   shape IdentityCard() renders — this card just reads its
 *   `.description` field).
 * @param {boolean} isEditing
 */
function DescriptionCard(identity, isEditing = false) {

    const description = identity.description || "";
    const length = description.length;
    const counterInvalid = length < DESCRIPTION_MIN_LENGTH || length > DESCRIPTION_MAX_LENGTH;

    const body = isEditing ? /* html */ `

        <div class="iop-desc-field">

            <textarea
                id="iopDescriptionTextarea"
                class="iop-desc-textarea"
                placeholder="${escapeHtml(DESCRIPTION_PLACEHOLDER)}"
                maxlength="${DESCRIPTION_MAX_LENGTH}"
                rows="6"
            >${escapeHtml(description)}</textarea>

            <div class="iop-desc-meta">

                <span class="iop-desc-hint">Minimum ${DESCRIPTION_MIN_LENGTH} characters</span>

                <span
                    class="iop-desc-counter ${counterInvalid ? "iop-desc-counter--invalid" : ""}"
                    id="iopDescriptionCounter"
                >
                    ${length} / ${DESCRIPTION_MAX_LENGTH}
                </span>

            </div>

        </div>

    ` : (description
        ? /* html */ `<p class="iop-field-description">${escapeHtml(description)}</p>`
        : EmptyCard(
            "identity",
            "No description yet",
            "Tell students, parents, and visitors about your institution's mission, facilities, and achievements."
        )
    );

    return CardShell({
        className: "iop-card--description iop-card--full",
        accentClass: "iop-card--description",
        ariaId: "iopDescriptionHeading",
        iconKey: "identity",
        title: "Institution Description",
        bodyHtml: body
    });

}

function DescriptionSkeleton() {

    return /* html */ `
        <div class="co-card iop-card iop-card--description iop-card--full iop-description-skeleton" aria-hidden="true">
            <div class="iop-card-header">
                ${BaseSkeleton.circle(40)}
                ${BaseSkeleton.rounded("220px", "20px")}
            </div>
            ${BaseSkeleton.rounded("100%", "120px", "var(--radius-md)")}
        </div>
    `;

}

/**
 * Updates the live character counter as the Owner types — a pure
 * DOM patch, no re-render, so the textarea never loses focus or
 * cursor position mid-edit.
 */
function updateDescriptionCounter(textarea) {

    const counterEl = textarea
        .closest(".iop-desc-field")
        ?.querySelector("#iopDescriptionCounter");

    if (!counterEl) return;

    const length = textarea.value.length;

    counterEl.textContent = `${length} / ${DESCRIPTION_MAX_LENGTH}`;

    counterEl.classList.toggle(
        "iop-desc-counter--invalid",
        length < DESCRIPTION_MIN_LENGTH || length > DESCRIPTION_MAX_LENGTH
    );

}

function collectDescriptionPartial(wrap) {

    if (!wrap) return null;

    const textarea = wrap.querySelector("#iopDescriptionTextarea");

    if (!textarea) return null;

    return textarea.value.trim();

}

function validateDescriptionPartial(partial) {

    if (partial === null) return null;

    if (!partial) {
        return "Institution description is required.";
    }

    if (partial.length < DESCRIPTION_MIN_LENGTH) {
        return `Institution description must be at least ${DESCRIPTION_MIN_LENGTH} characters.`;
    }

    if (partial.length > DESCRIPTION_MAX_LENGTH) {
        return `Institution description cannot exceed ${DESCRIPTION_MAX_LENGTH} characters.`;
    }

    return null;

}

/* ==========================================================
   Section 3 — Contact Information
========================================================== */

/**
 * @param {object} contact - fetchContactSection() payload.
 * @param {boolean} isEditing - Phase 4.2 Part 3: when true, Email /
 *   Mobile / Website render as shared Input() fields instead of
 *   plain text. Only these three fields exist on
 *   institutions/{id}.contact, so nothing else is added. Card
 *   shell, spacing, and every other section are untouched by
 *   this flag.
 */
function ContactCard(contact, isEditing = false) {

    const body = isEditing ? /* html */ `

        <div class="iop-owner-edit-fields">

            ${Input({
                label: "Email",
                type: "email",
                id: "iopContactEmailInput",
                placeholder: "Email"
            })}

            ${Input({
                label: "Mobile",
                type: "tel",
                id: "iopContactMobileInput",
                placeholder: "Mobile"
            })}

            ${Input({
                label: "Website",
                type: "url",
                id: "iopContactWebsiteInput",
                placeholder: "Website"
            })}

        </div>

    ` : /* html */ `

        <div class="iop-field-list">
            ${FieldRow("Email", contact.email)}
            ${FieldRow("Mobile", contact.mobile)}
            ${FieldRow("Website", contact.website)}
        </div>

    `;

    return CardShell({
        className: "iop-card--contact",
        accentClass: "iop-card--contact",
        ariaId: "iopContactHeading",
        iconKey: "contact",
        title: "Contact Information",
        bodyHtml: body
    });

}

/**
 * Pre-fills the Contact Information edit-mode inputs from the same
 * fetchContactSection() payload the card was just rendered with —
 * same pattern as prefillOwnerInputs(). Safe to call unconditionally;
 * each querySelector is a no-op when read mode is showing.
 */
function prefillContactInputs(wrap, contact) {

    const emailInput = wrap.querySelector("#iopContactEmailInput");
    const mobileInput = wrap.querySelector("#iopContactMobileInput");
    const websiteInput = wrap.querySelector("#iopContactWebsiteInput");

    if (emailInput) emailInput.value = contact.email || "";
    if (mobileInput) mobileInput.value = contact.mobile || "";
    if (websiteInput) websiteInput.value = contact.website || "";

}

function ContactSkeleton() {

    return /* html */ `
        <div class="co-card iop-card iop-card--contact iop-contact-skeleton" aria-hidden="true">
            <div class="iop-card-header">
                ${BaseSkeleton.circle(40)}
                ${BaseSkeleton.rounded("180px", "20px")}
            </div>
            ${FieldListSkeleton(3)}
        </div>
    `;

}

/* ==========================================================
   Section 4 — Address
========================================================== */

function AddressCard(address) {

    const body = /* html */ `

        <div class="iop-field-list">
            ${FieldRow("Country", address.country)}
            ${FieldRow("State", address.state)}
            ${FieldRow("District", address.district)}
            ${FieldRow("City", address.city)}
            ${FieldRow("PIN Code", address.pinCode)}
            ${FieldRow("Full Address", address.fullAddress)}
        </div>

        <div>
            ${address.mapLink
                ? /* html */ `<a class="iop-map-link" href="${escapeHtml(address.mapLink)}" target="_blank" rel="noopener noreferrer">${renderIcon("address")} View on map</a>`
                : /* html */ `<span class="iop-field-value--empty">No map link provided.</span>`}
        </div>

    `;

    return CardShell({
        className: "iop-card--address",
        accentClass: "iop-card--address",
        ariaId: "iopAddressHeading",
        iconKey: "address",
        title: "Address",
        bodyHtml: body
    });

}

function AddressSkeleton() {

    return /* html */ `
        <div class="co-card iop-card iop-card--address iop-address-skeleton" aria-hidden="true">
            <div class="iop-card-header">
                ${BaseSkeleton.circle(40)}
                ${BaseSkeleton.rounded("100px", "20px")}
            </div>
            ${FieldListSkeleton(6)}
        </div>
    `;

}

/* ==========================================================
   Section 5 — Branding
========================================================== */

/**
 * Read-only display tile for a Branding image. `badgeText`, when
 * provided, marks the slot as a not-yet-connected upload target —
 * a subtle status badge plus a dimmed, tappable frame that
 * explains why via showUploadUnavailableToast() (see the
 * ".iop-branding-upload-trigger" delegation in
 * handleHeaderActionClick()) rather than doing nothing. Passing no
 * badgeText keeps the original plain display-only behavior.
 */
function BrandingImageSlot(label, url, badgeText = "") {

    const isUploadPlaceholder = Boolean(badgeText);

    return /* html */ `

        <div class="iop-branding-image-slot">

            <div
                class="iop-branding-image-frame ${isUploadPlaceholder ? "iop-branding-image-frame--disabled iop-branding-upload-trigger" : ""}"
                ${isUploadPlaceholder ? /* html */ `role="button" tabindex="0" aria-disabled="true" aria-label="${escapeHtml(label)} upload — currently unavailable"` : ""}
            >
                ${url ? /* html */ `<img src="${escapeHtml(url)}" alt="" />` : renderIcon("branding")}
            </div>

            <span class="iop-branding-image-label">${escapeHtml(label)}</span>

            ${isUploadPlaceholder ? /* html */ `
                <span class="iop-branding-status-badge">
                    ${Badge({ text: badgeText, variant: "warning" })}
                </span>
            ` : ""}

        </div>

    `;

}

function BrandingColorSwatch(label, hex) {

    return /* html */ `

        <div class="iop-branding-color">

            <span class="iop-branding-swatch" style="background:${hex ? escapeHtml(hex) : "var(--surface-secondary)"}"></span>

            <div class="iop-branding-color-text">
                <span class="iop-branding-color-label">${escapeHtml(label)}</span>
                <span class="iop-branding-color-value ${hex ? "" : "iop-field-value--empty"}">${hex ? escapeHtml(hex) : "Not set"}</span>
            </div>

        </div>

    `;

}

/* ----------------------------------------------------------
   Institution Logo — Upload Management (Phase 4.3)
   ----------------------------------------------------------
   Logo state is intentionally NOT written to Storage/Firestore
   the moment a file is picked — only when the Owner clicks the
   one existing Save button (see handleSaveClick() / "Save Flow —
   Logo" below). The Storage path is fixed
   (institution-logos/{institutionId}/logo.webp — every upload
   overwrites the same object), so uploading before Save would
   mean an unsaved, uncommitted logo is instantly live for every
   visitor even if the Owner clicks Cancel a moment later. Instead:
     - picking a file only validates it and converts it to WebP
       client-side (canvas), then previews the resulting blob via
       a local object URL — zero network calls.
     - Save uploads the already-converted blob (or deletes the
       Storage object, for a pending removal) and only then writes
       branding.logoUrl — so Cancel can always discard cleanly.
---------------------------------------------------------- */

const ALLOWED_LOGO_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const ALLOWED_LOGO_EXTENSIONS = /\.(png|jpe?g|webp)$/i;
const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const LOGO_MAX_DIMENSION = 1024;
const LOGO_WEBP_QUALITY = 0.92;

let logoState = {
    file: null,       // Blob — already WebP-converted, ready to upload on Save
    previewUrl: null, // object URL for `file`, revoked whenever it's replaced
    removed: false,   // Owner clicked "Remove Logo" this edit session
    status: "idle",   // "idle" | "uploading"
    progress: 0
};

// The branding payload BrandingCard()/LogoUploadSlot() were last
// rendered with — needed by renderLogoSlot() to re-render just the
// logo slot (e.g. after picking/removing a file) without re-fetching
// or re-rendering the whole card.
let currentBrandingSnapshot = {
    logoUrl: null, coverUrl: null, faviconUrl: null, primaryColor: null, secondaryColor: null
};

function isAllowedLogoFile(file) {

    if (file.type && ALLOWED_LOGO_MIME_TYPES.includes(file.type)) return true;

    return ALLOWED_LOGO_EXTENSIONS.test(file.name || "");

}

function readFileAsDataUrl(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error("Could not read the selected file."));
        reader.readAsDataURL(file);

    });

}

function loadImageElement(src) {

    return new Promise((resolve, reject) => {

        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("The selected file is not a valid image."));
        img.src = src;

    });

}

/**
 * Decodes `file`, downsizes it to at most LOGO_MAX_DIMENSION px on
 * its longest edge (a logo never needs to be larger than that),
 * and re-encodes it as WebP — normalizing every accepted input
 * format (PNG/JPG/JPEG/WEBP) to the one format the fixed Storage
 * path (…/logo.webp) expects, and keeping the upload small.
 */
async function convertImageToWebp(file) {

    const dataUrl = await readFileAsDataUrl(file);
    const img = await loadImageElement(dataUrl);

    const scale = Math.min(1, LOGO_MAX_DIMENSION / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    canvas.getContext("2d").drawImage(img, 0, 0, width, height);

    return await new Promise((resolve, reject) => {

        canvas.toBlob(
            (blob) => blob
                ? resolve(blob)
                : reject(new Error("Could not process this image. Please try a different file.")),
            "image/webp",
            LOGO_WEBP_QUALITY
        );

    });

}

function resetLogoState() {

    if (logoState.previewUrl) {
        URL.revokeObjectURL(logoState.previewUrl);
    }

    logoState = { file: null, previewUrl: null, removed: false, status: "idle", progress: 0 };

}

function setPendingLogoFile(blob) {

    if (logoState.previewUrl) {
        URL.revokeObjectURL(logoState.previewUrl);
    }

    logoState.file = blob;
    logoState.previewUrl = URL.createObjectURL(blob);
    logoState.removed = false;
    logoState.status = "idle";
    logoState.progress = 0;

}

function renderLogoSlot(workspace) {

    if (!workspace) return;

    const slot = workspace.querySelector("#iopLogoSlot");
    if (!slot) return;

    slot.outerHTML = LogoUploadSlot(currentBrandingSnapshot, logoState);

}

/**
 * Single explanation shown anywhere a Branding upload is
 * attempted while Cloud Storage isn't enabled — Logo's
 * Upload/Change/Remove controls and the disabled Cover Image /
 * Favicon tiles all route here instead of opening a file picker
 * or touching Storage. Message text lives in
 * branding-upload.service.js so it can't drift between call sites.
 */
function showUploadUnavailableToast() {

    showToast({
        type: "info",
        title: "Branding Uploads",
        message: BRANDING_UPLOAD_UNAVAILABLE_MESSAGE,
        duration: 5000
    });

}

function openLogoFilePicker(workspace) {

    if (!workspace || isSaving) return;

    // Cloud Storage isn't enabled yet — explain instead of opening
    // the file picker. See branding-upload.service.js's header for
    // how this flips on once Storage is live.
    if (!BRANDING_UPLOADS_ENABLED) {
        showUploadUnavailableToast();
        return;
    }

    const input = workspace.querySelector("#iopLogoFileInput");
    if (input) input.click();

}

async function handleLogoFileSelected(workspace, file) {

    if (!file || !workspace || isSaving) return;

    if (!isAllowedLogoFile(file)) {

        showToast({
            type: "error",
            title: "Institution Logo",
            message: "Please upload a PNG, JPG, JPEG, or WEBP image."
        });

        return;

    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {

        showToast({
            type: "error",
            title: "Institution Logo",
            message: "Logo must be smaller than 2 MB."
        });

        return;

    }

    try {

        const webpBlob = await convertImageToWebp(file);
        setPendingLogoFile(webpBlob);
        renderLogoSlot(workspace);

    } catch (error) {

        console.error("[CampusOne] Logo Processing Error:", error);

        showToast({
            type: "error",
            title: "Institution Logo",
            message: "Could not process this image. Please try a different file."
        });

    }

}

function handleLogoRemoveClick(workspace) {

    if (!workspace || isSaving) return;

    if (!BRANDING_UPLOADS_ENABLED) {
        showUploadUnavailableToast();
        return;
    }

    if (logoState.previewUrl) {
        URL.revokeObjectURL(logoState.previewUrl);
    }

    logoState.file = null;
    logoState.previewUrl = null;
    logoState.removed = true;
    logoState.status = "idle";
    logoState.progress = 0;

    renderLogoSlot(workspace);

}

/** Targeted DOM patch for real upload progress — called from the
 *  uploadBrandingImage() onProgress callback during Save (once
 *  Cloud Storage is enabled), so a full re-render never interrupts
 *  the in-flight upload. Unreachable while BRANDING_UPLOADS_ENABLED
 *  is false, since logoState.file can never be set in that state. */
function updateLogoProgressUI(workspace, percent) {

    logoState.status = "uploading";
    logoState.progress = percent;

    if (!workspace) return;

    const progressWrap = workspace.querySelector("#iopLogoProgress");
    const fillEl = workspace.querySelector("#iopLogoProgressFill");
    const textEl = workspace.querySelector("#iopLogoProgressText");

    if (progressWrap) progressWrap.classList.remove("iop-logo-progress--hidden");
    if (fillEl) fillEl.style.width = `${percent}%`;
    if (textEl) textEl.textContent = `Uploading… ${percent}%`;

}

/**
 * The Logo tile within the Branding card's edit mode — a Premium
 * Upload Placeholder when empty, a preview + Change/Remove pair
 * once a logo exists (saved or freshly picked). `branding` is the
 * last-fetched Branding section (for the saved logoUrl); `state`
 * is the in-progress `logoState` above.
 */
function LogoUploadSlot(branding, state) {

    const previewUrl = state.file
        ? state.previewUrl
        : (state.removed ? null : branding.logoUrl);

    const hasPreview = Boolean(previewUrl);
    const isUploading = state.status === "uploading";

    return /* html */ `

        <div class="iop-logo-upload" id="iopLogoSlot">

            <div
                class="iop-logo-preview ${hasPreview ? "" : "iop-logo-preview--empty iop-logo-trigger"} ${BRANDING_UPLOADS_ENABLED ? "" : "iop-logo-preview--disabled"}"
                ${hasPreview ? "" : /* html */ `id="iopLogoPlaceholder" role="button" tabindex="0" aria-label="Upload institution logo"`}
                ${BRANDING_UPLOADS_ENABLED ? "" : `aria-disabled="true"`}
            >

                ${hasPreview
                    ? /* html */ `<img src="${escapeHtml(previewUrl)}" alt="Institution logo preview" />`
                    : /* html */ `
                        <div class="iop-logo-placeholder-icon" aria-hidden="true">
                            ${renderIcon("branding")}
                        </div>
                        <span class="iop-logo-placeholder-text">Click to upload</span>
                    `}

            </div>

            <div class="iop-logo-controls">

                ${BRANDING_UPLOADS_ENABLED ? "" : /* html */ `
                    <span class="iop-branding-status-badge">
                        ${Badge({ text: "Storage Required", variant: "warning" })}
                    </span>
                `}

                <div class="iop-logo-actions">

                    ${hasPreview ? /* html */ `

                        <button type="button" class="btn btn-secondary co-ripple-surface iop-logo-trigger ${BRANDING_UPLOADS_ENABLED ? "" : "iop-logo-trigger--disabled"}" id="iopLogoChangeBtn" aria-disabled="${BRANDING_UPLOADS_ENABLED ? "false" : "true"}">
                            <span class="btn-icon">${EditIcon()}</span>
                            <span class="btn-text">Change Logo</span>
                        </button>

                        <button type="button" class="btn btn-secondary co-ripple-surface iop-logo-remove-btn ${BRANDING_UPLOADS_ENABLED ? "" : "iop-logo-trigger--disabled"}" id="iopLogoRemoveBtn" aria-disabled="${BRANDING_UPLOADS_ENABLED ? "false" : "true"}">
                            <span class="btn-icon">${CloseIcon()}</span>
                            <span class="btn-text">Remove Logo</span>
                        </button>

                    ` : /* html */ `

                        <button type="button" class="btn btn-primary co-ripple-surface iop-logo-trigger ${BRANDING_UPLOADS_ENABLED ? "" : "iop-logo-trigger--disabled"}" id="iopLogoUploadBtn" aria-disabled="${BRANDING_UPLOADS_ENABLED ? "false" : "true"}">
                            <span class="btn-icon">${PlusIcon()}</span>
                            <span class="btn-text">Upload Logo</span>
                        </button>

                    `}

                </div>

                <p class="iop-logo-hint">
                    ${BRANDING_UPLOADS_ENABLED
                        ? "PNG, JPG, or WEBP &middot; Max 2&nbsp;MB"
                        : "Uploads will be enabled once Cloud Storage is connected."}
                </p>

                ${state.file ? /* html */ `<p class="iop-logo-pending">New logo ready — will be saved with your other changes.</p>` : ""}
                ${state.removed ? /* html */ `<p class="iop-logo-pending iop-logo-pending--remove">Logo will be removed when you save.</p>` : ""}

                <div class="iop-logo-progress ${isUploading ? "" : "iop-logo-progress--hidden"}" id="iopLogoProgress">
                    <div class="iop-logo-progress-track">
                        <div class="iop-logo-progress-fill" id="iopLogoProgressFill" style="width:${state.progress || 0}%"></div>
                    </div>
                    <span class="iop-logo-progress-text" id="iopLogoProgressText">Uploading… ${state.progress || 0}%</span>
                </div>

            </div>

            <input
                type="file"
                id="iopLogoFileInput"
                class="iop-logo-file-input"
                accept="image/png,image/jpeg,image/webp"
                hidden
            />

        </div>

    `;

}

/**
 * @param {object} branding - fetchBrandingSection() payload.
 * @param {boolean} isEditing - Phase 4.3: Logo swaps to the
 *   upload-management UI above; Cover Image/Favicon stay
 *   read-only display slots in both modes (no upload path exists
 *   for those yet — see fetchBrandingSection()'s own header).
 */
function BrandingCard(branding, isEditing = false) {

    const logoSection = isEditing ? /* html */ `

        <div class="iop-branding-logo-section">
            <span class="iop-branding-image-label">Institution Logo</span>
            ${LogoUploadSlot(branding, logoState)}
        </div>

    ` : "";

    const body = /* html */ `

        ${logoSection}

        <div class="iop-branding-images ${isEditing ? "iop-branding-images--two" : ""}">
            ${isEditing ? "" : BrandingImageSlot("Logo", branding.logoUrl, "Storage Required")}
            ${BrandingImageSlot("Cover Image", branding.coverUrl, "Coming Soon")}
            ${BrandingImageSlot("Favicon", branding.faviconUrl, "Coming Soon")}
        </div>

        <div class="iop-branding-colors">
            ${BrandingColorSwatch("Primary Color", branding.primaryColor)}
            ${BrandingColorSwatch("Secondary Color", branding.secondaryColor)}
        </div>

    `;

    return CardShell({
        className: "iop-card--branding iop-card--full",
        accentClass: "iop-card--branding",
        ariaId: "iopBrandingHeading",
        iconKey: "branding",
        title: "Branding",
        bodyHtml: body
    });

}

function BrandingSkeleton() {

    return /* html */ `
        <div class="co-card iop-card iop-card--branding iop-card--full iop-branding-skeleton" aria-hidden="true">
            <div class="iop-card-header">
                ${BaseSkeleton.circle(40)}
                ${BaseSkeleton.rounded("100px", "20px")}
            </div>
            <div class="iop-branding-images">
                ${BaseSkeleton.rounded("100%", "80px")}
                ${BaseSkeleton.rounded("100%", "80px")}
                ${BaseSkeleton.rounded("100%", "80px")}
            </div>
            <div class="iop-branding-colors">
                ${BaseSkeleton.rounded("140px", "28px")}
                ${BaseSkeleton.rounded("140px", "28px")}
            </div>
        </div>
    `;

}

/**
 * Badge color mapping for institutions/{id}.subscription.status.
 * Keys match shared/constants/status.js's SUBSCRIPTION_STATUS enum
 * exactly (the real, lowercase values fetchSubscriptionSection()
 * hands back) — this was missing entirely, which is why
 * SubscriptionCard() below threw a ReferenceError on every render
 * (Institution Profile "Failed to load Subscription Summary"
 * regression). Same registry-not-inline-logic pattern
 * dashboard.page.js's own SUBSCRIPTION_STATUS_BADGE_VARIANTS uses
 * for its Subscription Overview widget.
 */
const SUBSCRIPTION_STATUS_BADGE_VARIANT = {

    trial: "role",
    active: "success",
    expired: "danger",
    cancelled: "danger"

};

function SubscriptionCard(subscription) {

    const badges = /* html */ `
        <div class="iop-sub-badges">
            ${subscription.plan ? Badge({ text: subscription.plan, variant: "role" }) : ""}
            ${subscription.status ? Badge({ text: subscription.status, variant: SUBSCRIPTION_STATUS_BADGE_VARIANT[subscription.status] || "neutral" }) : ""}
        </div>
    `;

    const body = /* html */ `

        ${badges}

        <div class="iop-field-list">
            ${FieldRow("Current Plan", subscription.plan)}
            ${FieldRow("Billing Cycle", subscription.billingCycle)}
            ${FieldRow("Institution Size", subscription.institutionSize)}
            ${FieldRow("Subscription Status", subscription.status)}
        </div>

    `;

    return CardShell({
        className: "iop-card--subscription",
        accentClass: "iop-card--subscription",
        ariaId: "iopSubscriptionHeading",
        iconKey: "subscription",
        title: "Subscription Summary",
        bodyHtml: body
    });

}

function SubscriptionSkeleton() {

    return /* html */ `
        <div class="co-card iop-card iop-card--subscription iop-subscription-skeleton" aria-hidden="true">
            <div class="iop-card-header">
                ${BaseSkeleton.circle(40)}
                ${BaseSkeleton.rounded("200px", "20px")}
            </div>
            <div class="iop-sub-badges">
                ${BaseSkeleton.rounded("70px", "24px", "var(--radius-full)")}
                ${BaseSkeleton.rounded("70px", "24px", "var(--radius-full)")}
            </div>
            ${FieldListSkeleton(4)}
        </div>
    `;

}

function SubscriptionEmptyState() {

    return CardShell({
        className: "iop-card--subscription",
        accentClass: "iop-card--subscription",
        ariaId: "iopSubscriptionHeading",
        iconKey: "subscription",
        title: "Subscription Summary",
        bodyHtml: EmptyCard(
            "subscription",
            "No subscription plan found.",
            "Plan, billing cycle, and status will appear here once a subscription is set up."
        )
    });

}

/* ==========================================================
   Section 8 — Profile Completion
========================================================== */

function CompletionCard(completion) {

    const body = /* html */ `

        <div class="iop-completion-top">

            <span class="iop-completion-percent">${completion.percentage}%</span>

            <span class="iop-field-label">
                ${completion.completedFields.length} of ${completion.totalFields} fields complete
            </span>

        </div>

        <div class="iop-completion-progress" role="progressbar" aria-valuenow="${completion.percentage}" aria-valuemin="0" aria-valuemax="100" aria-label="Profile completion">
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
        title: "Profile Completion",
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
   Section 9 — Verification Status
   ----------------------------------------------------------
   Always renders "Not Verified" with the honest reason —
   fetchVerificationStatus() never resolves a fabricated
   verified state (see that function's own doc comment).
========================================================== */

function VerificationCard(verification) {

    const body = /* html */ `

        <div class="iop-verify-status">

            <div class="iop-verify-status-icon" aria-hidden="true">
                ${ClockIcon()}
            </div>

            <div>
                <p class="iop-verify-status-label">${escapeHtml(verification.label)}</p>
                <p class="iop-verify-status-reason">${escapeHtml(verification.reason)}</p>
            </div>

        </div>

    `;

    return CardShell({
        className: "iop-card--verification",
        accentClass: "iop-card--verification",
        ariaId: "iopVerificationHeading",
        iconKey: "verification",
        title: "Verification Status",
        badge: Badge({ text: verification.label, variant: "warning" }),
        bodyHtml: body
    });

}

function VerificationSkeleton() {

    return /* html */ `
        <div class="co-card iop-card iop-card--verification iop-verification-skeleton" aria-hidden="true">
            <div class="iop-card-header">
                ${BaseSkeleton.circle(40)}
                ${BaseSkeleton.rounded("160px", "20px")}
            </div>
            ${BaseSkeleton.rounded("100%", "64px", "var(--radius-md)")}
        </div>
    `;

}

/* ==========================================================
   Page Shell
========================================================== */


/* ==========================================================
   Page Assembly
========================================================== */

function InstitutionProfilePage() {

    return /* html */ `

        <div class="iop-profile">

            <div id="iopHeaderWrap" aria-busy="true">
                ${HeaderSkeleton()}
            </div>

            <section class="iop-section-grid">

                <div id="iopIdentityWrap" aria-busy="true">
                    ${IdentitySkeleton()}
                </div>

                <div id="iopContactWrap" aria-busy="true">
                    ${ContactSkeleton()}
                </div>

                <div id="iopDescriptionWrap" aria-busy="true">
                    ${DescriptionSkeleton()}
                </div>

                <div id="iopAddressWrap" aria-busy="true">
                    ${AddressSkeleton()}
                </div>

                <div id="iopBrandingWrap" aria-busy="true">
                    ${BrandingSkeleton()}
                </div>

                <div id="iopSubscriptionWrap" aria-busy="true">
                    ${SubscriptionSkeleton()}
                </div>

                <div id="iopCompletionWrap" aria-busy="true">
                    ${CompletionSkeleton()}
                </div>

                <div id="iopVerificationWrap" aria-busy="true">
                    ${VerificationSkeleton()}
                </div>

            </section>

        </div>

    `;

}

/* ==========================================================
   Loaders
========================================================== */

async function loadHeader(workspace) {

    const wrap = workspace.querySelector("#iopHeaderWrap");
    if (!wrap) return;

    try {

        const [identity, branding] = await Promise.all([
            fetchIdentitySection(),
            fetchBrandingSection()
        ]);

        if (!document.body.contains(wrap)) return;

        const skeletonEl = wrap.querySelector(".iop-header-skeleton");
        await Animation.fadeOut(skeletonEl, { hideOnFinish: false });

        wrap.innerHTML = HeaderCard(identity, branding);
        wrap.removeAttribute("aria-busy");

        await Animation.fadeIn(wrap.querySelector(".iop-header-card"));

    } catch (error) {

        console.error("[CampusOne] Institution Profile Header Error:", error);

        wrap.innerHTML = HeaderErrorState();
        wrap.removeAttribute("aria-busy");

    }

}

async function loadIdentity(workspace) {

    const wrap = workspace.querySelector("#iopIdentityWrap");
    if (!wrap) return;

    try {

        const identity = await fetchIdentitySection();

        if (!document.body.contains(wrap)) return;

        const skeletonEl = wrap.querySelector(".iop-identity-skeleton");
        await Animation.fadeOut(skeletonEl, { hideOnFinish: false });

        wrap.innerHTML = IdentityCard(identity, isEditing);
        wrap.removeAttribute("aria-busy");

        if (isEditing) {
            prefillIdentityInputs(wrap, identity);
        }

        await Animation.fadeIn(wrap.querySelector(".iop-card"));

    } catch (error) {

        console.error("[CampusOne] Institution Identity Error:", error);

        wrap.innerHTML = ErrorCard("Institution Identity");
        wrap.removeAttribute("aria-busy");

    }

}

/**
 * Reuses the same fetchIdentitySection() call loadIdentity() above
 * already makes (session-cached, no extra Firestore read) — this
 * card just renders a different slice of the same payload. Also
 * captures `originalDescription`, the baseline handleSaveClick()
 * diffs the edited textarea against so a Description-only Save
 * only fires when the Owner actually changed it (see "Save Flow —
 * Description" below).
 */
async function loadDescription(workspace) {

    const wrap = workspace.querySelector("#iopDescriptionWrap");
    if (!wrap) return;

    try {

        const identity = await fetchIdentitySection();

        if (!document.body.contains(wrap)) return;

        originalDescription = identity.description || "";

        const skeletonEl = wrap.querySelector(".iop-description-skeleton");
        await Animation.fadeOut(skeletonEl, { hideOnFinish: false });

        wrap.innerHTML = DescriptionCard(identity, isEditing);
        wrap.removeAttribute("aria-busy");

        await Animation.fadeIn(wrap.querySelector(".iop-card"));

    } catch (error) {

        console.error("[CampusOne] Institution Description Error:", error);

        wrap.innerHTML = ErrorCard("Institution Description");
        wrap.removeAttribute("aria-busy");

    }

}

async function loadContact(workspace) {

    const wrap = workspace.querySelector("#iopContactWrap");
    if (!wrap) return;

    try {

        const contact = await fetchContactSection();

        if (!document.body.contains(wrap)) return;

        const skeletonEl = wrap.querySelector(".iop-contact-skeleton");
        await Animation.fadeOut(skeletonEl, { hideOnFinish: false });

        wrap.innerHTML = ContactCard(contact, isEditing);
        wrap.removeAttribute("aria-busy");

        if (isEditing) {
            prefillContactInputs(wrap, contact);
        }

        await Animation.fadeIn(wrap.querySelector(".iop-card"));

    } catch (error) {

        console.error("[CampusOne] Contact Information Error:", error);

        wrap.innerHTML = ErrorCard("Contact Information");
        wrap.removeAttribute("aria-busy");

    }

}

async function loadAddress(workspace) {

    const wrap = workspace.querySelector("#iopAddressWrap");
    if (!wrap) return;

    try {

        const address = await fetchAddressSection();

        if (!document.body.contains(wrap)) return;

        const skeletonEl = wrap.querySelector(".iop-address-skeleton");
        await Animation.fadeOut(skeletonEl, { hideOnFinish: false });

        wrap.innerHTML = AddressCard(address);
        wrap.removeAttribute("aria-busy");

        await Animation.fadeIn(wrap.querySelector(".iop-card"));

    } catch (error) {

        console.error("[CampusOne] Address Error:", error);

        wrap.innerHTML = ErrorCard("Address");
        wrap.removeAttribute("aria-busy");

    }

}

async function loadBranding(workspace) {

    const wrap = workspace.querySelector("#iopBrandingWrap");
    if (!wrap) return;

    try {

        const branding = await fetchBrandingSection();

        if (!document.body.contains(wrap)) return;

        currentBrandingSnapshot = branding;

        const skeletonEl = wrap.querySelector(".iop-branding-skeleton");
        await Animation.fadeOut(skeletonEl, { hideOnFinish: false });

        wrap.innerHTML = BrandingCard(branding, isEditing);
        wrap.removeAttribute("aria-busy");

        await Animation.fadeIn(wrap.querySelector(".iop-card"));

    } catch (error) {

        console.error("[CampusOne] Branding Error:", error);

        wrap.innerHTML = ErrorCard("Branding");
        wrap.removeAttribute("aria-busy");

    }

}

async function loadSubscription(workspace) {

    const wrap = workspace.querySelector("#iopSubscriptionWrap");
    if (!wrap) return;

    try {

        const subscription = await fetchSubscriptionSection();

        if (!document.body.contains(wrap)) return;

        const skeletonEl = wrap.querySelector(".iop-subscription-skeleton");
        await Animation.fadeOut(skeletonEl, { hideOnFinish: false });

        const hasPlan = Boolean(subscription.plan || subscription.status);

        wrap.innerHTML = hasPlan
            ? SubscriptionCard(subscription)
            : SubscriptionEmptyState();

        wrap.removeAttribute("aria-busy");

        await Animation.fadeIn(wrap.querySelector(".iop-card"));

    } catch (error) {

        console.error("[CampusOne] Subscription Summary Error:", error);

        wrap.innerHTML = ErrorCard("Subscription Summary");
        wrap.removeAttribute("aria-busy");

    }

}

async function loadCompletion(workspace) {

    const wrap = workspace.querySelector("#iopCompletionWrap");
    if (!wrap) return;

    try {

        const completion = await fetchProfileCompletion();

        if (!document.body.contains(wrap)) return;

        const skeletonEl = wrap.querySelector(".iop-completion-skeleton");
        await Animation.fadeOut(skeletonEl, { hideOnFinish: false });

        wrap.innerHTML = CompletionCard(completion);
        wrap.removeAttribute("aria-busy");

        await Animation.fadeIn(wrap.querySelector(".iop-card"));

    } catch (error) {

        console.error("[CampusOne] Profile Completion Error:", error);

        wrap.innerHTML = ErrorCard("Profile Completion");
        wrap.removeAttribute("aria-busy");

    }

}

async function loadVerification(workspace) {

    const wrap = workspace.querySelector("#iopVerificationWrap");
    if (!wrap) return;

    try {

        const verification = await fetchVerificationStatus();

        if (!document.body.contains(wrap)) return;

        const skeletonEl = wrap.querySelector(".iop-verification-skeleton");
        await Animation.fadeOut(skeletonEl, { hideOnFinish: false });

        wrap.innerHTML = VerificationCard(verification);
        wrap.removeAttribute("aria-busy");

        await Animation.fadeIn(wrap.querySelector(".iop-card"));

    } catch (error) {

        console.error("[CampusOne] Verification Status Error:", error);

        wrap.innerHTML = ErrorCard("Verification Status");
        wrap.removeAttribute("aria-busy");

    }

}

function loadAllSections(workspace) {

    return Promise.all([
        loadHeader(workspace),
        loadIdentity(workspace),
        loadDescription(workspace),
        loadContact(workspace),
        loadAddress(workspace),
        loadBranding(workspace),
        loadSubscription(workspace),
        loadCompletion(workspace),
        loadVerification(workspace)
    ]);

}

/* ==========================================================
   Header Actions — Refresh / Edit / Cancel
   ----------------------------------------------------------
   Same contract as the original file: isEditing is a page-local
   UI mode only. Save stays disabled (Phase C wires the write).
   Cancel re-runs loadAllSections() since nothing is ever written
   yet, so re-fetching IS "restore the original values".
========================================================== */

function bindHeaderActions(workspace) {

    workspace.addEventListener("click", handleHeaderActionClick);
    workspace.addEventListener("input", handleWorkspaceInput);
    workspace.addEventListener("change", handleWorkspaceChange);
    workspace.addEventListener("keydown", handleWorkspaceKeydown);

}

function unbindHeaderActions(workspace) {

    workspace.removeEventListener("click", handleHeaderActionClick);
    workspace.removeEventListener("input", handleWorkspaceInput);
    workspace.removeEventListener("change", handleWorkspaceChange);
    workspace.removeEventListener("keydown", handleWorkspaceKeydown);

}

let refreshWorkspaceRef = null;
let isEditing = false;
let originalDescription = "";

function handleHeaderActionClick(event) {

    if (!refreshWorkspaceRef) {
        return;
    }

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

    // Institution Logo (Phase 4.3) — Upload/Change trigger the
    // hidden file input; Remove clears the pending selection/saved
    // logo. Both re-render just #iopLogoSlot, not the whole card.
    if (event.target.closest(".iop-logo-trigger")) {
        openLogoFilePicker(refreshWorkspaceRef);
        return;
    }

    if (event.target.closest("#iopLogoRemoveBtn")) {
        handleLogoRemoveClick(refreshWorkspaceRef);
        return;
    }

    // Cover Image / Favicon (and the read-only Logo tile) — these
    // don't have an upload path yet at all, so tapping the tile
    // just explains why via the same toast Logo's disabled
    // controls above use.
    if (event.target.closest(".iop-branding-upload-trigger")) {
        showUploadUnavailableToast();
        return;
    }

}

/** Live Institution Description character counter (Phase 4.3) —
 *  a direct DOM patch, not a re-render, so typing never loses
 *  cursor position. */
function handleWorkspaceInput(event) {

    if (event.target.id === "iopDescriptionTextarea") {
        updateDescriptionCounter(event.target);
    }

}

/** Institution Logo file picker (Phase 4.3). The input is reset
 *  after every selection so re-picking the same file still fires
 *  a fresh change event. */
function handleWorkspaceChange(event) {

    if (event.target.id === "iopLogoFileInput") {

        const file = event.target.files && event.target.files[0];

        handleLogoFileSelected(refreshWorkspaceRef, file);

        event.target.value = "";

    }

}

/** Keyboard activation for the Logo placeholder tile, which isn't
 *  a native <button> (it wraps the empty-state preview so the
 *  whole tile is clickable) — real <button> triggers already get
 *  Enter/Space for free and are skipped here to avoid a double
 *  trigger. */
function handleWorkspaceKeydown(event) {

    if (event.key !== "Enter" && event.key !== " ") return;

    const brandingTrigger = event.target.closest(".iop-branding-upload-trigger");

    if (brandingTrigger) {
        event.preventDefault();
        showUploadUnavailableToast();
        return;
    }

    const trigger = event.target.closest(".iop-logo-trigger");
    if (!trigger || trigger.tagName === "BUTTON") return;

    event.preventDefault();
    openLogoFilePicker(refreshWorkspaceRef);

}

/**
 * Default state must stay read-only — this is the only place
 * isEditing is ever set to true, and it only runs on an explicit
 * Edit click.
 */
function enterEditMode(workspace) {

    if (isEditing) return;

    isEditing = true;
    resetLogoState();

    applyEditingUI(workspace);

    // Institution Identity, Institution Description, Contact
    // Information, and the Branding card's Logo tile have editable
    // fields today — re-render just those sections rather than
    // loadAllSections(), so Address/Subscription/Verification never
    // re-fetch or re-render on Edit click.
    loadContact(workspace);
    loadIdentity(workspace);
    loadDescription(workspace);
    loadBranding(workspace);

}

/**
 * Exits edit mode and restores the original values by re-running
 * the same fetch*Section() calls the page loaded with. Also
 * discards any unsaved Logo selection/removal — Cancel (and the
 * post-Save cleanup that also calls this) should never leave a
 * stale pending file behind for the next edit session.
 */
function exitEditMode(workspace) {

    if (!isEditing) return;

    isEditing = false;
    resetLogoState();

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
    const saveBtn = workspace.querySelector("#iopSaveBtn");

    if (editWrap) editWrap.hidden = isEditing;
    if (saveWrap) saveWrap.hidden = !isEditing;
    if (cancelWrap) cancelWrap.hidden = !isEditing;
    if (editBtn) editBtn.setAttribute("aria-pressed", String(isEditing));

    // Save is markup-disabled by default (Phase A/B); enable it
    // the moment edit mode starts, disable it again on exit so it
    // can never be clicked outside edit mode.
    if (saveBtn) saveBtn.disabled = !isEditing;

}

/* ==========================================================
   Header Actions — Save (Phase C)
   ----------------------------------------------------------
   Only Institution Identity ("profile") and Contact Information
   ("contact") render editable inputs (see enterEditMode() above),
   so Save collects both, validates both, and writes both through
   the existing updateInstitutionProfile(sectionKey, partialData)
   — no new write function, no new Firestore access, same
   architecture Phase 4.0B already established. A validation
   failure blocks the write entirely (nothing is sent to
   updateInstitutionProfile() for either section) so a bad edit in
   one card never partially saves the other.
========================================================== */

function collectIdentityPartial(wrap) {

    if (!wrap) return null;

    const nameInput = wrap.querySelector("#iopIdentityNameInput");
    const typeSelect = wrap.querySelector("#iopIdentityTypeSelect");
    const establishedYearInput = wrap.querySelector("#iopIdentityEstablishedYearInput");
    const affiliationInput = wrap.querySelector("#iopIdentityAffiliationInput");

    // Inputs only exist in edit-mode markup — if none of them are
    // present, Identity isn't part of this Save (defensive, not
    // expected today since enterEditMode() always renders both).
    if (!nameInput && !typeSelect && !establishedYearInput && !affiliationInput) return null;

    return {
        name: nameInput ? nameInput.value.trim() : "",
        type: typeSelect ? typeSelect.value.trim() : "",
        establishedYear: establishedYearInput ? establishedYearInput.value.trim() : "",
        affiliation: affiliationInput ? affiliationInput.value.trim() : ""
    };

}

/**
 * Format-level validation only — mirrors the constraints already
 * implied by each input's own `type`/`options` (number, fixed
 * Select list). Does not add any new business rule: `code` isn't
 * touched here at all (it's never rendered as an input), so the
 * codeEditable business rule stays exactly where
 * profile.controller.js already enforces it.
 */
function validateIdentityPartial(partial) {

    if (!partial) return null;

    if (!partial.name) {
        return "Institution name is required.";
    }

    if (partial.establishedYear) {

        const year = Number(partial.establishedYear);

        if (!Number.isInteger(year) || year < 1000 || year > new Date().getFullYear()) {
            return "Established Year must be a valid year.";
        }

    }

    if (partial.type && !INSTITUTION_TYPE_OPTIONS.some((option) => option.value === partial.type)) {
        return "Please select a valid Institution Type.";
    }

    return null;

}

/**
 * Converts the collected (string) form values into the shape
 * updateInstitutionProfile()'s merge expects, dropping empty
 * optional fields back to null rather than writing "".
 */
function toIdentityPayload(partial) {

    return {
        name: partial.name,
        type: partial.type || null,
        establishedYear: partial.establishedYear ? Number(partial.establishedYear) : null,
        affiliation: partial.affiliation || null
    };

}

function collectContactPartial(wrap) {

    if (!wrap) return null;

    const emailInput = wrap.querySelector("#iopContactEmailInput");
    const mobileInput = wrap.querySelector("#iopContactMobileInput");
    const websiteInput = wrap.querySelector("#iopContactWebsiteInput");

    if (!emailInput && !mobileInput && !websiteInput) return null;

    return {
        email: emailInput ? emailInput.value.trim() : "",
        mobile: mobileInput ? mobileInput.value.trim() : "",
        website: websiteInput ? websiteInput.value.trim() : ""
    };

}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateContactPartial(partial) {

    if (!partial) return null;

    if (partial.email && !EMAIL_PATTERN.test(partial.email)) {
        return "Please enter a valid email address.";
    }

    if (partial.website) {

        try {
            new URL(partial.website);
        } catch {
            return "Please enter a valid website URL (e.g. https://example.com).";
        }

    }

    return null;

}

function toContactPayload(partial) {

    return {
        email: partial.email || null,
        mobile: partial.mobile || null,
        website: partial.website || null
    };

}

let isSaving = false;

/**
 * Commits any pending Logo change (an already-WebP-converted blob
 * to upload, or a pending removal) to Firebase Storage, then writes
 * the resulting URL through the same updateInstitutionProfile()
 * write path every other section uses. No-op if the Owner never
 * touched the Logo widget this edit session. Storage path is fixed
 * per institution — every (re)upload overwrites the one object, so
 * there's never anything to clean up from a previous logo.
 */
async function commitPendingLogoChange(workspace) {

    if (!logoState.file && !logoState.removed) return;

    // Belt-and-suspenders: the UI already blocks picking/removing a
    // logo while uploads are disabled (see openLogoFilePicker() /
    // handleLogoRemoveClick()), so logoState.file/removed should
    // never be set here in that state — but if it ever is, fail the
    // same way branding-upload.service.js's own guard would, rather
    // than writing branding.logoUrl from nothing.
    if (!BRANDING_UPLOADS_ENABLED) {
        throw new Error(BRANDING_UPLOAD_UNAVAILABLE_MESSAGE);
    }

    const institutionId = getCurrentInstitutionId();

    if (!institutionId) {
        throw new Error("No institution in the current session — cannot update the logo.");
    }

    const logoStoragePath = `institution-logos/${institutionId}/logo.webp`;

    let nextLogoUrl = null;

    if (logoState.file) {

        nextLogoUrl = await uploadBrandingImage(logoStoragePath, logoState.file, {
            onProgress: (percent) => updateLogoProgressUI(workspace, percent)
        });

    } else if (logoState.removed) {

        await deleteBrandingImage(logoStoragePath);

    }

    await updateInstitutionProfile("branding", { logoUrl: nextLogoUrl });

}

async function handleSaveClick(workspace) {

    if (!workspace || !isEditing || isSaving) {
        return;
    }

    const identityWrap = workspace.querySelector("#iopIdentityWrap");
    const contactWrap = workspace.querySelector("#iopContactWrap");
    const descriptionWrap = workspace.querySelector("#iopDescriptionWrap");
    const saveBtn = workspace.querySelector("#iopSaveBtn");

    const identityPartial = collectIdentityPartial(identityWrap);
    const contactPartial = collectContactPartial(contactWrap);
    const descriptionPartial = collectDescriptionPartial(descriptionWrap);

    // Bug fix (kept from the original save pipeline): if every
    // partial comes back null (e.g. a render race, or the edit-mode
    // inputs weren't in the DOM yet) AND the Owner never touched the
    // Logo widget, there is genuinely nothing to save — treat that
    // as an explicit failure instead of silently showing "saved".
    if (!identityPartial && !contactPartial && descriptionPartial === null && !logoState.file && !logoState.removed) {

        showToast({
            type: "error",
            title: "Save Failed",
            message: "Nothing to save — please try again."
        });

        return;

    }

    const identityError = validateIdentityPartial(identityPartial);
    const contactError = validateContactPartial(contactPartial);
    const descriptionError = validateDescriptionPartial(descriptionPartial);

    // A validation failure blocks the write entirely — nothing is
    // sent to updateInstitutionProfile() for any section — so a bad
    // edit in one card never partially saves the others.
    if (identityError) {
        showToast({ type: "error", title: "Institution Identity", message: identityError });
        return;
    }

    if (contactError) {
        showToast({ type: "error", title: "Contact Information", message: contactError });
        return;
    }

    if (descriptionError) {
        showToast({ type: "error", title: "Institution Description", message: descriptionError });
        return;
    }

    isSaving = true;
    if (saveBtn) saveBtn.disabled = true;

    try {

        if (identityPartial) {
            await updateInstitutionProfile("profile", toIdentityPayload(identityPartial));
        }

        // A separate, conditional call — only fired when the
        // Description text actually changed from what the page
        // loaded with. Keeping it out of the Identity payload above
        // means its own activity log entry carries
        // metadata.fields === ["description"], which
        // dashboard.controller.js's describeActivity() turns into a
        // dedicated "Description updated" entry instead of a
        // generic "Profile updated" one — and it keeps that entry
        // from firing on every Save regardless of whether
        // Description was touched.
        if (descriptionPartial !== null && descriptionPartial !== originalDescription) {
            await updateInstitutionProfile("profile", { description: descriptionPartial });
        }

        if (contactPartial) {
            await updateInstitutionProfile("contact", toContactPayload(contactPartial));
        }

        // Institution Logo — only touches Storage/Firestore if the
        // Owner actually interacted with the upload widget this
        // edit session (see commitPendingLogoChange()'s own header).
        await commitPendingLogoChange(workspace);

        showToast({
            type: "success",
            title: "Institution Profile",
            message: "Changes saved successfully."
        });

        isSaving = false;

        // Exit edit mode and refresh — same exitEditMode() the
        // Cancel button already uses, so the just-saved sections
        // render from a fresh fetch rather than stale local state.
        exitEditMode(workspace);

    } catch (error) {

        console.error("[CampusOne] Institution Profile Save Error:", error);

        showToast({
            type: "error",
            title: "Save Failed",
            message: error?.message || "Something went wrong while saving. Please try again."
        });

        isSaving = false;
        if (saveBtn) saveBtn.disabled = false;

    }

}

/* ==========================================================
   Render / Destroy
========================================================== */

export async function render(workspace) {

    if (!workspace) {

        console.error(
            "[CampusOne] Institution Profile workspace not found."
        );

        return destroyInstitutionProfilePage;

    }

    workspace.innerHTML = InstitutionProfilePage();

    const contentEl = workspace.querySelector(".iop-profile");
    if (contentEl) {
        Animation.fadeIn(contentEl);
    }

    // Default state must remain read-only on every mount.
    isEditing = false;
    resetLogoState();

    refreshWorkspaceRef = workspace;
    bindHeaderActions(workspace);

    await loadAllSections(workspace);

    return destroyInstitutionProfilePage;

}

function destroyInstitutionProfilePage() {

    if (refreshWorkspaceRef) {
        unbindHeaderActions(refreshWorkspaceRef);
        refreshWorkspaceRef = null;
    }

    isEditing = false;
    isSaving = false;
    resetLogoState();

    destroyInstitutionProfile();

}
