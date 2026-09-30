export function validatePassword(password) {

    const value = password.trim();

    if (!value) {

        return {

            valid: false,

            message: "Password is required."

        };

    }

    if (value.length < 8) {

        return {

            valid: false,

            message: "Password must be at least 8 characters."

        };

    }

    if (!/[A-Z]/.test(value)) {

        return {

            valid: false,

            message: "Password must contain an uppercase letter."

        };

    }

    if (!/[a-z]/.test(value)) {

        return {

            valid: false,

            message: "Password must contain a lowercase letter."

        };

    }

    if (!/[0-9]/.test(value)) {

        return {

            valid: false,

            message: "Password must contain a number."

        };

    }

    return {

        valid: true,

        message: ""

    };

}