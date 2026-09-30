/* =========================================
   Register Institution — Validation
   Step 1: Institution Information
   Step 2: Contact Information
   Step 3: Address Information
   Step 4: Institution Owner Account
   Step 6: Modules & Plan
   Step 7: Review & Agreement

   Step 5 (Branding) has no required fields to
   validate — all inputs there are optional.
========================================= */

import { PLAN_CONFIG } from "./config/plans.js";

const INSTITUTION_TYPES = [

    "school",

    "college",

    "university",

    "coaching",

    "training-center",

    "other"

];

export function validateInstitutionName(name) {

    if (!name || !name.trim()) {

        return {

            valid: false,

            message: "Institution name is required."

        };

    }

    const trimmed = name.trim();

    if (trimmed.length < 3) {

        return {

            valid: false,

            message: "Institution name is too short."

        };

    }

    if (trimmed.length > 100) {

        return {

            valid: false,

            message: "Institution name is too long."

        };

    }

    return {

        valid: true,

        message: ""

    };

}

export function validateInstitutionType(type) {

    if (!type) {

        return {

            valid: false,

            message: "Please select an institution type."

        };

    }

    if (!INSTITUTION_TYPES.includes(type)) {

        return {

            valid: false,

            message: "Please select a valid institution type."

        };

    }

    return {

        valid: true,

        message: ""

    };

}

export function validateEstablishedYear(year) {

    // Optional field — empty is valid.

    if (!year) {

        return {

            valid: true,

            message: ""

        };

    }

    const currentYear = new Date().getFullYear();

    const numericYear = Number(year);

    if (

        !Number.isInteger(numericYear) ||

        numericYear < 1800 ||

        numericYear > currentYear

    ) {

        return {

            valid: false,

            message: `Enter a year between 1800 and ${currentYear}.`

        };

    }

    return {

        valid: true,

        message: ""

    };

}

/* =========================================
   Step 2: Contact Information
========================================= */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MOBILE_PATTERN = /^[6-9]\d{9}$/;

const WEBSITE_PATTERN =
    /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i;

export function validateOfficialEmail(email) {

    if (!email || !email.trim()) {

        return {

            valid: false,

            message: "Official email is required."

        };

    }

    if (!EMAIL_PATTERN.test(email.trim())) {

        return {

            valid: false,

            message: "Enter a valid email address."

        };

    }

    return {

        valid: true,

        message: ""

    };

}

export function validateOfficialMobile(mobile) {

    if (!mobile || !mobile.trim()) {

        return {

            valid: false,

            message: "Official mobile number is required."

        };

    }

    if (!MOBILE_PATTERN.test(mobile.trim())) {

        return {

            valid: false,

            message: "Enter a valid 10-digit mobile number."

        };

    }

    return {

        valid: true,

        message: ""

    };

}

export function validateMobileOtp(otp) {

    if (!otp || !otp.trim()) {

        return {

            valid: false,

            message: "Please enter the OTP sent to your mobile."

        };

    }

    if (!/^\d{6}$/.test(otp.trim())) {

        return {

            valid: false,

            message: "OTP must be a 6-digit number."

        };

    }

    return {

        valid: true,

        message: ""

    };

}

export function validateInstitutionWebsite(website) {

    // Optional field — empty is valid.

    if (!website || !website.trim()) {

        return {

            valid: true,

            message: ""

        };

    }

    if (!WEBSITE_PATTERN.test(website.trim())) {

        return {

            valid: false,

            message: "Enter a valid website URL."

        };

    }

    return {

        valid: true,

        message: ""

    };

}

