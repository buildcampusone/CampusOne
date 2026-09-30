import {

    validateInstitutionInfoStep,

    validateOfficialEmail,

    validateOfficialMobile,

    validateMobileOtp,

    validateContactInfoStep,

    validateAddressStep,

    validateOwnerAccountStep,

    validateSubscriptionStep,

    validateAgreementStep

} from "./registration.validation.js";

import { generateInstitutionCode } from "./institutionCode.util.js";

// Show/Hide ("eye") icons for the Password and Confirm Password
// fields on Step 4. Same icon set already used by login.js and
// register.js — reused here so all three auth flows look and
// behave identically.
import { EyeIcon, EyeOffIcon } from "../../../shared/components/icons/index.js";

// NOTE: PDF generation (pdf-lib via CDN) is only needed on Step 8's
// "Download Confirmation PDF" button. These used to be static imports
// at the top of the file, which meant a slow/blocked/failed CDN fetch
// for pdf-lib would break the ENTIRE module load — including Step 1's
// institution code auto-generation, which has nothing to do with PDFs.
// Loading them dynamically, only when the download button is actually
// clicked, decouples Step 1-7 from this dependency entirely.

import { PLAN_CONFIG } from "./config/plans.js";
import { PRICING } from "./config/pricing.js";
import { ACCESS_CONTROL } from "./config/accessControl.js";

import {
    createAuthAccount,
    sendVerificationEmail
} from "../../../shared/services/auth.service.js";

import {
    createInstitution,
    generateInstitutionId,
    claimInstitutionCode,
    releaseInstitutionCode
} from "../../../shared/services/institution.service.js";

import {
    createUser
} from "../../../shared/services/user.service.js";

import {
    logActivity
} from "../../../shared/services/activity.service.js";

import {
    ACTIVITY_TYPES
} from "../../../shared/constants/activity-types.js";

import {
    uploadFileWithTimeout
} from "../../../shared/services/storage.service.js";

import { ROLES } from "../../../shared/constants/roles.js";
import { USER_STATUS } from "../../../shared/constants/status.js";

/* =========================================
   Error Helpers
   (same convention as login.js / register.js)
========================================= */

function clearErrors() {

    document
        .querySelectorAll(".error-message")
        .forEach((error) => {

            error.textContent = "";

            error.classList.remove("show");

        });

}

function showError(id, message) {

    const error =
        document.getElementById(id);

    if (!error) return;

    error.textContent = message;

    error.classList.add("show");

    const input =
        document.getElementById(
            id.replace("Error", "")
        );

    if (input) {

        input.classList.remove("success");

        input.classList.add("error");

        input.focus();

    }

}

function showSuccess(id) {

    const input =
        document.getElementById(id);

    if (!input) return;

    input.classList.remove("error");

    input.classList.add("success");

}

function resetValidation() {

    document
        .querySelectorAll(".input")
        .forEach((input) => {

            input.classList.remove(

                "error",

                "success"

            );

        });

}

/* =========================================
   Step Navigation
   (shared state the later steps will also
   use — kept minimal for now)
========================================= */

const wizardState = {

    currentStep: 1,

    totalSteps: 8,

    emailVerified: false,

    mobileVerified: false,

    latitude: null,

    longitude: null,

    ownerProfilePhotoFile: null,

    institutionLogoFile: null,

    institutionCoverImageFile: null,

    institutionFaviconFile: null,

    selectedModules: [],

    selectedPlan: null,

    billingCycle: "Monthly",

    institutionSize: null

};

// Separate timer handles for email OTP and mobile OTP
// resend cooldowns — these run independently of one
// another since a user might verify email first,
// wait, then verify mobile (or vice versa).
const otpTimers = {

    email: null,

    mobile: null

};

function goToStep(stepNumber) {

    document

        .querySelectorAll(".ri-panel")

        .forEach((panel) => {

            panel.classList.toggle(

                "active",

                Number(panel.dataset.step) === stepNumber

            );

        });

    document

        .querySelectorAll(".ri-step")

        .forEach((step) => {

            const stepNum = Number(step.dataset.step);

            step.classList.toggle(

                "active",

                stepNum === stepNumber

            );

            step.classList.toggle(

                "completed",

                stepNum < stepNumber

            );

        });

    wizardState.currentStep = stepNumber;

    window.scrollTo({ top: 0, behavior: "smooth" });

}

/* =========================================
   Step 1 — Institution Information
========================================= */

function setupStep1() {

    const nameInput =
        document.getElementById("institutionName");

    const codeInput =
        document.getElementById("institutionCode");

    const typeSelect =
        document.getElementById("institutionType");

    const yearInput =
        document.getElementById("establishedYear");

    const nextButton =
        document.getElementById("riNextStep1");

    // Live-generate the institution code as the
    // user types the name. Regenerated on every
    // keystroke for now — final code is locked in
    // once the user proceeds past this step.

    if (nameInput && codeInput) {

        nameInput.addEventListener("input", () => {

            codeInput.value = generateInstitutionCode(

                nameInput.value

            );

        });

    }

    if (!nextButton) return;

    nextButton.addEventListener("click", () => {

        clearErrors();

        resetValidation();

        const institutionName =
            nameInput ? nameInput.value.trim() : "";

        const institutionType =
            typeSelect ? typeSelect.value : "";

        const establishedYear =
            yearInput ? yearInput.value.trim() : "";

        const result = validateInstitutionInfoStep({

            institutionName,

            institutionType,

            establishedYear

        });

        if (!result.valid) {

            showError(

                `${result.field}Error`,

                result.message

            );

            return;

        }

        showSuccess("institutionName");

        showSuccess("institutionType");

        if (establishedYear) {

            showSuccess("establishedYear");

        }

        // Institution code is finalised on leaving
        // Step 1 — later steps and the submit
        // handler will read it via
        // document.getElementById("institutionCode").value

        goToStep(2);

    });

}

/* =========================================
   Step 2 — Contact Information
   (Official Email OTP + Official Mobile OTP)
========================================= */

// Generic resend-timer helper. Works for both the
// email OTP flow and the mobile OTP flow — pass in
// which one ("email" | "mobile") plus the relevant
// button/label element ids.
function startResendTimer(kind, resendButtonId, timerLabelId) {

    const resendButton =
        document.getElementById(resendButtonId);

    const timerLabel =
        document.getElementById(timerLabelId);

    if (!resendButton || !timerLabel) return;

    let secondsLeft = 30;

    resendButton.disabled = true;

    timerLabel.textContent = secondsLeft;

    clearInterval(otpTimers[kind]);

    otpTimers[kind] = setInterval(() => {

        secondsLeft -= 1;

        timerLabel.textContent = secondsLeft;

        if (secondsLeft <= 0) {

            clearInterval(otpTimers[kind]);

            resendButton.disabled = false;

            resendButton.textContent = "Resend OTP";

        }

    }, 1000);

}

