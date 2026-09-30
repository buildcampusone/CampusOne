import {
    EyeIcon,
    EyeOffIcon
} from "../../../shared/components/icons/index.js";

import {
    validateLoginForm
} from "../../../shared/validation/index.js";

import {
    login as authLogin,
    loginWithGoogle,
    mapAuthError,
    onSessionChange
} from "../../../shared/services/auth.service.js";

import {
    navigate
} from "../../../router/router.js";

import { resolveRouteForRole } from "../../../shared/core/auth/role-router.js";

/* =========================================
   Secret Super Admin Access
========================================= */

function initSecretSuperAdminAccess() {

    const logo =
        document.getElementById("campusoneLogo");

    if (!logo) return;

    let tapCount = 0;

    let timer;

    logo.addEventListener("click", () => {

        tapCount++;

        clearTimeout(timer);

        if (tapCount >= 5) {

            tapCount = 0;

            navigate("super-admin-login");

            return;

        }

        timer = setTimeout(() => {

            tapCount = 0;

        }, 600);

    });

}

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
   Map an app-level/Firebase error to the
   right field on the login form. Falls back
   to the password field, matching how
   Firebase deliberately keeps invalid-email
   vs invalid-password ambiguous for security.
========================================= */

function getErrorIdForCode(code) {

    if (code === "auth/user-not-found") return "emailError";

    const institutionCodes = [
        "auth/invalid-institution-code",
        "auth/institution-missing"
    ];

    if (institutionCodes.includes(code)) return "institutionError";

    return "passwordError";

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

    text = "Continue"

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
   (client-side validation messages, not
   Firebase errors)
========================================= */

function getErrorIdForMessage(message) {

    const institutionMessages = [
        "Institution code is required.",
        "Institution code is too short.",
        "Institution code is too long.",
        "Only letters, numbers, '-' and '_' are allowed."
    ];

    const emailMessages = [
        "Email is required.",
        "Enter a valid email address."
    ];

    if (institutionMessages.includes(message)) {

        return "institutionError";

    }

    if (emailMessages.includes(message)) {

        return "emailError";

    }

    return "passwordError";

}

/* =========================================
   Login

   Guarded against double invocation: both
   router.js (on navigate("login")) and any
   other caller might trigger this for the
   same rendered DOM. The guard lives on the
   button itself rather than as a module-level
   flag, so a *real* future navigation back to
   the login page (fresh DOM, e.g. after
   logout) still binds correctly — only a
   second call against the *same* still-mounted
   button is a no-op.
========================================= */

export function initLogin() {

    const loginButton =
        document.getElementById("loginButton");

    if (!loginButton) return;

    if (loginButton.dataset.bound === "true") {
        return;
    }

    loginButton.dataset.bound = "true";
    
    initSecretSuperAdminAccess();

    /* =========================================
       Remember Me
    ========================================= */

    const rememberMe =
        document.getElementById("rememberMe");

    const emailInput =
        document.getElementById("email");

    const institutionInput =
        document.getElementById("institution");

    const passwordInput =
        document.getElementById("password");

    const savedEmail =
        localStorage.getItem("rememberEmail");

    const savedInstitution =
        localStorage.getItem("rememberInstitution");

    if (rememberMe && emailInput && savedEmail) {

        emailInput.value = savedEmail;

        rememberMe.checked = true;

    }

    if (institutionInput && savedInstitution) {

        institutionInput.value = savedInstitution;

    }

    /* =========================================
       Password Toggle
    ========================================= */

    const passwordButton =
        document.querySelector(
            '[data-toggle="password"]'
        );

    if (passwordInput && passwordButton) {

        let visible = false;

        passwordButton.innerHTML = EyeIcon();

        passwordButton.addEventListener("click", () => {

            visible = !visible;

            passwordInput.type = visible
                ? "text"
                : "password";

            passwordButton.innerHTML = visible
                ? EyeOffIcon()
                : EyeIcon();

            passwordButton.setAttribute(
                "aria-pressed",
                String(visible)
            );

        });

    }

    /* =========================================
       Forgot Password
    ========================================= */

    const forgotPassword =
        document.getElementById("forgotPassword");

    if (forgotPassword) {

        forgotPassword.addEventListener(
            "click",
            async (event) => {

                event.preventDefault();

                navigate("forgot-password");

                const { initForgotPassword } =
                    await import("../forgot-password/forgot-password.controller.js");

                requestAnimationFrame(() => {

                    initForgotPassword();

                });

            }
        );

    }

    /* =========================================
       Create Account
    ========================================= */

    const createAccount =
        document.getElementById("createAccount");

    if (createAccount) {

        createAccount.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                navigate("register");

            }
        );

    }

    /* =========================================
       Register Institution
    ========================================= */

    const registerInstitution =
        document.getElementById("registerInstitution");

    if (registerInstitution) {

        registerInstitution.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                navigate("register-institution");

            }
        );

    }

    /* =========================================
       Google Sign In
    ========================================= */

    const googleButton =
        document.getElementById("googleLogin");

    if (googleButton) {

        googleButton.addEventListener(
            "click",
            async () => {

                setButtonLoading(
                    googleButton,
                    "Signing in..."
                );

                try {

                    const user = await loginWithGoogle();

                    resetButton(
                        googleButton,
                        "Continue with Google"
                    );

                    if (!user) return; // popup closed by user

                    alert("Login Successful ✅");

                    // navigate("dashboard");

                } catch (error) {

                    resetButton(
                        googleButton,
                        "Continue with Google"
                    );

                    const message = mapAuthError(error);

                    if (message) alert("Google Sign-In failed: " + message);

                }

            }
        );

    }

    /* =========================================
       Login
    ========================================= */

    async function handleLogin() {

        clearErrors();

        resetValidation();

        const institution =
            institutionInput
                ? institutionInput.value.trim()
                : "";

        const email =
            emailInput
                ? emailInput.value.trim()
                : "";

        const password =
            passwordInput
                ? passwordInput.value
                : "";

        const result =
            validateLoginForm({

                institution,

                email,

                password

            });

        if (!result.valid) {

            showError(
                getErrorIdForMessage(result.message),
                result.message
            );

            return;

        }

        setButtonLoading(loginButton);

        try {

            const session =
                await authLogin(email, password, institution);

            /* ==============================
               Remember Me
            ============================== */

            if (rememberMe && rememberMe.checked) {

                localStorage.setItem(
                    "rememberEmail",
                    email
                );

                localStorage.setItem(
                    "rememberInstitution",
                    institution
                );

            } else {

                localStorage.removeItem("rememberEmail");

                localStorage.removeItem("rememberInstitution");

            }

            showSuccess("institution");

            showSuccess("email");

            showSuccess("password");

            resetButton(loginButton);

            const route = resolveRouteForRole(session.role);

            if (route) {

                navigate(route);

            } else {

                alert(
                    "Login Successful ✅ (a dashboard for the \"" +
                    session.role +
                    "\" role hasn't been built yet)"
                );

            }

        } catch (error) {

            resetButton(loginButton);

            const message = mapAuthError(error);

            if (message) {

                showError(
                    getErrorIdForCode(error.code),
                    message
                );

            }

        }

    }

    loginButton.addEventListener("click", handleLogin);

    // Allow submitting with Enter key
    // from any of the three inputs.
    [institutionInput, emailInput, passwordInput]
        .filter(Boolean)
        .forEach((input) => {

            input.addEventListener("keydown", (event) => {

                if (event.key === "Enter") {

                    event.preventDefault();

                    handleLogin();

                }

            });

        });


    /* =========================================
       Session Restore

       Routed through auth.service.js's
       onSessionChange(), which itself defers
       to the single shared listener in
       session.store.js — no second onAuthStateChanged
       is ever created here.
    ========================================= */

    let unsubscribeRestore;

    unsubscribeRestore = onSessionChange((session) => {

        if (!session.user || !session.user.emailVerified) return;
        if (!session.roleResolved) return;

        unsubscribeRestore?.();

        const route = resolveRouteForRole(session.role);

        if (route) {
            navigate(route);
        }

    });

}
