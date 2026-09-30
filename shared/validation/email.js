export function validateEmail(email) {

    const value = email.trim();

    if (!value) {

        return {

            valid: false,

            message: "Email is required."

        };

    }

    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!pattern.test(value)) {

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