function setupStep2() {

    // Inputs
    const emailInput =
        document.getElementById("officialEmail");

    const mobileInput =
        document.getElementById("officialMobile");

    const websiteInput =
        document.getElementById("institutionWebsite");

    const alternateContactInput =
        document.getElementById("alternateContact");

    // Email Verification
    const verifyEmailButton =
        document.getElementById("verifyEmail");

    const emailOtpPanel =
        document.getElementById("emailOtpPanel");

    const emailOtpInput =
        document.getElementById("emailOtp");

    const verifyEmailOtpButton =
        document.getElementById("verifyEmailOtp");

    const resendEmailOtpButton =
        document.getElementById("resendEmailOtp");

    const emailVerifiedBadge =
        document.getElementById("emailVerifiedBadge");

    // Mobile Verification
    const verifyMobileButton =
        document.getElementById("verifyMobile");

    const mobileOtpPanel =
        document.getElementById("mobileOtpPanel");

    const mobileOtpInput =
        document.getElementById("mobileOtp");

    const verifyMobileOtpButton =
        document.getElementById("verifyMobileOtp");

    const resendMobileOtpButton =
        document.getElementById("resendMobileOtp");

    const mobileVerifiedBadge =
        document.getElementById("mobileVerifiedBadge");

    // Navigation
    const backButton =
        document.getElementById("riBackStep2");

    const nextButton =
        document.getElementById("riNextStep2");

    /* ===========================
       Email — Step 1: send OTP
       (validates format, reveals
       the OTP field). Actual SMTP/
       email OTP dispatch is wired
       in the Firebase integration
       pass.
    =========================== */

    if (verifyEmailButton) {

        verifyEmailButton.addEventListener("click", () => {

            clearErrors();

            const result = validateOfficialEmail(

                emailInput ? emailInput.value.trim() : ""

            );

            if (!result.valid) {

                showError(

                    "officialEmailError",

                    result.message

                );

                return;

            }

            showSuccess("officialEmail");

            if (emailOtpPanel) emailOtpPanel.hidden = false;

            verifyEmailButton.disabled = true;

            startResendTimer(

                "email",

                "resendEmailOtp",

                "riEmailResendTimer"

            );

            // TODO(firebase): trigger real email OTP send here.

        });

    }

    /* ===========================
       Email — Step 2: confirm OTP
    =========================== */

    if (verifyEmailOtpButton) {

        verifyEmailOtpButton.addEventListener("click", () => {

            const otpResult = validateMobileOtp(

                emailOtpInput ? emailOtpInput.value.trim() : ""

            );

            if (!otpResult.valid) {

                showError(

                    "emailOtpError",

                    otpResult.message

                );

                return;

            }

            wizardState.emailVerified = true;

            showSuccess("emailOtp");

            if (emailVerifiedBadge) {

                emailVerifiedBadge.hidden = false;

            }

            if (emailOtpInput) emailOtpInput.disabled = true;

            verifyEmailOtpButton.disabled = true;

            clearInterval(otpTimers.email);

            // TODO(firebase): verify OTP against the
            // Firebase session before trusting it.

        });

    }

    if (resendEmailOtpButton) {

        resendEmailOtpButton.addEventListener("click", () => {

            if (resendEmailOtpButton.disabled) return;

            startResendTimer(

                "email",

                "resendEmailOtp",

                "riEmailResendTimer"

            );

            // TODO(firebase): trigger real email OTP resend here.

        });

    }

    /* ===========================
       Mobile — Step 1: send OTP
    =========================== */

    if (verifyMobileButton) {

        verifyMobileButton.addEventListener("click", () => {

            clearErrors();

            const result = validateOfficialMobile(

                mobileInput ? mobileInput.value.trim() : ""

            );

            if (!result.valid) {

                showError(

                    "officialMobileError",

                    result.message

                );

                return;

            }

            showSuccess("officialMobile");

            if (mobileOtpPanel) mobileOtpPanel.hidden = false;

            verifyMobileButton.disabled = true;

            startResendTimer(

                "mobile",

                "resendMobileOtp",

                "riMobileResendTimer"

            );

            // TODO(firebase): trigger real SMS OTP send here.

        });

    }

    /* ===========================
       Mobile — Step 2: confirm OTP
    =========================== */

    if (verifyMobileOtpButton) {

        verifyMobileOtpButton.addEventListener("click", () => {

            const otpResult = validateMobileOtp(

                mobileOtpInput ? mobileOtpInput.value.trim() : ""

            );

            if (!otpResult.valid) {

                showError(

                    "mobileOtpError",

                    otpResult.message

                );

                return;

            }

            wizardState.mobileVerified = true;

            showSuccess("mobileOtp");

            if (mobileVerifiedBadge) {

                mobileVerifiedBadge.hidden = false;

            }

            if (mobileOtpInput) mobileOtpInput.disabled = true;

            verifyMobileOtpButton.disabled = true;

            clearInterval(otpTimers.mobile);

            // TODO(firebase): verify OTP against the
            // Firebase session before trusting it.

        });

    }

    if (resendMobileOtpButton) {

        resendMobileOtpButton.addEventListener("click", () => {

            if (resendMobileOtpButton.disabled) return;

            startResendTimer(

                "mobile",

                "resendMobileOtp",

                "riMobileResendTimer"

            );

            // TODO(firebase): trigger real SMS OTP resend here.

        });

    }

    if (backButton) {

        backButton.addEventListener("click", () => {

            goToStep(1);

        });

    }

    if (!nextButton) return;

    nextButton.addEventListener("click", () => {

        clearErrors();

        const officialEmail =
            emailInput ? emailInput.value.trim() : "";

        const officialMobile =
            mobileInput ? mobileInput.value.trim() : "";

        const institutionWebsite =
            websiteInput ? websiteInput.value.trim() : "";

        const alternateContact =
            alternateContactInput ? alternateContactInput.value.trim() : "";

        // NOTE: validateContactInfoStep is assumed to accept
        // a single combined "otpVerified" flag (matching the
        // original signature). Both email and mobile OTP must
        // be confirmed before the user can proceed.
        const result = validateContactInfoStep({

            officialEmail,

            officialMobile,

            otpVerified: wizardState.emailVerified && wizardState.mobileVerified,

            institutionWebsite,

            alternateContact

        });

        if (!result.valid) {

            showError(
                `${result.field}Error`,
                result.message
            );

            return;

        }

        if (!wizardState.emailVerified) {

            showError(
                "officialEmailError",
                "Please verify your official email before continuing."
            );

            return;

        }

        if (!wizardState.mobileVerified) {

            showError(
                "officialMobileError",
                "Please verify your official mobile number before continuing."
            );

            return;

        }

        showSuccess("officialEmail");

        showSuccess("officialMobile");

        goToStep(3);

    });

}

/* =========================================
   Step 3 — Address Information
   Static India States / UTs list
   (District & City stay as free-text inputs)
========================================= */

const INDIA_STATES_AND_UTS = [

    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi (NCT)",
    "Jammu and Kashmir",
    "Ladakh",
    "Lakshadweep",
    "Puducherry"

];

