import { Background } from "../../../shared/components/background/background.js";
import { Button } from "../../../shared/components/button/button.js";
import { Input } from "../../../shared/components/input/input.js";
import { Link } from "../../../shared/components/link/link.js";

import {

    BuildingIcon,

    UserIcon,

    MailIcon,

    LockIcon,

    EyeIcon,

    GoogleIcon

} from "../../../shared/components/icons/index.js";


export function RegisterPage() {

    return `

        ${Background()}

        <section class="login">

            <div class="login-hero">

                <img
                    src="assets/logo/logo.png"
                    alt="CampusOne Logo"
                    class="login-logo"
                >

                <h1 class="login-title">

                    CampusOne

                </h1>

                <p class="login-tagline">

                    One Platform. Every Institution.

                </p>

                <div class="hero-greeting">

                    <h2 class="live-greeting">

                        Create Account

                    </h2>

                    <p class="hero-subtitle">

                        Join CampusOne and get started with your institution.

                    </p>

                </div>

            </div>

            <div class="auth-card">

                <div id="registerForm">

                    ${Input({

                        label: "Institution Code",

                        id: "institution",

                        placeholder: "Enter institution code",

                        icon: BuildingIcon(),

                        errorId: "institutionError"

                    })}

                    ${Input({

                        label: "Full Name",

                        id: "name",

                        placeholder: "Enter your full name",

                        icon: UserIcon(),

                        errorId: "nameError"

                    })}

                    ${Input({

                        label: "Email Address",

                        type: "email",

                        id: "email",

                        placeholder: "Enter your email",

                        icon: MailIcon(),

                        errorId: "emailError"

                    })}

                    ${Input({

                        label: "Password",

                        type: "password",

                        id: "password",

                        placeholder: "Create a password",

                        icon: LockIcon(),

                        rightIcon: EyeIcon(),

                        errorId: "passwordError"

                    })}

                    ${Input({

                        label: "Confirm Password",

                        type: "password",

                        id: "confirmPassword",

                        placeholder: "Re-enter your password",

                        icon: LockIcon(),

                        rightIcon: EyeIcon(),

                        errorId: "confirmPasswordError"

                    })}

                    ${Button({

                        text: "Create Account",

                        id: "createAccountButton",

                        type: "button",

                        variant: "primary"

                    })}

                    <div class="login-divider">

                        <span>OR</span>

                    </div>

                    ${Button({

                        text: "Continue with Google",

                        id: "googleRegister",

                        type: "button",

                        variant: "secondary",

                        icon: GoogleIcon()

                    })}

                    <div class="login-register">

                        <p class="register-text">

                            Already have an account?

                        </p>

                        ${Link({

                            text: "Sign In",

                            id: "signInLink"

                        })}

                    </div>

                </div>

                <div
                    id="registerSuccess"
                    class="register-success"
                    style="display:none;"
                >

                    <p class="register-success-title">

                        🎉 Account Created

                    </p>

                    <p class="register-success-text">

                        We've sent a verification email.
                        Please verify your email before signing in.

                    </p>

                    ${Button({

                        text: "Go to Login",

                        id: "goToLoginButton",

                        type: "button",

                        variant: "primary"

                    })}

                </div>

            </div>

        </section>

    `;

}
