export function validateConfirmPassword(password, confirmPassword) {

    if (!confirmPassword) {

        return {

            valid: false,

            message: "Please confirm your password."

        };

    }

    if (confirmPassword !== password) {

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