// Converts an existing <input> element into a <select>
// element in-place — same id, name, and classes carry
// over, so existing CSS styling and the rest of the
// wizard code (fieldValue, validation, etc.) keep
// working without any HTML changes.
function convertInputToSelect(inputId, optionValues, config = {}) {

    const input = document.getElementById(inputId);

    if (!input) return null;

    const select = document.createElement("select");

    select.id = input.id;

    select.name = input.name || input.id;

    select.className = input.className;

    if (input.required) select.required = true;

    // Prevent Chrome/mobile browsers from auto-filling this
    // dropdown from saved address data. Without this, the
    // browser can silently pre-select a value (e.g. a state
    // from autofill history) and paint its own white/yellow
    // highlight over it, overriding the dark theme.
    select.setAttribute("autocomplete", "off");

    const placeholder = document.createElement("option");

    placeholder.value = "";

    placeholder.textContent = config.placeholder || "Select an option";

    placeholder.disabled = true;

    placeholder.selected = !config.defaultValue;

    select.appendChild(placeholder);

    optionValues.forEach((optionValue) => {

        const option = document.createElement("option");

        option.value = optionValue;

        option.textContent = optionValue;

        select.appendChild(option);

    });

    if (config.defaultValue) {

        select.value = config.defaultValue;

    }

    if (config.disabled) {

        select.disabled = true;

    }

    input.replaceWith(select);

    return select;

}

function setupStep3() {

    // Country — locked to India for now (single option,
    // auto-selected). Swap disabled:false + add more
    // country names to INDIA_STATES_AND_UTS-style array
    // later if multi-country support is ever needed.
    convertInputToSelect(

        "institutionCountry",

        ["India"],

        {

            placeholder: "Select Country",

            defaultValue: "India",

            disabled: true

        }

    );

    // State — full list of India's states & union
    // territories, alphabetically ordered.
    convertInputToSelect(

        "institutionState",

        INDIA_STATES_AND_UTS,

        {

            placeholder: "Select State"

        }

    );

    const countryInput =
        document.getElementById("institutionCountry");

    const stateInput =
        document.getElementById("institutionState");

    const districtInput =
        document.getElementById("institutionDistrict");

    const cityInput =
        document.getElementById("institutionCity");

    const pinCodeInput =
        document.getElementById("institutionPinCode");

    const fullAddressInput =
        document.getElementById("institutionFullAddress");

    const mapLinkInput =
        document.getElementById("institutionMapLink");

    const latitudeInput =
        document.getElementById("institutionLatitude");

    const longitudeInput =
        document.getElementById("institutionLongitude");

    const detectButton =
        document.getElementById("riDetectLocation");

    const geoStatus =
        document.getElementById("riGeoStatus");

    const backButton =
        document.getElementById("riBackStep3");

    const nextButton =
        document.getElementById("riNextStep3");

    // Auto-detect lat/long via the browser Geolocation
    // API. This is best-effort — the user can still
    // move forward without it, since only the typed
    // address fields are required.

    if (detectButton) {

        detectButton.addEventListener("click", () => {

            if (!navigator.geolocation) {

                geoStatus.textContent =
                    "Geolocation not supported on this device.";

                return;

            }

            geoStatus.textContent = "Detecting…";

            detectButton.disabled = true;

            navigator.geolocation.getCurrentPosition(

                (position) => {

                    const { latitude, longitude } =
                        position.coords;

                    wizardState.latitude = latitude;

                    wizardState.longitude = longitude;

                    latitudeInput.value = latitude;

                    longitudeInput.value = longitude;

                    geoStatus.textContent =
                        `Location captured (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;

                    detectButton.disabled = false;

                },

                () => {

                    geoStatus.textContent =
                        "Could not detect location. You can continue without it.";

                    detectButton.disabled = false;

                },

                { timeout: 10000 }

            );

            // TODO(firebase): optionally reverse-geocode
            // lat/long into state/district/city to
            // pre-fill the fields above.

        });

    }

    if (backButton) {

        backButton.addEventListener("click", () => {

            goToStep(2);

        });

    }

    if (!nextButton) return;

    nextButton.addEventListener("click", () => {

        clearErrors();

        const institutionCountry =
            countryInput ? countryInput.value.trim() : "";

        const institutionState =
            stateInput ? stateInput.value.trim() : "";

        const institutionDistrict =
            districtInput ? districtInput.value.trim() : "";

        const institutionCity =
            cityInput ? cityInput.value.trim() : "";

        const institutionPinCode =
            pinCodeInput ? pinCodeInput.value.trim() : "";

        const institutionFullAddress =
            fullAddressInput ? fullAddressInput.value.trim() : "";

        const institutionMapLink =
            mapLinkInput ? mapLinkInput.value.trim() : "";

        const result = validateAddressStep({

            institutionCountry,

            institutionState,

            institutionDistrict,

            institutionCity,

            institutionPinCode,

            institutionFullAddress,

            institutionMapLink

        });

        if (!result.valid) {

            showError(
                `${result.field}Error`,
                result.message
            );

            return;

        }

        showSuccess("institutionCountry");

        showSuccess("institutionState");

        showSuccess("institutionDistrict");

        showSuccess("institutionCity");

        showSuccess("institutionPinCode");

        showSuccess("institutionFullAddress");

        goToStep(4);

    });

}

/* =========================================
   Shared Helpers — File Preview
   (P0 — client-side validation added here so
   an oversized or wrong-type image is rejected
   immediately with a visible message, instead
   of silently being carried all the way to the
   Storage upload step where it would just fail
   or stall — see safeUploadOptionalFile below)
========================================= */

// Kept generous (5 MB) since these are branding /
// profile images, not raw camera photos — this is
// also comfortably inside a mobile network's
// realistic upload window within our upload timeout.
const MAX_IMAGE_FILE_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml"
];

function wireFilePreview(inputId, previewId, onFile, errorId) {

    const input =
        document.getElementById(inputId);

    const preview =
        previewId ? document.getElementById(previewId) : null;

    if (!input) return;

    input.addEventListener("change", () => {

        // Clear any previous validation message for this
        // field every time a new file is chosen.
        if (errorId) {

            const errorEl = document.getElementById(errorId);

            if (errorEl) {

                errorEl.textContent = "";

                errorEl.classList.remove("show");

            }

        }

        const file = input.files && input.files[0];

        if (!file) {

            if (onFile) onFile(null);

            return;

        }

        if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {

            if (errorId) {

                showError(
                    errorId,
                    "Please choose a JPG, PNG, WEBP, GIF, or SVG image."
                );

            }

            // Reset the input so a rejected file is never
            // silently carried through to submission.
            input.value = "";

            if (onFile) onFile(null);

            return;

        }

        if (file.size > MAX_IMAGE_FILE_BYTES) {

            if (errorId) {

                showError(
                    errorId,
                    "That image is too large — please choose a file under 5 MB."
                );

            }

            input.value = "";

            if (onFile) onFile(null);

            return;

        }

        if (onFile) onFile(file);

        if (!preview) return;

        const reader = new FileReader();

        reader.onload = () => {

            preview.src = reader.result;

            preview.hidden = false;

        };

        reader.onerror = () => {

            // Preview generation is cosmetic only — if it fails
            // (corrupt file, browser quirk) the file is still
            // kept and will still be uploaded on submit.
            console.warn(
                `Could not generate a preview for #${inputId}`
            );

        };

        reader.readAsDataURL(file);

    });

}

/* =========================================
   Shared Helpers — Password Strength
========================================= */

function getPasswordStrength(password) {

    if (!password) return { score: 0, label: "" };

    let score = 0;

    if (password.length >= 8) score += 1;

    if (password.length >= 12) score += 1;

    if (/[A-Z]/.test(password)) score += 1;

    if (/\d/.test(password)) score += 1;

    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) return { score, label: "Weak" };

    if (score <= 3) return { score, label: "Fair" };

    if (score <= 4) return { score, label: "Good" };

    return { score, label: "Strong" };

}

