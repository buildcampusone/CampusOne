import { validateInstitution } from "./institution.js";
import { validateEmail } from "./email.js";
import { validateName } from "./name.js";
import { validatePassword } from "./password.js";
import { validateConfirmPassword } from "./confirm-password.js";


export function validateRegisterForm({

    institution,

    name,

    email,

    password,

    confirmPassword

}) {

    const institutionResult = validateInstitution(institution);

    if (!institutionResult.valid) {

        return institutionResult;

    }

    const nameResult = validateName(name);

    if (!nameResult.valid) {

        return nameResult;

    }

    const emailResult = validateEmail(email);

    if (!emailResult.valid) {

        return emailResult;

    }

    const passwordResult = validatePassword(password);

    if (!passwordResult.valid) {

        return passwordResult;

    }

    const confirmPasswordResult = validateConfirmPassword(password, confirmPassword);

    if (!confirmPasswordResult.valid) {

        return confirmPasswordResult;

    }

    return {

        valid: true,

        message: ""

    };

}
