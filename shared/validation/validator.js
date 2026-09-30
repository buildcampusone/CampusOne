import { validateEmail } from "./email.js";
import { validatePassword } from "./password.js";
import { validateInstitution } from "./institution.js";


export function validateLoginForm({

    institution,

    email,

    password

}) {

    const institutionResult = validateInstitution(institution);

    if (!institutionResult.valid) {

        return institutionResult;

    }

    const emailResult = validateEmail(email);

    if (!emailResult.valid) {

        return emailResult;

    }

    const passwordResult = validatePassword(password);

    if (!passwordResult.valid) {

        return passwordResult;

    }

    return {

        valid: true,

        message: ""

    };

}