/* =========================================
   Shared Helpers — Password Show/Hide Toggle
   (same convention as setupPasswordToggle in
   login.js / register.js — the eye button's
   markup already exists via Input({ rightIcon })
   and components/input/input.css; this just
   wires the click behaviour up)
========================================= */

function setupPasswordToggle(inputId) {

    const input =
        document.getElementById(inputId);

    const button =
        document.querySelector(
            `[data-toggle="${inputId}"]`
        );

    if (!input || !button) return;

    let visible = false;

    button.innerHTML = EyeIcon();

    button.addEventListener("click", () => {

        visible = !visible;

        input.type = visible
            ? "text"
            : "password";

        button.innerHTML = visible
            ? EyeOffIcon()
            : EyeIcon();

        button.setAttribute(
            "aria-pressed",
            String(visible)
        );

    });

}

function wirePasswordStrength() {

    const passwordInput =
        document.getElementById("ownerPassword");

    const bar =
        document.getElementById("riPasswordStrengthBar");

    const label =
        document.getElementById("riPasswordStrengthLabel");

    if (!passwordInput || !bar || !label) return;

    passwordInput.addEventListener("input", () => {

        const { score, label: strengthLabel } =
            getPasswordStrength(passwordInput.value);

        const percent = Math.min(100, (score / 5) * 100);

        bar.style.width = `${percent}%`;

        bar.dataset.strength = strengthLabel.toLowerCase();

        label.textContent = strengthLabel;

    });

}

/* =========================================
   Step 4 — Institution Owner Account
========================================= */

function setupStep4() {

    const fullNameInput =
        document.getElementById("ownerFullName");

    const designationInput =
        document.getElementById("ownerDesignation");

    const emailInput =
        document.getElementById("ownerEmail");

    const mobileInput =
        document.getElementById("ownerMobile");

    const passwordInput =
        document.getElementById("ownerPassword");

    const confirmPasswordInput =
        document.getElementById("ownerConfirmPassword");

    const termsCheckbox =
        document.getElementById("ownerTermsAccepted");

    const backButton =
        document.getElementById("riBackStep4");

    const nextButton =
        document.getElementById("riNextStep4");

    wirePasswordStrength();

    setupPasswordToggle("ownerPassword");

    setupPasswordToggle("ownerConfirmPassword");

    wireFilePreview(

        "ownerProfilePhoto",

        "ownerProfilePhotoPreview",

        (file) => {

            wizardState.ownerProfilePhotoFile = file;

        },

        "ownerProfilePhotoError"

    );

    if (backButton) {

        backButton.addEventListener("click", () => {

            goToStep(3);

        });

    }

    if (!nextButton) return;

    nextButton.addEventListener("click", () => {

        clearErrors();

        const ownerFullName =
            fullNameInput ? fullNameInput.value.trim() : "";

        const ownerDesignation =
            designationInput ? designationInput.value.trim() : "";

        const ownerEmail =
            emailInput ? emailInput.value.trim() : "";

        const ownerMobile =
            mobileInput ? mobileInput.value.trim() : "";

        const ownerPassword =
            passwordInput ? passwordInput.value : "";

        const ownerConfirmPassword =
            confirmPasswordInput ? confirmPasswordInput.value : "";

        const ownerTermsAccepted =
            termsCheckbox ? termsCheckbox.checked : false;

        const result = validateOwnerAccountStep({

            ownerFullName,

            ownerDesignation,

            ownerEmail,

            ownerMobile,

            ownerPassword,

            ownerConfirmPassword,

            ownerTermsAccepted

        });

        if (!result.valid) {

            showError(
                `${result.field}Error`,
                result.message
            );

            return;

        }

        showSuccess("ownerFullName");

        showSuccess("ownerDesignation");

        showSuccess("ownerEmail");

        showSuccess("ownerMobile");

        showSuccess("ownerPassword");

        showSuccess("ownerConfirmPassword");

        goToStep(5);

    });

}

/* =========================================
   Step 5 — Institution Branding
========================================= */

function setupStep5() {

    const primaryColorInput =
        document.getElementById("primaryColor");

    const secondaryColorInput =
        document.getElementById("secondaryColor");

    const previewHeader =
        document.getElementById("riThemePreviewHeader");

    const previewButton =
        document.getElementById("riThemePreviewButton");

    const backButton =
        document.getElementById("riBackStep5");

    const nextButton =
        document.getElementById("riNextStep5");

    function updateThemePreview() {

        if (previewHeader && primaryColorInput) {

            previewHeader.style.backgroundColor =
                primaryColorInput.value;

        }

        if (previewButton && secondaryColorInput) {

            previewButton.style.backgroundColor =
                secondaryColorInput.value;

        }

    }

    if (primaryColorInput) {

        primaryColorInput.addEventListener(
            "input",
            updateThemePreview
        );

    }

    if (secondaryColorInput) {

        secondaryColorInput.addEventListener(
            "input",
            updateThemePreview
        );

    }

    updateThemePreview();

    wireFilePreview(
        "institutionLogo",
        "institutionLogoPreview",
        (file) => { wizardState.institutionLogoFile = file; },
        "institutionLogoError"
    );

    wireFilePreview(
        "institutionCoverImage",
        "institutionCoverImagePreview",
        (file) => { wizardState.institutionCoverImageFile = file; },
        "institutionCoverImageError"
    );

    wireFilePreview(
        "institutionFavicon",
        null,
        (file) => { wizardState.institutionFaviconFile = file; },
        "institutionFaviconError"
    );

    if (backButton) {

        backButton.addEventListener("click", () => {

            goToStep(4);

        });

    }

    if (!nextButton) return;

    // Branding is entirely optional — no validation
    // gate here, just move forward.

    nextButton.addEventListener("click", () => {

        goToStep(6);

    });

}

/* =========================================
   Step 6 — Modules & Plan
========================================= */
function renderPlanCards(container) {

    if (!container) return;

    container.innerHTML = "";

    Object.keys(PLAN_CONFIG).forEach((planKey) => {

        const plan = PLAN_CONFIG[planKey];

        const monthlyPrice = PRICING.monthly[planKey];

        const yearlyPrice = PRICING.yearly[planKey];

        const card = document.createElement("div");

        card.className = "plan-card";

        card.dataset.plan = planKey;

        card.innerHTML = `

            <div class="plan-header">

                <h3 class="plan-name">

                    ${plan.name}

                </h3>

                ${plan.badge ? `
                    <span class="plan-badge">
                        ${plan.badge}
                    </span>
                ` : ""}

            </div>

            <p class="plan-description">

                ${plan.description}

            </p>

            <div class="plan-price">

                ${monthlyPrice ? `₹${monthlyPrice}` : "Custom"}

                <small>/month</small>

            </div>

            <div class="plan-yearly">

                ${yearlyPrice ? `₹${yearlyPrice}/year` : "Contact Sales"}

            </div>

        `;

        container.appendChild(card);

    });

}

