import { Background } from "../../../shared/components/background/background.js";
import { Input } from "../../../shared/components/input/input.js";
import { Select } from "../../../shared/components/select/select.js";
import { Button } from "../../../shared/components/button/button.js";
import { ErrorMessage } from "../../../shared/components/error/error.js";

import {

    BuildingIcon,

    MailIcon,

    PhoneIcon,

    GlobeIcon,

    ShieldCheckIcon,

    EyeIcon

} from "../../../shared/components/icons/index.js";


const INSTITUTION_TYPE_OPTIONS = [

    { value: "school", label: "School" },

    { value: "college", label: "College" },

    { value: "university", label: "University" },

    { value: "coaching", label: "Coaching Institute" },

    { value: "training-center", label: "Training Center" },

    { value: "other", label: "Other" }

];


export function RegisterInstitutionPage() {

    return `

        ${Background()}

        <!-- ===================================
             Full-Screen Submission Loader
             Shown only while the final
             registration request is in flight.
        =================================== -->

        <div
            class="ri-loader-overlay"
            id="riLoaderOverlay"
            role="status"
            aria-live="polite"
            aria-hidden="true"
            hidden
        >

            <div class="ri-loader-card">

                <div class="ri-loader-spinner" aria-hidden="true"></div>

                <h3
                    class="ri-loader-title"
                    id="riLoaderTitle"
                >

                    Setting up your institution…

                </h3>

                <p
                    class="ri-loader-stage"
                    id="riLoaderStage"
                >

                    Creating your owner account…

                </p>

                <div class="ri-loader-progress">

                    <div
                        class="ri-loader-progress-bar"
                        id="riLoaderProgressBar"
                    ></div>

                </div>

                <p class="ri-loader-note">

                    Please don't close or refresh this tab.

                </p>

            </div>

        </div>

        <section class="register-institution">

            <div class="ri-hero">

                <img
                    src="assets/logo/logo.png"
                    alt="CampusOne Logo"
                    class="login-logo"
                >

                <h1 class="login-title">

                    CampusOne

                </h1>

                <p class="ri-subtitle">

                    Register your institution and get started
                    in a few simple steps.

                </p>

            </div>

            <div class="auth-card ri-card">

                <!-- Step Indicator -->

                <div
                    class="ri-steps"
                    id="riSteps"
                >

                    ${[

                        "Institution",

                        "Contact",

                        "Address",

                        "Owner",

                        "Branding",

                        "Modules",

                        "Review"

                    ]

                        .map(

                            (label, index) => `

                                <div
                                    class="ri-step ${index === 0 ? "active" : ""}"
                                    data-step="${index + 1}"
                                >

                                    <span class="ri-step-dot">

                                        ${index + 1}

                                    </span>

                                    <span class="ri-step-label">

                                        ${label}

                                    </span>

                                </div>

                            `

                        )

                        .join("")}

                </div>

                <form id="registerInstitutionForm">

                    <!-- ===================================
                         Step 1 — Institution Information
                    =================================== -->

                    <div
                        class="ri-panel active"
                        data-step="1"
                    >

                        <h2 class="ri-panel-title">

                            Institution Information

                        </h2>

                        ${Input({

                            label: "Institution Name *",

                            id: "institutionName",

                            placeholder: "Institution Name",

                            icon: BuildingIcon(),

                            errorId: "institutionNameError"

                        })}

                        ${Input({

                            label: "Institution Code",

                            id: "institutionCode",

                            placeholder: "Auto generated",

                            icon: BuildingIcon(),

                            errorId: "institutionCodeError",

                            readonly: true,

                            hint: "Generated automatically from the institution name."

                        })}

                        ${Select({

                            label: "Institution Type *",

                            id: "institutionType",

                            icon: BuildingIcon(),

                            errorId: "institutionTypeError",

                            placeholder: "Select institution type",

                            options: INSTITUTION_TYPE_OPTIONS

                        })}

                        ${Input({

                            label: "Established Year (Optional)",

                            id: "establishedYear",

                            type: "number",

                            placeholder: "Established Year",

                            icon: MailIcon(),

                            errorId: "establishedYearError"

                        })}

                        <div class="ri-actions">

                            <span></span>

                            ${Button({

                                text: "Next",

                                id: "riNextStep1",

                                type: "button",

                                variant: "primary"

                            })}

                        </div>

                    </div>

<!-- ===================================
     Step 2 — Contact Information
=================================== -->

<div
    class="ri-panel"
    data-step="2"
>

    <h2 class="ri-panel-title">
        Contact Information
    </h2>

${Input({

    id: "officialEmail",

    label: "Official Email",

    type: "email",

    placeholder: "institution@example.com",

    icon: MailIcon(),

    errorId: "officialEmailError"

})}

<div class="ri-verify-row">

    ${Button({

        id: "verifyEmail",

        text: "Verify Email",

        type: "button",

        variant: "secondary"

    })}

</div>

<div
    class="ri-otp-panel"
    id="emailOtpPanel"
    hidden
>

    ${Input({

        id: "emailOtp",

        label: "Email OTP",

        placeholder: "Enter 6 digit OTP",

        errorId: "emailOtpError"

    })}

    <div class="ri-otp-actions">

        ${Button({

            id: "verifyEmailOtp",

            text: "Verify OTP",

            type: "button",

            variant: "primary"

        })}

        <button
            type="button"
            id="resendEmailOtp"
            class="ri-resend-link"
        >
            Resend OTP
        </button>

    </div>

</div>

<div
    id="emailVerifiedBadge"
    class="ri-verified-badge"
    hidden
>

    ✓ Email Verified

</div>

${Input({

    id: "officialMobile",

    label: "Official Mobile",

    type: "tel",

    placeholder: "10-digit mobile number.",

    icon: PhoneIcon(),

    errorId: "officialMobileError"

})}

<div class="ri-verify-row">

    ${Button({

        id: "verifyMobile",

        text: "Verify Mobile",

        type: "button",

        variant: "secondary"

    })}

</div>

<div
    class="ri-otp-panel"
    id="mobileOtpPanel"
    hidden
>

    ${Input({

        id: "mobileOtp",

        label: "Mobile OTP",

        placeholder: "Enter 6 digit OTP",

        errorId: "mobileOtpError"

    })}

    <div class="ri-otp-actions">

        ${Button({

            id: "verifyMobileOtp",

            text: "Verify OTP",

            type: "button",

            variant: "primary"

        })}

        <button
            type="button"
            id="resendMobileOtp"
            class="ri-resend-link"
        >
            Resend OTP
        </button>

    </div>

</div>

<div
    id="mobileVerifiedBadge"
    class="ri-verified-badge"
    hidden
>

    ✓ Mobile Verified

</div>

    ${Input({

        id: "institutionWebsite",

        label: "Website (Optional)",

        placeholder: " ",

        icon: GlobeIcon(),

        errorId: "institutionWebsiteError"

    })}
    
    ${Input({

    id: "alternateContact",

    label: "Alternate Contact (Optional)",

    type: "tel",

    placeholder: " ",

    icon: PhoneIcon(),

    errorId: "alternateContactError"

})}

    <div class="ri-actions">

        ${Button({

            id: "riBackStep2",

            text: "← Back",

            type: "button",

            variant: "secondary"

        })}

        ${Button({

            id: "riNextStep2",

            text: "Next →",

            type: "button",

            variant: "primary"

        })}

    </div>

</div>

                    <!-- ===================================
                         Step 3 — Address Information
                    =================================== -->

                    <div
                        class="ri-panel"
                        data-step="3"
                    >

                        <h2 class="ri-panel-title">

                            Address Information

                        </h2>

                        ${Input({

                            id: "institutionCountry",

                            label: "Country *",

                            placeholder: " ",

                            icon: GlobeIcon(),

                            errorId: "institutionCountryError",

                            value: "India"

                        })}

                        ${Input({

                            id: "institutionState",

                            label: "State *",

                            placeholder: " ",

                            icon: BuildingIcon(),

                            errorId: "institutionStateError"

                        })}

                        ${Input({

                            id: "institutionDistrict",

                            label: "District *",

                            placeholder: " ",

                            icon: BuildingIcon(),

                            errorId: "institutionDistrictError"

                        })}

                        ${Input({

                            id: "institutionCity",

                            label: "City *",

                            placeholder: " ",

                            icon: BuildingIcon(),

                            errorId: "institutionCityError"

                        })}

                        ${Input({

                            id: "institutionPinCode",

                            label: "PIN Code *",

                            type: "text",

                            placeholder: " ",

                            icon: MailIcon(),

                            errorId: "institutionPinCodeError"

                        })}

                        ${Input({

                            id: "institutionFullAddress",

                            label: "Full Address *",

                            placeholder: "House / Street / Area / Landmark",

                            icon: BuildingIcon(),

                            errorId: "institutionFullAddressError"

                        })}

                        ${Input({

                            id: "institutionMapLink",

                            label: "Google Maps Link (Optional)",

                            placeholder: "https://maps.google.com/...",

                            icon: GlobeIcon(),

                            errorId: "institutionMapLinkError"

                        })}

                        <div class="ri-geo-row">

                            ${Button({

                                id: "riDetectLocation",

                                text: "📍 Detect My Location",

                                type: "button",

                                variant: "secondary"

                            })}

                            <span
                                class="ri-geo-status"
                                id="riGeoStatus"
                            ></span>

                        </div>

                        <input
                            type="hidden"
                            id="institutionLatitude"
                        >

                        <input
                            type="hidden"
                            id="institutionLongitude"
                        >

                        <div class="ri-actions">

                            ${Button({

                                id: "riBackStep3",

                                text: "← Back",

                                type: "button",

                                variant: "secondary"

                            })}

                            ${Button({

                                id: "riNextStep3",

                                text: "Next →",

                                type: "button",

                                variant: "primary"

                            })}

                        </div>

                    </div>

                    <!-- ===================================
                         Step 4 — Institution Owner Account
                    =================================== -->

                    <div
                        class="ri-panel"
                        data-step="4"
                    >

                        <h2 class="ri-panel-title">

                            Institution Owner Account

                        </h2>

                        <p class="ri-panel-subtitle">

                            This account becomes the Institution
                            Owner once registration completes.

                        </p>

                        ${Input({

                            id: "ownerFullName",

                            label: "Full Name *",

                            placeholder: " ",

                            icon: BuildingIcon(),

                            errorId: "ownerFullNameError"

                        })}

                        ${Input({

                            id: "ownerDesignation",

                            label: "Designation *",

                            placeholder: "e.g. Registrar, Director, Principal",

                            icon: BuildingIcon(),

                            errorId: "ownerDesignationError"

                        })}

                        ${Input({

                            id: "ownerEmail",

                            label: "Email *",

                            type: "email",

                            placeholder: " ",

                            icon: MailIcon(),

                            errorId: "ownerEmailError"

                        })}

                        ${Input({

                            id: "ownerMobile",

                            label: "Mobile *",

                            type: "tel",

                            placeholder: " ",

                            icon: PhoneIcon(),

                            errorId: "ownerMobileError"

                        })}

                        ${Input({

                            id: "ownerPassword",

                            label: "Password *",

                            type: "password",

                            placeholder: "Minimum 8 characters",

                            icon: ShieldCheckIcon(),

                            rightIcon: EyeIcon(),

                            errorId: "ownerPasswordError"

                        })}

                        <div
                            class="ri-password-strength"
                            id="riPasswordStrength"
                        >

                            <div
                                class="ri-password-strength-bar"
                                id="riPasswordStrengthBar"
                            ></div>

                            <span id="riPasswordStrengthLabel"></span>

                        </div>

                        ${Input({

                            id: "ownerConfirmPassword",

                            label: "Confirm Password *",

                            type: "password",

                            placeholder: "Re-enter password",

                            icon: ShieldCheckIcon(),

                            rightIcon: EyeIcon(),

                            errorId: "ownerConfirmPasswordError"

                        })}

                        <div class="ri-field">

                            <label
                                class="ri-label"
                                for="ownerProfilePhoto"
                            >

                                Profile Photo (Optional)

                            </label>

                            <div class="ri-file-row">

                                <img
                                    id="ownerProfilePhotoPreview"
                                    class="ri-avatar-preview"
                                    alt="Profile preview"
                                    hidden
                                >

                                <input
                                    type="file"
                                    id="ownerProfilePhoto"
                                    accept="image/*"
                                    class="ri-file-input"
                                >

                            </div>

                            <span
                                class="error-message"
                                id="ownerProfilePhotoError"
                            ></span>

                        </div>

                        <div class="ri-checkbox-row">

                            <input
                                type="checkbox"
                                id="ownerTermsAccepted"
                            >

                            <label for="ownerTermsAccepted">

                                I confirm the above details are
                                accurate and I am authorised to
                                register this institution.

                            </label>

                        </div>

                        <span
                            class="error-message"
                            id="ownerTermsAcceptedError"
                        ></span>

                        <div class="ri-actions">

                            ${Button({

                                id: "riBackStep4",

                                text: "← Back",

                                type: "button",

                                variant: "secondary"

                            })}

                            ${Button({

                                id: "riNextStep4",

                                text: "Next →",

                                type: "button",

                                variant: "primary"

                            })}

                        </div>

                    </div>

                    <!-- ===================================
                         Step 5 — Institution Branding
                    =================================== -->

                    <div
                        class="ri-panel"
                        data-step="5"
                    >

                        <h2 class="ri-panel-title">

                            Institution Branding

                        </h2>

                        <p class="ri-panel-subtitle">

                            Customise how CampusOne looks for
                            your institution. All fields here
                            are optional and can be changed
                            later.

                        </p>

                        <div class="ri-field">

                            <label
                                class="ri-label"
                                for="institutionLogo"
                            >

                                Institution Logo

                            </label>

                            <div class="ri-file-row">

                                <img
                                    id="institutionLogoPreview"
                                    class="ri-avatar-preview"
                                    alt="Logo preview"
                                    hidden
                                >

                                <input
                                    type="file"
                                    id="institutionLogo"
                                    accept="image/*"
                                    class="ri-file-input"
                                >

                            </div>

                            <span
                                class="error-message"
                                id="institutionLogoError"
                            ></span>

                        </div>

                        <div class="ri-field">

                            <label
                                class="ri-label"
                                for="institutionCoverImage"
                            >

                                Cover Image / Banner

                            </label>

                            <div class="ri-file-row">

                                <img
                                    id="institutionCoverImagePreview"
                                    class="ri-banner-preview"
                                    alt="Cover preview"
                                    hidden
                                >

                                <input
                                    type="file"
                                    id="institutionCoverImage"
                                    accept="image/*"
                                    class="ri-file-input"
                                >

                            </div>

                            <span
                                class="error-message"
                                id="institutionCoverImageError"
                            ></span>

                        </div>

                        <div class="ri-color-row">

                            <div class="ri-field">

                                <label
                                    class="ri-label"
                                    for="primaryColor"
                                >

                                    Primary Color

                                </label>

                                <input
                                    type="color"
                                    id="primaryColor"
                                    value="#2563eb"
                                    class="ri-color-input"
                                >

                            </div>

                            <div class="ri-field">

                                <label
                                    class="ri-label"
                                    for="secondaryColor"
                                >

                                    Secondary Color

                                </label>

                                <input
                                    type="color"
                                    id="secondaryColor"
                                    value="#1e293b"
                                    class="ri-color-input"
                                >

                            </div>

                        </div>

                        <div
                            class="ri-theme-preview"
                            id="riThemePreview"
                        >

                            <div
                                class="ri-theme-preview-header"
                                id="riThemePreviewHeader"
                            >

                                Theme Preview

                            </div>

                            <div
                                class="ri-theme-preview-button"
                                id="riThemePreviewButton"
                            >

                                Sample Button

                            </div>

                        </div>

                        <div class="ri-field">

                            <label
                                class="ri-label"
                                for="institutionFavicon"
                            >

                                Favicon (Optional)

                            </label>

                            <input
                                type="file"
                                id="institutionFavicon"
                                accept="image/*"
                                class="ri-file-input"
                            >

                            <span
                                class="error-message"
                                id="institutionFaviconError"
                            ></span>

                        </div>

                        <div class="ri-actions">

                            ${Button({

                                id: "riBackStep5",

                                text: "← Back",

                                type: "button",

                                variant: "secondary"

                            })}

                            ${Button({

                                id: "riNextStep5",

                                text: "Next →",

                                type: "button",

                                variant: "primary"

                            })}

                        </div>

                    </div>

                    <!-- ===================================
                         Step 6 — Modules & Plan
                    =================================== -->

                    <div
                        class="ri-panel"
                        data-step="6"
                    >

                        <h2 class="ri-panel-title">

    Subscription & Plan

</h2>

<p class="ri-panel-subtitle">

    Choose the subscription plan that best fits
    your institution. Modules will be assigned
    automatically based on your selected plan.
    You can upgrade your subscription anytime
    from the CampusOne Dashboard.

</p>

<!-- ============================
     Choose Your Plan
============================= -->

<h3 class="ri-section-title">

    Choose Your Plan

</h3>

<div
    id="riPlanGrid"
    class="plan-grid"

></div>

<span
    class="error-message"
    id="riPlanGridError"
></span>

<!-- ============================
     Billing Cycle
============================= -->

<h3 class="ri-section-title">

    Billing Cycle

</h3>

<div
    id="riBillingToggle"
    class="billing-toggle"

>

    <button

        type="button"

        id="billingMonthly"

        class="billing-btn active"

    >

        Monthly

    </button>

    <button

        type="button"

        id="billingYearly"

        class="billing-btn"

    >

        Yearly

        <span>

            Save 20%

        </span>

    </button>

</div>

<span
    class="error-message"
    id="riBillingToggleError"
></span>

<!-- ============================
   Institution Size
============================ -->

${Select({

    id: "institutionSize",

    label: "Institution Size *",

    icon: BuildingIcon(),

    errorId: "institutionSizeError",

    placeholder: "Select Institution Size",

    options: [

        {

            value: "1-300",

            label: "1–300 Students"

        },

        {

            value: "301-1000",

            label: "301–1000 Students"

        },

        {

            value: "1001-5000",

            label: "1001–5000 Students"

        },

        {

            value: "5000+",

            label: "5000+ Students"

        }

    ]

})}

<!-- ===========================
   Included Modules
============================ -->

<div class="ri-section">

    <h3 class="ri-section-title">

        Included Modules

    </h3>

    <p class="ri-section-subtitle">

        Modules are automatically assigned
        according to your selected plan.

    </p>

    <div

        id="riIncludedModules"

        class="module-list"

    >

    </div>

    <span
        class="error-message"
        id="riIncludedModulesError"
    ></span>

</div>

<!-- ===========================
   Subscription Summary
============================ -->

<div

    id="riSubscriptionSummary"

    class="summary-card"

>

    <h3>

        Subscription Summary

    </h3>

    <div class="summary-row">

        <span class="summary-label">

            Plan

        </span>

        <strong id="summaryPlan" class="summary-value">

            —

        </strong>

    </div>

    <div class="summary-row">

        <span class="summary-label">

            Billing

        </span>

        <strong id="summaryBilling" class="summary-value">

            Monthly

        </strong>

    </div>

    <div class="summary-row">

        <span class="summary-label">

            Institution Size

        </span>

        <strong id="summarySize" class="summary-value">

            —

        </strong>

    </div>

    <div class="summary-row">

        <span class="summary-label">

            Status

        </span>

        <strong id="summaryStatus" class="summary-status">

            Pending Payment

        </strong>

    </div>

</div>

<!-- ===========================
   Information
============================ -->

<div class="info-card">

    <div class="info-card-icon">

        ℹ️

    </div>

    <div class="info-card-content">

        <h3>

            Registration & Subscription

        </h3>

        <p>

            Your institution will be registered immediately
            after successful submission.

        </p>

        <ul>

            <li>

                Registration ID will be generated automatically.

            </li>

            <li>

                Confirmation Email and SMS will be sent.

            </li>

            <li>

                You can log in immediately after registration.

            </li>

            <li>

                Subscription payment can be completed later
                from the CampusOne Dashboard.

            </li>

            <li>

                Modules will automatically unlock after
                successful subscription activation.

            </li>

        </ul>

    </div>

</div>

<!-- ===========================
   Compare Plans
============================ -->

<div class="compare-table">

    <h3 class="ri-section-title">

        Compare Plans

    </h3>

    <table>

        <thead>

            <tr>

                <th>Feature</th>

                <th>Basic</th>

                <th>Standard</th>

                <th>Premium</th>

                <th>Enterprise</th>

            </tr>

        </thead>

        <tbody>

            <tr>

                <td>Student Management</td>

                <td>✓</td>

                <td>✓</td>

                <td>✓</td>

                <td>✓</td>

            </tr>

            <tr>

                <td>Attendance</td>

                <td>✓</td>

                <td>✓</td>

                <td>✓</td>

                <td>✓</td>

            </tr>

            <tr>

                <td>Fee Management</td>

                <td>—</td>

                <td>✓</td>

                <td>✓</td>

                <td>✓</td>

            </tr>

            <tr>

                <td>Library</td>

                <td>—</td>

                <td>✓</td>

                <td>✓</td>

                <td>✓</td>

            </tr>

            <tr>

                <td>Hostel</td>

                <td>—</td>

                <td>—</td>

                <td>✓</td>

                <td>✓</td>

            </tr>

            <tr>

                <td>AI Assistant</td>

                <td>—</td>

                <td>—</td>

                <td>✓</td>

                <td>✓</td>

            </tr>

            <tr>

                <td>Multi Campus</td>

                <td>—</td>

                <td>—</td>

                <td>—</td>

                <td>✓</td>

            </tr>

        </tbody>

    </table>

</div>

<!-- ============================
     Registration Timeline
============================= -->

<div class="ri-registration-flow">

    <h3 class="ri-section-title">

        What Happens Next?

    </h3>

    <div class="ri-flow-item">

        <div class="ri-flow-icon">

            1

        </div>

        <div>

            <strong>

                Registration Complete

            </strong>

            <p>

                Institution details are securely saved.

            </p>

        </div>

    </div>

    <div class="ri-flow-item">

        <div class="ri-flow-icon">

            2

        </div>

        <div>

            <strong>

                Registration ID Generated

            </strong>

            <p>

                A unique CampusOne Registration ID is created.

            </p>

        </div>

    </div>

    <div class="ri-flow-item">

        <div class="ri-flow-icon">

            3

        </div>

        <div>

            <strong>

                Email & SMS Confirmation

            </strong>

            <p>

                Confirmation will be sent to the registered Email and Mobile Number.

            </p>

        </div>

    </div>

    <div class="ri-flow-item">

        <div class="ri-flow-icon">

            4

        </div>

        <div>

            <strong>

                Login Available

            </strong>

            <p>

                Institution Owner can immediately log in to CampusOne.

            </p>

        </div>

    </div>

    <div class="ri-flow-item">

        <div class="ri-flow-icon">

            5

        </div>

        <div>

            <strong>

                Activate Subscription

            </strong>

            <p>

                Complete payment later from the Dashboard to unlock all modules.

            </p>

        </div>

    </div>

</div>

<!-- ============================
     Important Note
============================= -->

<div class="ri-important-note">

    <strong>

        Note

    </strong>

    <p>

        Registration is completely independent from subscription payment.

        Your institution account will be created immediately after successful registration.

        Subscription can be activated later from the CampusOne Dashboard.

    </p>

</div>

<div class="ri-actions">

    ${Button({

        id: "riBackStep6",

        text: "← Back",

        type: "button",

        variant: "secondary"

    })}

    ${Button({

        id: "riNextStep6",

        text: "Next →",

        type: "button",

        variant: "primary"

    })}

</div>

</div>


                    <!-- ===================================
                         Step 7 — Review & Agreement
                    =================================== -->

                    <div
                        class="ri-panel"
                        data-step="7"
                    >

                        <h2 class="ri-panel-title">

                            Review & Agreement

                        </h2>

                        <p class="ri-panel-subtitle">

                            Please confirm everything below is
                            correct before submitting.

                        </p>

                        <div
                            class="ri-review-list"
                            id="riReviewList"
                        >

                            <!-- Populated by JS from the
                                 values entered in Steps 1-6 -->

                        </div>

                        <div class="ri-checkbox-row">

                            <input
                                type="checkbox"
                                id="agreeTerms"
                            >

                            <label for="agreeTerms">

                                I agree to the
                                <a
                                    href="/terms"
                                    target="_blank"
                                    rel="noopener"
                                >Terms & Conditions</a>

                            </label>

                        </div>

                        <div class="ri-checkbox-row">

                            <input
                                type="checkbox"
                                id="agreePrivacy"
                            >

                            <label for="agreePrivacy">

                                I agree to the
                                <a
                                    href="/privacy"
                                    target="_blank"
                                    rel="noopener"
                                >Privacy Policy</a>

                            </label>

                        </div>

                        <div class="ri-checkbox-row">

                            <input
                                type="checkbox"
                                id="agreeConfirmation"
                            >

                            <label for="agreeConfirmation">

                                I digitally confirm all the
                                information submitted is true
                                and accurate.

                            </label>

                        </div>

                        <span
                            class="error-message"
                            id="riAgreementError"
                        ></span>

                        <!-- ===================================
                             Submission error + retry
                             (shown only if the final submit
                             attempt fails)
                        =================================== -->

                        <div
                            class="ri-submit-error"
                            id="riSubmitErrorBox"
                            role="alert"
                            hidden
                        >

                            <p id="riSubmitErrorMessage"></p>

                            ${Button({

                                id: "riRetrySubmit",

                                text: "Try Again",

                                type: "button",

                                variant: "secondary"

                            })}

                        </div>

                        <div class="ri-actions">

                            ${Button({

                                id: "riBackStep7",

                                text: "← Back",

                                type: "button",

                                variant: "secondary"

                            })}

                            ${Button({

                                id: "riSubmit",

                                text: "Complete Registration",

                                type: "button",

                                variant: "primary"

                            })}

                        </div>

                    </div>

                    <!-- ===================================
                         Step 8 — Registration Complete
                    =================================== -->

                    <div
                        class="ri-panel"
                        data-step="8"
                    >

                        <div
                            class="ri-success"
                            id="riSuccessScreen"
                        >

                            <div
                                class="ri-success-icon"
                                id="riSuccessIcon"
                            >

                                ✓

                            </div>

                            <h2 class="ri-panel-title">

                                Registration Complete!

                            </h2>

                            <p
                                class="ri-panel-subtitle"
                                id="riSuccessMessage"
                            >

                                Your institution has been
                                registered on CampusOne.

                            </p>

                            <p
                                class="ri-success-institution-id"
                                id="riSuccessInstitutionId"
                            ></p>

                            <div class="ri-actions ri-actions-center">

                                ${Button({

                                    id: "riDownloadPdf",

                                    text: "Download Confirmation PDF",

                                    type: "button",

                                    variant: "secondary"

                                })}

                                ${Button({

                                    id: "riGoToDashboard",

                                    text: "Go to Dashboard →",

                                    type: "button",

                                    variant: "primary"

                                })}

                            </div>

                        </div>

                    </div>

                </form>

            </div>

        </section>

    `;

}
