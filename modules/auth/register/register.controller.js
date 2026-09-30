import {
    EyeIcon,
    EyeOffIcon
} from "../../../shared/components/icons/index.js";

import {
    validateRegisterForm
} from "../../../shared/validation/index.js";

import {
    register as authRegister,
    loginWithGoogle,
    mapAuthError
} from "../../../shared/services/auth.service.js";

import {
    navigate
} from "../../../router/router.js";


/* =========================================
   Error Helpers
========================================= */

function clearErrors() {

    document
        .querySelectorAll(".error-message")
        .forEach(error => {

            error.textContent = "";

            error.classList.remove("show");

        });

}

function resetValidation() {

    document
        .querySelectorAll(".input")
        .forEach(input => {

            input.classList.remove(
                "error",
                "success"
            );

        });

}

function showError(id, message) {

    const error =
        document.getElementById(id);

    if (!error) return;

    error.textContent = message;

    error.classList.add("show");

    const input =
        document.getElementById(
            id.replace("Error", "")
        );

    if (input) {

        input.classList.remove("success");

        input.classList.add("error");

        input.focus();

    }

}

function showSuccess(id) {

    const input =
        document.getElementById(id);

    if (!input) return;

    input.classList.remove("error");

    input.classList.add("success");

}

/* =========================================
   Button Helpers
========================================= */

function setButtonLoading(

    button,

    text = "Please Wait..."

) {

    if (!button) return;

    button.disabled = true;

    button.classList.add("loading");

    const buttonText =
        button.querySelector(".btn-text");

    if (buttonText) {

        buttonText.textContent = text;

    }

    if (!button.querySelector(".btn-spinner")) {

        const spinner =
            document.createElement("span");

        spinner.className = "btn-spinner";

        button.appendChild(spinner);

    }

}

function resetButton(

    button,

    text = "Create Account"

) {

    if (!button) return;

    button.disabled = false;

    button.classList.remove("loading");

    const buttonText =
        button.querySelector(".btn-text");

    if (buttonText) {

        buttonText.textContent = text;

    }

    const spinner =
        button.querySelector(".btn-spinner");

    if (spinner) {

        spinner.remove();

    }

}

/* =========================================
   Map field name -> error element id
   (client-side validation messages)
========================================= */

function getErrorIdForMessage(message) {

    const institutionMessages = [
        "Institution code is required.",
        "Institution code is too short.",
        "Institution code is too long.",
        "Only letters, numbers, '-' and '_' are allowed."
    ];

    const nameMessages = [
        "Full name is required.",
        "Full name is too short.",
        "Full name is too long.",
        "Only letters and spaces are allowed."
    ];

    const emailMessages = [
        "Email is required.",
        "Enter a valid email address."
    ];

    const confirmPasswordMessages = [
        "Please confirm your password.",
        "Passwords do not match."
    ];

    if (institutionMessages.includes(message)) {

        return "institutionError";

    }

    if (nameMessages.includes(message)) {

        return "nameError";

    }

    if (emailMessages.includes(message)) {

        return "emailError";

    }

    if (confirmPasswordMessages.includes(message)) {

        return "confirmPasswordError";

    }

    // Anything left over is a password-strength
    // message coming from validatePassword().

    return "passwordError";

}

/* =========================================
   Map an auth.service error code -> field
   (replaces the old local mapRegisterError
   switch statement — message text itself now
   comes from auth.service.js's single mapper)
========================================= */

function getErrorIdForCode(code) {

    const emailCodes = [
        "auth/email-already-in-use",
        "auth/invalid-email",
        "auth/missing-email"
    ];

    if (emailCodes.includes(code)) return "emailError";

    return "passwordError";

}

/* =========================================
   Password Toggle Helper
   (handles both #password and #confirmPassword)
========================================= */

function setupPasswordToggle(inputId) {

    const input =
        document.getElementById(inputId);

    const button =
        document.querySelector(
            `[data-toggle="${inputId}"]`
        );

    if (!input || !button) return;

    let visible = false;

    button.innerHTML = EyeIcon();

    button.addEventListener("click", () => {

        visible = !visible;

        input.type = visible
            ? "text"
            : "password";

        button.innerHTML = visible
            ? EyeOffIcon()
            : EyeIcon();

        button.setAttribute(
            "aria-pressed",
            String(visible)
        );

    });

}