function updateIncludedModules() {

    const list =
        document.getElementById("riIncludedModules");

    if (!list) return;

    if (!wizardState.selectedPlan) {

        wizardState.selectedModules = [];

        list.innerHTML = `
            <div class="ri-empty-state">
                Select a subscription plan to view included modules.
            </div>
        `;

        return;

    }

    const modules =
        ACCESS_CONTROL[wizardState.selectedPlan] || [];

    wizardState.selectedModules = modules;

    list.innerHTML = modules
        .map(
            (module) => `
                <div class="module-item">
                    <div class="module-icon">✓</div>
                    <div class="module-content">
                        <p class="module-title">${module}</p>
                        <p class="module-status">Included</p>
                    </div>
                </div>
            `
        )
        .join("");

}

function updateSummary() {

    const plan =
        document.getElementById("summaryPlan");

    const billing =
        document.getElementById("summaryBilling");

    const size =
        document.getElementById("summarySize");

    const status =
        document.getElementById("summaryStatus");

    if (plan) {

        plan.textContent =
            wizardState.selectedPlan
                ? wizardState.selectedPlan
                    .charAt(0)
                    .toUpperCase() +
                  wizardState.selectedPlan.slice(1)
                : "—";

    }

    if (billing) {

        billing.textContent =
            wizardState.billingCycle || "Monthly";

    }

    if (size) {

        size.textContent =
            wizardState.institutionSize || "—";

    }

    if (status) {

        status.textContent =
            "Pending Payment";

    }

}

function setupStep6() {

    const planGrid =
        document.getElementById("riPlanGrid");

    renderPlanCards(planGrid);

    // Event delegation on the container instead of binding
    // listeners to individual cards — renderPlanCards() creates
    // the cards dynamically, so listeners bound before/at render
    // time would miss them (or need to be re-bound every render).
    planGrid?.addEventListener("click", (event) => {

        const card =
            event.target.closest(".plan-card");

        if (!card || !planGrid.contains(card)) return;

        planGrid
            .querySelectorAll(".plan-card")
            .forEach((item) => {

                item.classList.remove("selected");

            });

        card.classList.add("selected");

        wizardState.selectedPlan =
            card.dataset.plan;

        updateIncludedModules();

        updateSummary();

    });

    const billingMonthly =
        document.getElementById("billingMonthly");

    const billingYearly =
        document.getElementById("billingYearly");

    billingMonthly?.addEventListener("click", () => {

        wizardState.billingCycle = "Monthly";

        billingMonthly.classList.add("active");

        billingYearly?.classList.remove("active");

        updateSummary();

    });

    billingYearly?.addEventListener("click", () => {

        wizardState.billingCycle = "Yearly";

        billingYearly.classList.add("active");

        billingMonthly?.classList.remove("active");

        updateSummary();

    });

    const institutionSizeInput =
        document.getElementById("institutionSize");

    institutionSizeInput?.addEventListener("change", () => {

        wizardState.institutionSize =
            institutionSizeInput.value;

        updateSummary();

    });

    const backButton =
        document.getElementById("riBackStep6");

    const nextButton =
        document.getElementById("riNextStep6");

    if (backButton) {

        backButton.addEventListener("click", () => {

            goToStep(5);

        });

    }

    if (!nextButton) return;

    nextButton.addEventListener("click", () => {

        clearErrors();

        const result = validateSubscriptionStep({

            selectedPlan: wizardState.selectedPlan,

            billingCycle: wizardState.billingCycle,

            institutionSize: wizardState.institutionSize,

            selectedModules: wizardState.selectedModules

        });

        if (!result.valid) {

            showError(
                `${result.field}Error`,
                result.message
            );

            return;

        }

        buildReviewSummary();

        goToStep(7);

    });

}

/* =========================================
   Step 7 — Review & Agreement
========================================= */

function fieldValue(id) {

    const el = document.getElementById(id);

    return el ? el.value : "";

}

// Escapes the characters that matter when interpolating
// user-typed form values into an innerHTML template string
// (buildReviewSummary below). Without this, free-text fields
// like Institution Name or Full Address are rendered as raw
// HTML — this is the only place in the review step that
// echoes user input, so the fix is scoped to just that call site.
function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

}

function buildReviewSummary() {

    const reviewList =
        document.getElementById("riReviewList");

    if (!reviewList) return;

    const sections = [

        {

            title: "Institution",

            step: 1,

            rows: [

                ["Name", fieldValue("institutionName")],

                ["Code", fieldValue("institutionCode")],

                ["Type", fieldValue("institutionType")],

                ["Established", fieldValue("establishedYear") || "—"]

            ]

        },

        {

            title: "Contact",

            step: 2,

            rows: [

                ["Email", fieldValue("officialEmail")],

                ["Mobile", fieldValue("officialMobile")],

                ["Website", fieldValue("institutionWebsite") || "—"]

            ]

        },

        {

            title: "Address",

            step: 3,

            rows: [

                ["Country", fieldValue("institutionCountry")],

                ["State", fieldValue("institutionState")],

                ["District", fieldValue("institutionDistrict")],

                ["City", fieldValue("institutionCity")],

                ["PIN Code", fieldValue("institutionPinCode")],

                ["Address", fieldValue("institutionFullAddress")]

            ]

        },

        {

            title: "Institution Owner",

            step: 4,

            rows: [

                ["Name", fieldValue("ownerFullName")],

                ["Designation", fieldValue("ownerDesignation")],

                ["Email", fieldValue("ownerEmail")],

                ["Mobile", fieldValue("ownerMobile")]

            ]

        },

        {

            title: "Subscription & Plan",

            step: 6,

            rows: [

                ["Plan", wizardState.selectedPlan
                    ? wizardState.selectedPlan.charAt(0).toUpperCase() +
                      wizardState.selectedPlan.slice(1)
                    : "—"],

                ["Billing Cycle", wizardState.billingCycle || "Monthly"],

                ["Institution Size", wizardState.institutionSize || "—"],

                ["Modules", wizardState.selectedModules.join(", ") || "—"]

            ]

        }

    ];

    reviewList.innerHTML = sections

        .map(

            (section) => `

                <div class="ri-review-section">

                    <div class="ri-review-section-header">

                        <h3>${section.title}</h3>

                        <button
                            type="button"
                            class="ri-review-edit"
                            data-goto-step="${section.step}"
                        >
                            Edit
                        </button>

                    </div>

                    ${section.rows

                        .map(

                            ([label, value]) => `

                                <div class="ri-review-row">

                                    <span class="ri-review-label">${label}</span>

                                    <span class="ri-review-value">${value ? escapeHtml(value) : "—"}</span>

                                </div>

                            `

                        )

                        .join("")}

                </div>

            `

        )

        .join("");

    reviewList

        .querySelectorAll(".ri-review-edit")

        .forEach((button) => {

            button.addEventListener("click", () => {

                goToStep(Number(button.dataset.gotoStep));

            });

        });

}

// Re-entry guard: prevents submitRegistration() from being triggered
// twice (e.g. a fast double-tap firing the click handler before the
// button's `disabled` state has taken effect, or the Enter key
// re-firing submission). This is checked at the very top of
// attemptRegistrationSubmit() before anything else runs, and the
// full-screen loader overlay also blocks pointer access to the rest
// of the page while a submission is in flight — two independent
// layers against duplicate/racing Firebase requests.
let isSubmittingRegistration = false;

