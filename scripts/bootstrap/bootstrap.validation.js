/**
 * ==========================================================
 * CampusOne Bootstrap — Validation
 * ----------------------------------------------------------
 * Validates only what this tool actually accepts: email and
 * full name. There is intentionally no password validator —
 * this tool never accepts a password (see bootstrap.service.js).
 * ==========================================================
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class BootstrapValidationError extends Error {

    constructor(message) {

        super(message);
        this.name = "BootstrapValidationError";

    }

}

function validateEmail(email) {

    if (!email || typeof email !== "string") {
        throw new BootstrapValidationError("SUPER_ADMIN_EMAIL is required.");
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
        throw new BootstrapValidationError(`SUPER_ADMIN_EMAIL is not a valid email address: "${email}"`);
    }

}

function validateFullName(fullName) {

    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
        throw new BootstrapValidationError("SUPER_ADMIN_FULL_NAME is required.");
    }

    if (fullName.trim().length > 200) {
        throw new BootstrapValidationError("SUPER_ADMIN_FULL_NAME is too long (max 200 characters).");
    }

}

function validateInput({ email, fullName }) {

    validateEmail(email);
    validateFullName(fullName);

}

module.exports = {
    BootstrapValidationError,
    validateInput,
    validateEmail,
    validateFullName
};