export function validateContactInfoStep({

    officialEmail,

    officialMobile,

    otpVerified,

    institutionWebsite,

    alternateContact

}) {

    const emailResult =
        validateOfficialEmail(officialEmail);

    if (!emailResult.valid) {

        return {

            ...emailResult,

            field: "officialEmail"

        };

    }

    const mobileResult =
        validateOfficialMobile(officialMobile);

    if (!mobileResult.valid) {

        return {

            ...mobileResult,

            field: "officialMobile"

        };

    }

    if (!otpVerified) {

        return {

            valid: false,

            message: "Please verify your mobile number using OTP.",

            field: "mobileOtp"

        };

    }

    const websiteResult =
        validateInstitutionWebsite(institutionWebsite);

    if (!websiteResult.valid) {

        return {

            ...websiteResult,

            field: "institutionWebsite"

        };

    }

    if (alternateContact && alternateContact.trim() !== "") {

        const alternateResult =
            validateOfficialMobile(alternateContact);

        if (!alternateResult.valid) {

            return {

                ...alternateResult,

                field: "alternateContact"

            };

        }

    }

    return {

        valid: true,

        message: "",

        field: null

    };

}

export function validateInstitutionInfoStep({

    institutionName,

    institutionType,

    establishedYear

}) {

    const nameResult =
        validateInstitutionName(institutionName);

    if (!nameResult.valid) {

        return {

            ...nameResult,

            field: "institutionName"

        };

    }

    const typeResult =
        validateInstitutionType(institutionType);

    if (!typeResult.valid) {

        return {

            ...typeResult,

            field: "institutionType"

        };

    }

    const yearResult =
        validateEstablishedYear(establishedYear);

    if (!yearResult.valid) {

        return {

            ...yearResult,

            field: "establishedYear"

        };

    }

    return {

        valid: true,

        message: "",

        field: null

    };

}

/* =========================================
   Step 3: Address Information
========================================= */

const PIN_CODE_PATTERN = /^[1-9]\d{5}$/;

const MAP_LINK_PATTERN = /^https?:\/\/.+/i;

export function validateInstitutionCountry(country) {

    if (!country || !country.trim()) {

        return {

            valid: false,

            message: "Country is required."

        };

    }

    return {

        valid: true,

        message: ""

    };

}

export function validateInstitutionState(state) {

    if (!state || !state.trim()) {

        return {

            valid: false,

            message: "State is required."

        };

    }

    return {

        valid: true,

        message: ""

    };

}

export function validateInstitutionDistrict(district) {

    if (!district || !district.trim()) {

        return {

            valid: false,

            message: "District is required."

        };

    }

    return {

        valid: true,

        message: ""

    };

}

export function validateInstitutionCity(city) {

    if (!city || !city.trim()) {

        return {

            valid: false,

            message: "City is required."

        };

    }

    return {

        valid: true,

        message: ""

    };

}

export function validateInstitutionPinCode(pinCode) {

    if (!pinCode || !pinCode.trim()) {

        return {

            valid: false,

            message: "PIN Code is required."

        };

    }

    if (!PIN_CODE_PATTERN.test(pinCode.trim())) {

        return {

            valid: false,

            message: "Enter a valid 6-digit PIN Code."

        };

    }

    return {

        valid: true,

        message: ""

    };

}

export function validateInstitutionFullAddress(fullAddress) {

    if (!fullAddress || !fullAddress.trim()) {

        return {

            valid: false,

            message: "Full address is required."

        };

    }

    if (fullAddress.trim().length < 10) {

        return {

            valid: false,

            message: "Address looks too short — add more detail."

        };

    }

    return {

        valid: true,

        message: ""

    };

}

export function validateInstitutionMapLink(mapLink) {

    // Optional field — empty is valid.

    if (!mapLink || !mapLink.trim()) {

        return {

            valid: true,

            message: ""

        };

    }

    if (!MAP_LINK_PATTERN.test(mapLink.trim())) {

        return {

            valid: false,

            message: "Enter a valid URL (starting with http:// or https://)."

        };

    }

    return {

        valid: true,

        message: ""

    };

}