function setupStep7() {

    const agreeTermsCheckbox =
        document.getElementById("agreeTerms");

    const agreePrivacyCheckbox =
        document.getElementById("agreePrivacy");

    const agreeConfirmationCheckbox =
        document.getElementById("agreeConfirmation");

    const backButton =
        document.getElementById("riBackStep7");

    const submitButton =
        document.getElementById("riSubmit");

    const retryButton =
        document.getElementById("riRetrySubmit");

    const errorBox =
        document.getElementById("riSubmitErrorBox");

    const errorMessageEl =
        document.getElementById("riSubmitErrorMessage");

    if (backButton) {

        backButton.addEventListener("click", () => {

            goToStep(6);

        });

    }

    function showSubmitError(message) {

        if (errorMessageEl) errorMessageEl.textContent = message;

        if (errorBox) errorBox.hidden = false;

    }

    function hideSubmitError() {

        if (errorBox) errorBox.hidden = true;

    }

    function setButtonsBusy(isBusy) {

        if (submitButton) {

            submitButton.disabled = isBusy;

            submitButton.textContent =
                isBusy ? "Submitting…" : "Complete Registration";

        }

        if (retryButton) retryButton.disabled = isBusy;

    }

    async function attemptRegistrationSubmit() {

        if (isSubmittingRegistration) return;

        isSubmittingRegistration = true;

        clearErrors();

        hideSubmitError();

        const agreeTerms =
            agreeTermsCheckbox ? agreeTermsCheckbox.checked : false;

        const agreePrivacy =
            agreePrivacyCheckbox ? agreePrivacyCheckbox.checked : false;

        const agreeConfirmation =
            agreeConfirmationCheckbox ? agreeConfirmationCheckbox.checked : false;

        const result = validateAgreementStep({

            agreeTerms,

            agreePrivacy,

            agreeConfirmation

        });

        if (!result.valid) {

            showError(
                `${result.field}Error`,
                result.message
            );

            isSubmittingRegistration = false;

            return;

        }

        setButtonsBusy(true);

        showLoader();

        // Warn (native browser prompt) if the person tries to close
        // the tab or navigate away while a submission is in flight.
        // Registration involves several sequential Firebase calls
        // (Auth, Storage, Firestore) with rollback logic that only
        // runs if this JS keeps executing — leaving mid-flight would
        // risk exactly the "orphaned record" problem this whole
        // flow is designed to avoid.
        const warnBeforeUnload = (event) => {

            event.preventDefault();

            event.returnValue = "";

        };

        window.addEventListener("beforeunload", warnBeforeUnload);

        try {

            const { institutionId, institutionCode } =
                await submitRegistration();

            // Stored here so Step 8 (which is set up once at init
            // time, before this data exists) can read it later when
            // the person clicks a document download button.
            wizardState.institutionId = institutionId;

            wizardState.institutionCode = institutionCode;

            wizardState.registeredAt = new Date();

            const idLabel =
                document.getElementById("riSuccessInstitutionId");

            if (idLabel) {

                idLabel.textContent =
                    `Institution ID: ${institutionCode}`;

            }

            // Brief "done" state so the loader doesn't just vanish
            // abruptly right after the progress bar reaches 100%.
            await new Promise((resolve) => setTimeout(resolve, 350));

            hideLoader();

            goToStep(8);

        } catch (error) {

            console.error("Registration failed:", error);

            hideLoader();

            showSubmitError(
                error.message ||
                "Something went wrong while submitting. Please try again."
            );

            setButtonsBusy(false);

        } finally {

            window.removeEventListener("beforeunload", warnBeforeUnload);

            isSubmittingRegistration = false;

        }

    }

    if (submitButton) {

        submitButton.addEventListener("click", attemptRegistrationSubmit);

    }

    if (retryButton) {

        retryButton.addEventListener("click", attemptRegistrationSubmit);

    }

}

/* =========================================
   Step 8 — Registration Complete
========================================= */

function setupStep8() {

    const dashboardButton =
        document.getElementById("riGoToDashboard");

    const pdfButton =
        document.getElementById("riDownloadPdf");

    if (dashboardButton) {

        dashboardButton.addEventListener("click", () => {

            // TODO(routing): replace with the real
            // dashboard route once it exists.

            window.location.href = "/dashboard";

        });

    }

    if (pdfButton) {

        pdfButton.addEventListener("click", async () => {

            const institutionId =
                wizardState.institutionId || "PENDING-ID";

            // The institution code (human-readable, e.g.
            // "SARLA-BIRLA-4821") is what should appear on
            // documents and in URLs — the Firestore document ID
            // (institutionId) is an internal implementation detail.
            const institutionCode =
                wizardState.institutionCode || institutionId;

            const verificationUrl =
                `https://campusone.app/verify/${institutionCode}`;

            const originalLabel = pdfButton.textContent;

            pdfButton.disabled = true;

            pdfButton.textContent = "Preparing documents…";

            try {

                const [
                    { downloadRegistrationForm },
                    { downloadRegistrationCertificate },
                    { downloadAdminAccountDetails }
                ] = await Promise.all([
                    import("../../../shared/services/pdf/documents/registrationForm.js"),
                    import("../../../shared/services/pdf/documents/registrationCertificate.js"),
                    import("../../../shared/services/pdf/documents/adminAccountDetails.js")
                ]);

                await downloadRegistrationForm({

                    registrationId: institutionCode,

                    registeredAt: wizardState.registeredAt,

                    verificationUrl,

                    ...collectRegistrationPayload()

                });

                await downloadRegistrationCertificate({

                    institutionName: fieldValue("institutionName"),

                    institutionId: institutionCode,

                    registrationDate: wizardState.registeredAt,

                    plan: wizardState.selectedPlan
                        ? wizardState.selectedPlan.charAt(0).toUpperCase() +
                          wizardState.selectedPlan.slice(1)
                        : "—",

                    status: "Pending Payment",

                    verificationUrl

                });

                await downloadAdminAccountDetails({

                    adminName: fieldValue("ownerFullName"),

                    adminEmail: fieldValue("ownerEmail"),

                    adminMobile: fieldValue("ownerMobile"),

                    username: fieldValue("ownerEmail"),

                    institutionId: institutionCode,

                    dashboardUrl: `https://campusone.app/login?inst=${institutionCode}`,

                    // TODO(auth): once Firebase Auth is wired up in
                    // submitRegistration(), replace this with the real
                    // password-reset link it returns (e.g. via
                    // generatePasswordResetLink / a custom email-link flow).
                    // A setup link is safer than a plaintext temp password.
                    passwordSetupLink: `https://campusone.app/set-password?inst=${institutionCode}`

                });

            } catch (error) {

                console.error("Document generation failed:", error);

            } finally {

                pdfButton.disabled = false;

                pdfButton.textContent = originalLabel;

            }

        });

    }

}

/* =========================================
   Final Submission
   (Firestore + Storage integration goes here)
========================================= */