/* =========================================
   Register

   Guarded against double invocation the same
   way login.js is: the flag lives on the
   submit button's dataset, scoped to the
   currently-mounted DOM, so a fresh navigation
   back to this page still binds correctly.
========================================= */

export function initRegister() {

    const createAccountButton =
        document.getElementById("createAccountButton");

    if (!createAccountButton) return;

    if (createAccountButton.dataset.bound === "true") {
        return;
    }

    createAccountButton.dataset.bound = "true";

    const institutionInput =
        document.getElementById("institution");

    const nameInput =
        document.getElementById("name");

    const emailInput =
        document.getElementById("email");

    const passwordInput =
        document.getElementById("password");

    const confirmPasswordInput =
        document.getElementById("confirmPassword");

    const googleButton =
        document.getElementById("googleRegister");

    const formWrapper =
        document.getElementById("registerForm");

    const successWrapper =
        document.getElementById("registerSuccess");

    const signInLink =
        document.getElementById("signInLink");

    const goToLoginButton =
        document.getElementById("goToLoginButton");

    /* =========================================
       Password Toggles
    ========================================= */

    setupPasswordToggle("password");

    setupPasswordToggle("confirmPassword");

    /* =========================================
       Sign In Link / Go to Login
    ========================================= */

    function goToLogin(event) {

        if (event) event.preventDefault();

        navigate("login");

    }

    if (signInLink) {

        signInLink.addEventListener(
            "click",
            goToLogin
        );

    }

    if (goToLoginButton) {

        goToLoginButton.addEventListener(
            "click",
            goToLogin
        );

    }

    /* =========================================
       Google Sign Up
    ========================================= */

    if (googleButton) {

        googleButton.addEventListener(
            "click",
            async () => {

                setButtonLoading(
                    googleButton,
                    "Signing up..."
                );

                try {

                    const user = await loginWithGoogle();

                    resetButton(
                        googleButton,
                        "Continue with Google"
                    );

                    if (!user) return; // popup closed by user

                    alert("Account Created ✅");

                    // navigate("dashboard");

                } catch (error) {

                    resetButton(
                        googleButton,
                        "Continue with Google"
                    );

                    const message = mapAuthError(error);

                    if (message) alert("Google Sign-Up failed: " + message);

                }

            }
        );

    }

    /* =========================================
       Create Account
    ========================================= */

    async function handleRegister() {

        clearErrors();

        resetValidation();

        const institution =
            institutionInput
                ? institutionInput.value.trim()
                : "";

        const name =
            nameInput
                ? nameInput.value.trim()
                : "";

        const email =
            emailInput
                ? emailInput.value.trim()
                : "";

        const password =
            passwordInput
                ? passwordInput.value
                : "";

        const confirmPassword =
            confirmPasswordInput
                ? confirmPasswordInput.value
                : "";

        const result =
            validateRegisterForm({

                institution,

                name,

                email,

                password,

                confirmPassword

            });

        if (!result.valid) {

            showError(
                getErrorIdForMessage(result.message),
                result.message
            );

            return;

        }

        showSuccess("institution");

        showSuccess("name");

        showSuccess("email");

        showSuccess("password");

        showSuccess("confirmPassword");

        setButtonLoading(
            createAccountButton,
            "Creating Account..."
        );

        try {

            await authRegister(email, password, name);

            resetButton(createAccountButton);

            if (formWrapper && successWrapper) {

                formWrapper.style.display = "none";

                successWrapper.style.display = "block";

            }

        } catch (error) {

            resetButton(createAccountButton);

            const message = mapAuthError(error);

            if (message) {

                showError(
                    getErrorIdForCode(error.code),
                    message
                );

            }

        }

    }

    createAccountButton.addEventListener(
        "click",
        handleRegister
    );

    // Allow submitting with Enter key
    // from any of the five inputs.

    [
        institutionInput,
        nameInput,
        emailInput,
        passwordInput,
        confirmPasswordInput
    ]
        .filter(Boolean)
        .forEach((input) => {

            input.addEventListener("keydown", (event) => {

                if (event.key === "Enter") {

                    event.preventDefault();

                    handleRegister();

                }

            });

        });

}
