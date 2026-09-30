/**
 * ==========================================================
 * CampusOne
 * Mobile Number Validation
 * ----------------------------------------------------------
 * Same India 10-digit pattern already used twice inside
 * modules/institution/registration/registration.validation.js
 * (validateOfficialMobile / validateOwnerMobile) — promoted
 * here now that a third feature (Phase 5.1.2 Create Institution
 * Administrator) needs the identical rule, per the
 * Reusable-over-Duplicate golden rule. The two existing inline
 * copies are left as-is (minimum files modified); a future
 * refactor can point them at this module without changing
 * behavior.
 * ==========================================================
 */

const MOBILE_PATTERN = /^[6-9]\d{9}$/;

export function validateMobile(mobile) {

    const value = mobile ? mobile.trim() : "";

    if (!value) {

        return {
            valid: false,
            message: "Mobile number is required."
        };

    }

    if (!MOBILE_PATTERN.test(value)) {

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