function collectRegistrationPayload() {

    return {

        profile: {

            name: fieldValue("institutionName"),

            code: fieldValue("institutionCode"),

            type: fieldValue("institutionType"),

            establishedYear: fieldValue("establishedYear"),

            affiliation: fieldValue("institutionAffiliation") || null,

            description: fieldValue("institutionDescription") || null

        },

        contact: {

            email: fieldValue("officialEmail"),

            mobile: fieldValue("officialMobile"),

            website: fieldValue("institutionWebsite") || null

        },

        address: {

            country: fieldValue("institutionCountry"),

            state: fieldValue("institutionState"),

            district: fieldValue("institutionDistrict"),

            city: fieldValue("institutionCity"),

            pinCode: fieldValue("institutionPinCode"),

            fullAddress: fieldValue("institutionFullAddress"),

            mapLink: fieldValue("institutionMapLink") || null,

            latitude: wizardState.latitude,

            longitude: wizardState.longitude

        },

        owner: {

            fullName: fieldValue("ownerFullName"),

            designation: fieldValue("ownerDesignation"),

            email: fieldValue("ownerEmail"),

            mobile: fieldValue("ownerMobile")

            // password is handled separately via
            // Firebase Auth, never stored in Firestore

        },

        branding: {

            primaryColor: fieldValue("primaryColor"),

            secondaryColor: fieldValue("secondaryColor")

            // logo/cover/favicon URLs are attached
            // after Storage upload completes

        },

        modules: wizardState.selectedModules,

        subscription: {

            plan: wizardState.selectedPlan,

            billingCycle: wizardState.billingCycle,

            institutionSize: wizardState.institutionSize,

            status: "pending_payment"

        }

    };

}

/* =========================================
   Full-Screen Loader Controls
   (P0 — premium "please wait" experience
   with real progress feedback instead of
   just a disabled button label)
========================================= */

const SUBMIT_STAGES = [
    { key: "account",  percent: 15, label: "Creating your owner account…" },
    { key: "code",     percent: 35, label: "Reserving your institution code…" },
    { key: "files",    percent: 60, label: "Uploading your files…" },
    { key: "finalize", percent: 85, label: "Saving your institution details…" },
    { key: "verify",   percent: 97, label: "Sending verification email…" },
    { key: "done",     percent: 100, label: "All set!" }
];

function showLoader() {

    const overlay = document.getElementById("riLoaderOverlay");

    if (!overlay) return;

    overlay.hidden = false;

    overlay.setAttribute("aria-hidden", "false");

    setLoaderStage("account");

}

function setLoaderStage(stageKey) {

    const stage =
        SUBMIT_STAGES.find((item) => item.key === stageKey);

    if (!stage) return;

    const stageLabel =
        document.getElementById("riLoaderStage");

    const progressBar =
        document.getElementById("riLoaderProgressBar");

    if (stageLabel) stageLabel.textContent = stage.label;

    if (progressBar) progressBar.style.width = `${stage.percent}%`;

}

function hideLoader() {

    const overlay = document.getElementById("riLoaderOverlay");

    if (!overlay) return;

    overlay.hidden = true;

    overlay.setAttribute("aria-hidden", "true");

}

/* =========================================
   Friendly Error Messages
   (P0 — never show raw Firebase errors)
========================================= */

const FRIENDLY_ERROR_MESSAGES = {

    "auth/email-already-in-use":
        "This owner email is already registered. Please use a different email, or contact support if this institution has already signed up.",

    "auth/invalid-email":
        "That owner email address doesn't look valid. Please check it and try again.",

    "auth/weak-password":
        "Please choose a stronger password (at least 8 characters, including a letter and a number).",

    "auth/network-request-failed":
        "We couldn't reach the server. Please check your internet connection and try again.",

    "auth/too-many-requests":
        "Too many attempts. Please wait a moment before trying again.",

    "permission-denied":
        "We weren't able to save your details just now. Please try again in a moment.",

    "unavailable":
        "Our servers are temporarily unavailable. Please try again in a moment.",

    "app/code-taken":
        "This institution code is already in use by another institution. Please go back to Step 1, adjust your institution name slightly, and try again."

};

function toFriendlyError(error) {

    const message =
        FRIENDLY_ERROR_MESSAGES[error?.code] ||
        "Something went wrong while completing your registration. Please try again — no charges or duplicate accounts are created when this happens.";

    const friendly = new Error(message);

    friendly.code = error?.code || "app/unknown";

    friendly.original = error;

    return friendly;

}

/* =========================================
   Watchdog Timeout Helper
   ---------------------------------------------------------------
   ROOT CAUSE of the "stuck on Submitting… even though Firestore
   data is saved" bug:

   A JavaScript `try { await somePromise } catch { ... }` block
   only protects you from a promise that *rejects*. It does NOT
   protect you from a promise that simply never settles at all.
   `uploadBytes`/`getDownloadURL` (Firebase Storage) and
   `sendEmailVerification` (Firebase Auth) are ordinary network
   calls with no built-in client-side timeout — on a slow/flaky
   mobile connection (very common while uploading a multi-MB
   Profile Photo / Logo / Cover / Favicon image) the underlying
   XHR/fetch can simply stall indefinitely: no success, no error,
   forever. When that happens, `await` never returns control, the
   surrounding `try/catch/finally` never runs, `hideLoader()` is
   never called, and `isSubmittingRegistration` is never reset —
   the UI is left parked on "Submitting…" permanently, even though
   the `createInstitution()`/`createUser()` calls immediately before
   it (Stage 4) may already have completed successfully. This is exactly why the
   symptom correlates with image uploads: they are the slowest,
   most network-dependent step in the whole flow, and they are
   immediately followed by another un-timed network call
   (the verification email).

   The permanent fix is to give every such call a hard ceiling by
   racing it against a timer. That converts "hangs forever" into
   "rejects after N seconds", which a normal try/catch CAN handle.
========================================= */

function withTimeout(promise, timeoutMs, label) {

    let timeoutId;

    const timeout = new Promise((_, reject) => {

        timeoutId = setTimeout(() => {

            reject(
                new Error(
                    `Timed out while ${label} (no response after ${Math.round(timeoutMs / 1000)}s). ` +
                    "This usually means a slow or unstable internet connection."
                )
            );

        }, timeoutMs);

    });

    return Promise.race([promise, timeout])
        .finally(() => clearTimeout(timeoutId));

}

// Generous but bounded — large branding images on a slow mobile
// connection can legitimately take a while, but must never be
// allowed to hang the submission forever.
const UPLOAD_TIMEOUT_MS = 25000;

/* =========================================
   Safe / Optional File Upload
   (P0 — an upload failure must NEVER block
   registration; it just falls back to null.
   The actual Storage calls + timeout ceiling
   live in shared/services/storage.service.js
   (uploadFileWithTimeout) — this wrapper just
   decides what happens on failure: swallow it
   and continue with a null URL. See the
   root-cause note above for why the timeout
   ceiling exists at all.)
========================================= */

async function safeUploadOptionalFile(inputId, storagePath) {

    const file =
        document.getElementById(inputId)?.files?.[0];

    if (!file) return null;

    try {

        return await uploadFileWithTimeout(
            storagePath,
            file,
            UPLOAD_TIMEOUT_MS
        );

    } catch (uploadError) {

        // Optional branding/photo uploads must never abort
        // registration — log for diagnostics and continue
        // with a null URL. The user can re-upload later from
        // the dashboard. Because every await above is now
        // time-bounded, this catch block is GUARANTEED to run
        // within UPLOAD_TIMEOUT_MS even on a dead connection.
        console.warn(
            `Optional upload failed for #${inputId} (continuing without it):`,
            uploadError
        );

        return null;

    }

}

