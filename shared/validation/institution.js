export function validateInstitution(code) {

    const value = code.trim();

    if (!value) {

        return {

            valid: false,

            message: "Institution code is required."

        };

    }

    if (value.length < 3) {

        return {

            valid: false,

            message: "Institution code is too short."

        };

    }

    if (value.length > 20) {

        return {

            valid: false,

            message: "Institution code is too long."

        };

    }

    const pattern = /^[A-Za-z0-9_-]+$/;

    if (!pattern.test(value)) {

        return {

            valid: false,

            message: "Only letters, numbers, '-' and '_' are allowed."

        };

    }

    return {

        valid: true,

        message: ""

    };

}