export function validateAddressStep({

    institutionCountry,

    institutionState,

    institutionDistrict,

    institutionCity,

    institutionPinCode,

    institutionFullAddress,

    institutionMapLink

}) {

    const countryResult =
        validateInstitutionCountry(institutionCountry);

    if (!countryResult.valid) {

        return {

            ...countryResult,

            field: "institutionCountry"

        };

    }

    const stateResult =
        validateInstitutionState(institutionState);

    if (!stateResult.valid) {

        return {

            ...stateResult,

            field: "institutionState"

        };

    }

    const districtResult =
        validateInstitutionDistrict(institutionDistrict);

    if (!districtResult.valid) {

        return {

            ...districtResult,

            field: "institutionDistrict"

        };

    }

    const cityResult =
        validateInstitutionCity(institutionCity);

    if (!cityResult.valid) {

        return {

            ...cityResult,

            field: "institutionCity"

        };

    }

    const pinCodeResult =
        validateInstitutionPinCode(institutionPinCode);

    if (!pinCodeResult.valid) {

        return {

            ...pinCodeResult,

            field: "institutionPinCode"

        };

    }

    const fullAddressResult =
        validateInstitutionFullAddress(institutionFullAddress);

    if (!fullAddressResult.valid) {

        return {

            ...fullAddressResult,

            field: "institutionFullAddress"

        };

    }

    const mapLinkResult =
        validateInstitutionMapLink(institutionMapLink);

    if (!mapLinkResult.valid) {

        return {

            ...mapLinkResult,

            field: "institutionMapLink"

        };

    }

    return {

        valid: true,

        message: "",

        field: null

    };

}

/* =========================================
   Step 4: Institution Owner Account
========================================= */

const PASSWORD_PATTERN =
    /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export function validateOwnerFullName(name) {

    if (!name || !name.trim()) {

        return {

            valid: false,

            message: "Full name is required."

        };

    }

    if (name.trim().length < 3) {

        return {

            valid: false,

            message: "Full name is too short."

        };

    }

    return {

        valid: true,

        message: ""

    };

}

export function validateOwnerDesignation(designation) {

    if (!designation || !designation.trim()) {

        return {

            valid: false,

            message: "Designation is required."

        };

    }

    return {

        valid: true,

        message: ""

    };

}

export function validateOwnerEmail(email) {

    if (!email || !email.trim()) {

        return {

            valid: false,

            message: "Email is required."

        };

    }

    if (!EMAIL_PATTERN.test(email.trim())) {

        return {

            valid: false,

            message: "Enter a valid email address."

        };

    }

    return {

        valid: true,

        message: ""

    };

}

export function validateOwnerMobile(mobile) {

    if (!mobile || !mobile.trim()) {

        return {

            valid: false,

            message: "Mobile number is required."

        };

    }

    if (!MOBILE_PATTERN.test(mobile.trim())) {

        return {

            valid: false,

            message: "Enter a valid 10-digit mobile number."

        };

    }

    return {

        valid: true,

        message: ""

    };

}

export function validateOwnerPassword(password) {

    if (!password) {

        return {

            valid: false,

            message: "Password is required."

        };

    }

    if (!PASSWORD_PATTERN.test(password)) {

        return {

            valid: false,

            message: "Password must be at least 8 characters and include a letter and a number."

        };

    }

    return {

        valid: true,

        message: ""

    };

}

export function validateOwnerConfirmPassword(password, confirmPassword) {

    if (!confirmPassword) {

        return {

            valid: false,

            message: "Please confirm your password."

        };

    }

    if (password !== confirmPassword) {

        return {

            valid: false,

            message: "Passwords do not match."

        };

    }

    return {

        valid: true,

        message: ""

    };

}

