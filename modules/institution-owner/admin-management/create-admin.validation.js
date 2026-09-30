/**
 * ==========================================================
 * CampusOne
 * Institution Owner — Create Institution Administrator
 * Validation
 * ----------------------------------------------------------
 * Phase 5.1.2 (Part 1) — Create Institution Administrator
 * UI & Validation Foundation
 *
 * Full Name, Official Email, and Mobile Number already have a
 * shared rule (shared/validation/name.js, email.js, mobile.js)
 * — reused here verbatim rather than reinvented, same as every
 * other form in the app. Designation and Department have no
 * existing rule anywhere in the codebase, so those two are
 * defined locally, module-scoped, following the exact
 * {valid, message} contract every other validator already uses
 * (registration.validation.js, shared/validation/*).
 *
 * Department is validated as free text on purpose: the
 * Departments module doesn't exist yet (admin-management.
 * controller.js's own getDepartmentFilterOptions() comment
 * documents this — "Future Ready" scaffolding, no data model).
 * Once that module ships, this field becomes a Select sourced
 * from it and validateDepartment() below is the only function
 * that needs to change — see create-admin.controller.js's
 * "Future Integration Points" note.
 * ==========================================================
 */

import {
    validateName,
    validateEmail,
    validateMobile
} from "../../../shared/validation/index.js";

const DESIGNATION_PATTERN = /^[a-zA-Z0-9\s.,'&()-]+$/;

const DEPARTMENT_PATTERN = /^[a-zA-Z0-9\s.,'&()-]+$/;

export { validateName as validateFullName };

export { validateEmail };

export { validateMobile };

export function validateDesignation(designation) {

    const value = designation ? designation.trim() : "";

    if (!value) {

        return {
            valid: false,
            message: "Designation is required."
        };

    }

    if (value.length < 2) {

        return {
            valid: false,
            message: "Designation is too short."
        };

    }

    if (value.length > 60) {

        return {
            valid: false,
            message: "Designation is too long."
        };

    }

    if (!DESIGNATION_PATTERN.test(value)) {

        return {
            valid: false,
            message: "Designation contains invalid characters."
        };

    }

    return {
        valid: true,
        message: ""
    };

}

export function validateDepartment(department) {

    const value = department ? department.trim() : "";

    if (!value) {

        return {
            valid: false,
            message: "Department is required."
        };

    }

    if (value.length < 2) {

        return {
            valid: false,
            message: "Department is too short."
        };

    }

    if (value.length > 60) {

        return {
            valid: false,
            message: "Department is too long."
        };

    }

    if (!DEPARTMENT_PATTERN.test(value)) {

        return {
            valid: false,
            message: "Department contains invalid characters."
        };

    }

    return {
        valid: true,
        message: ""
    };

}

/**
 * Composite validator — runs every field in form order and
 * returns on the first failure, same "stop at first invalid
 * field" contract validateRegisterForm()/validateLoginForm()
 * already establish. `field` is the create-admin.page.js input
 * id (minus "Error"/"Input" suffix) so the controller's
 * showError(field, message) can focus it directly, same
 * pattern registration.validation.js's own composite
 * validators (validateOwnerAccountStep etc.) already use.
 *
 * @returns {{valid:boolean, message:string, field:string}}
 */
export function validateCreateAdminForm({

    fullName,

    designation,

    email,

    mobile,

    department

}) {

    const nameResult = validateName(fullName);

    if (!nameResult.valid) {

        return { ...nameResult, field: "fullName" };

    }

    const designationResult = validateDesignation(designation);

    if (!designationResult.valid) {

        return { ...designationResult, field: "designation" };

    }

    const emailResult = validateEmail(email);

    if (!emailResult.valid) {

        return { ...emailResult, field: "email" };

    }

    const mobileResult = validateMobile(mobile);

    if (!mobileResult.valid) {

        return { ...mobileResult, field: "mobile" };

    }

    const departmentResult = validateDepartment(department);

    if (!departmentResult.valid) {

        return { ...departmentResult, field: "department" };

    }

    return {
        valid: true,
        message: "",
        field: ""
    };

}
