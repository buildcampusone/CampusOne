import { Background } from "../../../shared/components/background/background.js";
import { Button } from "../../../shared/components/button/button.js";
import { Input } from "../../../shared/components/input/input.js";

import {
    MailIcon,
    LockIcon,
    EyeIcon
} from "../../../shared/components/icons/index.js";

/* ==========================================================
   CampusOne
   Super Admin Login Page
========================================================== */

export function SuperAdminLoginPage() {

    return /* html */ `

        ${Background()}

        <section class="sa-login">

            <div class="sa-login-container">

                <div class="sa-login-card">

                    <header class="sa-header">

                        <img
                            id="campusoneLogo"
                            src="assets/logo/logo.png"
                            alt="CampusOne Super Admin Logo"
                            class="sa-logo"
                        >

                        <span class="sa-badge">

                            CAMPUSONE PLATFORM

                        </span>

                        <h1 class="sa-title">

                            Super Admin Portal

                        </h1>

                        <p class="sa-subtitle">

                            Enterprise platform for CampusOne operations.

                        </p>

                    </header>

                    <form
    id="superAdminLoginForm"
    autocomplete="off"
                        class="sa-form"
                        novalidate
                    >

                        ${Input({

                            label: "Email Address",

                            type: "email",

                            id: "adminEmail",

                            placeholder: "Enter your admin email",

                            icon: MailIcon(),

                            errorId: "adminEmailError"

                        })}

                        ${Input({

                            label: "Password",

                            type: "password",

                            id: "adminPassword",

                            placeholder: "Enter your password",

                            icon: LockIcon(),

                            rightIcon: EyeIcon(),

                            errorId: "adminPasswordError"

                        })}

                        <div class="sa-options">

<label
    class="sa-checkbox"
    for="rememberDevice"
>

                                <input
                                    id="rememberDevice"
                                    type="checkbox"
                                >

                                <span>

                                    Remember this device

                                </span>

                            </label>

                        </div>

                        ${Button({

                            text: "Secure Sign In",

                            id: "loginButton",

                            type: "submit",

                            variant: "primary"

                        })}

                    </form>

<footer class="sa-footer">

    <div class="sa-footer-top">

        <span class="sa-version">

            Version 1.0.0

        </span>

        <span class="sa-build">

            Build 001

        </span>

    </div>

    <div class="sa-footer-divider"></div>

    <p class="sa-security">

        Authorized CampusOne Team access only.

    </p>

</footer>

                </div>

            </div>

        </section>

        <div
            id="saLoginLoader"
            class="sa-loader"
            aria-hidden="true"
            role="status"
            aria-live="polite"
        >

            <div class="sa-loader-inner">

                <div class="sa-loader-ring">

                    <img
                        src="assets/logo/logo.png"
                        alt=""
                        class="sa-loader-logo"
                    >

                </div>

                <p
                    class="sa-loader-text"
                    id="saLoaderText"
                >
                    Authenticating...
                </p>

                <div class="sa-loader-progress">

                    <span></span>

                </div>

                <div
                    class="sa-loader-skeleton"
                    id="saLoaderSkeleton"
                >

                    <div class="sa-skel-topbar">

                        <div class="sa-skel shimmer sa-skel-avatar"></div>

                        <div class="sa-skel shimmer sa-skel-line w-40"></div>

                        <div class="sa-skel shimmer sa-skel-pill"></div>

                    </div>

                    <div class="sa-skel-body">

                        <div class="sa-skel-sidebar">

                            <div class="sa-skel shimmer sa-skel-line w-70"></div>
                            <div class="sa-skel shimmer sa-skel-line w-60"></div>
                            <div class="sa-skel shimmer sa-skel-line w-80"></div>
                            <div class="sa-skel shimmer sa-skel-line w-50"></div>
                            <div class="sa-skel shimmer sa-skel-line w-65"></div>

                        </div>

                        <div class="sa-skel-content">

                            <div class="sa-skel shimmer sa-skel-card"></div>

                            <div class="sa-skel-row">

                                <div class="sa-skel shimmer sa-skel-card sm"></div>
                                <div class="sa-skel shimmer sa-skel-card sm"></div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    `;

}