export function validateOwnerAccountStep({

    ownerFullName,

    ownerDesignation,

    ownerEmail,

    ownerMobile,

    ownerPassword,

    ownerConfirmPassword,

    ownerTermsAccepted

}) {

    const nameResult =
        validateOwnerFullName(ownerFullName);

    if (!nameResult.valid) {

        return {

            ...nameResult,

            field: "ownerFullName"

        };

    }

    const designationResult =
        validateOwnerDesignation(ownerDesignation);

    if (!designationResult.valid) {

        return {

            ...designationResult,

            field: "ownerDesignation"

        };

    }

    const emailResult =
        validateOwnerEmail(ownerEmail);

    if (!emailResult.valid) {

        return {

            ...emailResult,

            field: "ownerEmail"

        };

    }

    const mobileResult =
        validateOwnerMobile(ownerMobile);

    if (!mobileResult.valid) {

        return {

            ...mobileResult,

            field: "ownerMobile"

        };

    }

    const passwordResult =
        validateOwnerPassword(ownerPassword);

    if (!passwordResult.valid) {

        return {

            ...passwordResult,

            field: "ownerPassword"

        };

    }

    const confirmResult =
        validateOwnerConfirmPassword(

            ownerPassword,

            ownerConfirmPassword

        );

    if (!confirmResult.valid) {

        return {

            ...confirmResult,

            field: "ownerConfirmPassword"

        };

    }

    if (!ownerTermsAccepted) {

        return {

            valid: false,

            message: "Please confirm the details above to continue.",

            field: "ownerTermsAccepted"

        };

    }

    return {

        valid: true,

        message: "",

        field: null

    };

}

/* =========================================
   Step 6: Subscription & Plan
========================================= */

const INSTITUTION_SIZES = [

    "1-300",

    "301-1000",

    "1001-5000",

    "5000+"

];

export function validateSelectedModules(selectedModules) {

    if (!selectedModules || selectedModules.length === 0) {

        return {

            valid: false,

            message: "Select at least one module."

        };

    }

    return {

        valid: true,

        message: ""

    };

}

export function validateSubscriptionPlan(plan) {

    if (!plan) {

        return {

            valid: false,

            message: "Please select a subscription plan."

        };

    }

    if (!Object.keys(PLAN_CONFIG).includes(plan)) {

        return {

            valid: false,

            message: "Please select a valid subscription plan."

        };

    }

    return {

        valid: true,

        message: ""

    };

}

export function validateInstitutionSize(size) {

    if (!size) {

        return {

            valid: false,

            message: "Please select your institution size."

        };

    }

    if (!INSTITUTION_SIZES.includes(size)) {

        return {

            valid: false,

            message: "Please select a valid institution size."

        };

    }

    return {

        valid: true,

        message: ""

    };

}

export function validateSubscriptionStep({

    selectedPlan,

    billingCycle,

    institutionSize,

    selectedModules

}) {

    const planResult =
        validateSubscriptionPlan(selectedPlan);

    if (!planResult.valid) {

        return {

            ...planResult,

            field: "riPlanGrid"

        };

    }

    const sizeResult =
        validateInstitutionSize(institutionSize);

    if (!sizeResult.valid) {

        return {

            ...sizeResult,

            field: "institutionSize"

        };

    }

    const modulesResult =
        validateSelectedModules(selectedModules);

    if (!modulesResult.valid) {

        return {

            ...modulesResult,

            field: "riIncludedModules"

        };

    }

    if (!billingCycle) {

        return {

            valid: false,

            message: "Please select a billing cycle.",

            field: "riBillingToggle"

        };

    }

    return {

        valid: true,

        message: "",

        field: null

    };

}

/* =========================================
   Step 7: Review & Agreement
========================================= */

export function validateAgreementStep({

    agreeTerms,

    agreePrivacy,

    agreeConfirmation

}) {

    if (!agreeTerms || !agreePrivacy || !agreeConfirmation) {

        return {

            valid: false,

            message: "Please accept all agreements to continue.",

            field: "riAgreement"

        };

    }

    return {

        valid: true,

        message: "",

        field: null

    };

}
