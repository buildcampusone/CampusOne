export function validateName(name) {

    if (!name) {

        return {

            valid: false,

            message: "Full name is required."

        };

    }

    const trimmed = name.trim();

    if (trimmed.length < 3) {

        return {

            valid: false,

            message: "Full name is too short."

        };

    }

    if (trimmed.length > 50) {

        return {

            valid: false,

            message: "Full name is too long."

        };

    }

    if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) {

        return {

            valid: false,

            message: "Only letters and spaces are allowed."

        };

    }

    return {

        valid: true,

        message: ""

    };

}
