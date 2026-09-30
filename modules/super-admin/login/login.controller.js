/**
 * ---------------------------------------------------------
 * CampusOne
 * Super Admin Login Controller
 * ---------------------------------------------------------
 */

import { loginSuperAdmin } from "./login.service.js";

import { mapAuthError } from "../../../shared/services/auth.service.js";

import { navigate } from "../../../router/router.js";

import {
    EyeIcon,
    EyeOffIcon
} from "../../../shared/components/icons/index.js";

export function initSuperAdminLogin() {

    const form = document.getElementById("superAdminLoginForm");

    if (!form) return;

    const emailInput = document.getElementById("adminEmail");

    const passwordInput = document.getElementById("adminPassword");

    const togglePassword = document.querySelector(
        '.input-action[data-toggle="adminPassword"]'
    );

    const loginButton = document.getElementById("loginButton");

    const loader = document.getElementById("saLoginLoader");

    const loaderText = document.getElementById("saLoaderText");

    /* =====================================================
       Premium Loader
       -----------------------------------------------------
       Two phases:
       1. "auth"     — spinner + progress bar while Firebase
                       actually authenticates.
       2. "skeleton" — once login succeeds, morphs into a
                       skeleton preview of the dashboard shell
                       for a short, deliberate beat before the
                       real route renders. Purely cosmetic —
                       navigate() still only fires after both
                       phases complete.
    ===================================================== */

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const MIN_AUTH_PHASE_MS = 1100;
    const SKELETON_PHASE_MS = 1300;

    function showLoader() {

        if (!loader) return;

        loader.classList.remove("phase-skeleton");
        if (loaderText) loaderText.textContent = "Authenticating...";

        loader.classList.add("show");
        loader.setAttribute("aria-hidden", "false");

    }

    function hideLoader() {

        if (!loader) return;

        loader.classList.remove("show", "phase-skeleton");
        loader.setAttribute("aria-hidden", "true");

    }

    function enterSkeletonPhase() {

        if (!loader) return;

        if (loaderText) loaderText.textContent = "Preparing your dashboard...";
        loader.classList.add("phase-skeleton");

    }

    /* =====================================================
       Error Display
       (Access Denied / Unauthorized / any auth failure)
    ===================================================== */

    function showLoginError(message) {

        const errorEl = document.getElementById("adminPasswordError");

        if (!errorEl) {
            alert(message);
            return;
        }

        errorEl.textContent = message;
        errorEl.classList.add("show");

        passwordInput?.classList.add("error");

    }

    function clearLoginError() {

        const errorEl = document.getElementById("adminPasswordError");

        if (!errorEl) return;

        errorEl.textContent = "";
        errorEl.classList.remove("show");

        passwordInput?.classList.remove("error");

    }

    /* =====================================================
       Password Visibility
    ===================================================== */

    if (togglePassword && passwordInput) {

        togglePassword.innerHTML = EyeIcon();

        togglePassword.setAttribute(
            "aria-label",
            "Show Password"
        );

        togglePassword.addEventListener("click", () => {

            const hidden = passwordInput.type === "password";

            passwordInput.type = hidden
                ? "text"
                : "password";

            togglePassword.innerHTML = hidden
                ? EyeOffIcon()
                : EyeIcon();

            togglePassword.setAttribute(
                "aria-label",
                hidden
                    ? "Hide Password"
                    : "Show Password"
            );

        });

    }

    /* =====================================================
       Login
    ===================================================== */

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        if (loginButton.disabled) return;

        clearLoginError();

        const email = emailInput.value.trim();

        const password = passwordInput.value;

        if (!email) {

            emailInput.focus();

            return;

        }

        if (!password) {

            passwordInput.focus();

            return;

        }

        loginButton.disabled = true;

        const originalHTML = loginButton.innerHTML;

        loginButton.innerHTML = "Signing In...";

        showLoader();

        const authStartedAt = performance.now();

        try {

            await loginSuperAdmin(
                email,
                password
            );

            // Hold the auth-spinner phase for a minimum beat so
            // fast logins on a great connection don't feel like
            // a flicker, then morph into the skeleton preview
            // for a fixed dwell before the real dashboard mounts.
            const elapsed = performance.now() - authStartedAt;

            if (elapsed < MIN_AUTH_PHASE_MS) {
                await sleep(MIN_AUTH_PHASE_MS - elapsed);
            }

            enterSkeletonPhase();

            await sleep(SKELETON_PHASE_MS);

            navigate("super-admin");

            // Loader is left showing intentionally — navigate()
            // replaces #app's entire contents (including this
            // overlay), so the transition into the real shell
            // reads as continuous rather than a hide/show flash.

        } catch (error) {

            hideLoader();

            const message =
                mapAuthError(error) ||
                "Unable to sign in.";

            showLoginError(message);

            loginButton.disabled = false;

            loginButton.innerHTML = originalHTML;

        }

    });

}