/* =========================================
   Final Submission — Reliable Transaction
   (P0 — Auth + Storage + Firestore brought
   together as one reliable flow with proper
   rollback, so a failure never leaves a
   half-registered / orphaned account.)
========================================= */

async function submitRegistration(onStageChange) {

    const notify = (stageKey) => {
        setLoaderStage(stageKey);
        if (onStageChange) onStageChange(stageKey);
    };

    let userCredential = null;
    let codeClaimed = false;

    const institutionCode =
        fieldValue("institutionCode") ||
        generateInstitutionCode(fieldValue("institutionName"));

    const ownerEmail =
        fieldValue("ownerEmail");

    const ownerPassword =
        fieldValue("ownerPassword");

    try {

        // ---- Stage 1: Create the Institution Owner auth account ----
        notify("account");

        userCredential =
            await createAuthAccount(
                ownerEmail,
                ownerPassword
            );

        const uid =
            userCredential.user.uid;

        // ---- Stage 2: Atomically claim the institution code ----
        //
        // generateInstitutionId()/claimInstitutionCode() live in
        // shared/services/institution.service.js. Uniqueness is
        // enforced there with a Firestore transaction against a
        // dedicated `institutionCodes/{code}` claim document,
        // instead of a plain read-then-write on the institution
        // document itself — a transaction fails atomically if two
        // people race for the same code, so there is no window
        // where both can "pass" the check and one silently
        // overwrites the other's data.
        //
        // The institution document itself gets a Firestore
        // auto-generated ID (institutionId) — the human-readable
        // code is stored as a field, not used as the primary key,
        // so a rare code collision can never cause data loss.
        notify("code");

        const institutionId =
            generateInstitutionId();

        await claimInstitutionCode(institutionCode, {
            institutionId,
            claimedBy: uid
        });

        codeClaimed = true;

        // ---- Stage 3: Optional branding / photo uploads ----
        //
        // Every upload here is best-effort and runs in parallel.
        // A failed upload NEVER blocks registration — it simply
        // falls back to a null URL that the user can fill in
        // later from the dashboard.
        notify("files");

        const [
            logoUrl,
            coverUrl,
            faviconUrl,
            ownerPhotoUrl
        ] = await Promise.all([

            safeUploadOptionalFile(
                "institutionLogo",
                `institutions/${institutionId}/logo`
            ),

            safeUploadOptionalFile(
                "institutionCoverImage",
                `institutions/${institutionId}/cover`
            ),

            safeUploadOptionalFile(
                "institutionFavicon",
                `institutions/${institutionId}/favicon`
            ),

            safeUploadOptionalFile(
                "ownerProfilePhoto",
                `institutions/${institutionId}/admin-photo`
            )

        ]);

        // ---- Stage 4: Save institution + user documents ----
        notify("finalize");

        const payload =
            collectRegistrationPayload();

        payload.profile.code = institutionCode;

        payload.branding = payload.branding || {};
        payload.branding.logoUrl = logoUrl || null;
        payload.branding.coverUrl = coverUrl || null;
        payload.branding.faviconUrl = faviconUrl || null;

        payload.owner = payload.owner || {};
        payload.owner.uid = uid;
        payload.owner.photoUrl = ownerPhotoUrl || null;

        await createInstitution(
            institutionId,
            payload
        );

        await createUser(uid, {

            uid,

            institutionId,

            role: ROLES.INSTITUTION_OWNER,

            status: USER_STATUS.ACTIVE,

            fullName: fieldValue("ownerFullName"),

            email: ownerEmail,

            phone: fieldValue("ownerMobile"),

            designation: fieldValue("ownerDesignation"),

            photoURL: ownerPhotoUrl || null

        });

        // ---- Activity Log: institution_created (non-blocking) ----
        //
        // Registration has already fully and successfully saved by
        // this point (createInstitution + createUser both resolved
        // above) — this is Phase 3.5B's write-path integration for
        // the ACTIVITY_TYPES.INSTITUTION_CREATED type. Same pattern
        // as Stage 5's verification email just below: wrapped in
        // its own try/catch so a logging failure can NEVER trigger
        // the rollback path in the outer catch below, and can never
        // undo a registration that already succeeded. Actor comes
        // straight from values already collected/known in this same
        // function (uid from the just-created auth account, name
        // from the form, role is always Institution Owner for this
        // flow) — no extra Firestore read is done just to build it.
        try {

            await logActivity(institutionId, {

                type: ACTIVITY_TYPES.INSTITUTION_CREATED,

                actor: {
                    uid,
                    name: fieldValue("ownerFullName"),
                    role: ROLES.INSTITUTION_OWNER
                },

                metadata: {
                    institutionName: fieldValue("institutionName"),
                    institutionCode
                }

            });

        } catch (activityError) {

            console.warn(
                "Activity logging failed for institution_created (continuing — registration already succeeded):",
                activityError
            );

        }

        // ---- Stage 5: Verification email (non-blocking) ----
        //
        // A failure here should not undo a registration that
        // has already fully and successfully saved — it's
        // wrapped in its own try/catch so it can't trigger the
        // rollback path below.
        //
        // This is also wrapped in withTimeout(): a plain
        // try/catch alone cannot save us if this network call
        // simply never settles (see the root-cause note above
        // safeUploadOptionalFile) — and this is precisely the
        // await that previously could freeze the wizard on
        // "Submitting…" forever *after* the institution and
        // user documents had already been written successfully.
        notify("verify");

        try {

            await withTimeout(
                sendVerificationEmail(userCredential.user),
                12000,
                "sending the verification email"
            );

        } catch (verificationError) {

            console.warn(
                "Verification email failed to send (non-blocking):",
                verificationError
            );

        }

        notify("done");

        return { institutionId, institutionCode };

    } catch (error) {

        console.error("Registration failed, rolling back:", error);

        // Roll back the institution-code claim, if we made one.
        if (codeClaimed) {

            await releaseInstitutionCode(institutionCode);

        }

        // Roll back the freshly created Auth account so the
        // owner email is never left stranded in
        // auth/email-already-in-use limbo with no institution
        // or user record behind it.
        if (userCredential) {

            await userCredential.user.delete().catch(() => {});

        }

        throw toFriendlyError(error);

    }

}

/* =========================================
   Init
========================================= */

export function initRegisterInstitution() {

    // Duplicate-submit protection, layer 3: the wizard has no
    // real "submit" action of its own (every step button is
    // type="button"), but a stray <input> keypress can still
    // trigger the browser's native form submission (e.g. Enter
    // key), which would reload the page and re-run this whole
    // module. Block that unconditionally.
    const form =
        document.getElementById("registerInstitutionForm");

    if (form) {

        form.addEventListener("submit", (event) => {

            event.preventDefault();

        });

    }

    setupStep1();

    setupStep2();

    setupStep3();

    setupStep4();

    setupStep5();

    setupStep6();

    setupStep7();

    setupStep8();

}