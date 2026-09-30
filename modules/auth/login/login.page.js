import { Background } from "../../../shared/components/background/background.js";
import { Button } from "../../../shared/components/button/button.js";
import { Input } from "../../../shared/components/input/input.js";
import { Link } from "../../../shared/components/link/link.js";

import {

    BuildingIcon,

    MailIcon,

    LockIcon,

    EyeIcon,

    GoogleIcon

} from "../../../shared/components/icons/index.js";


export function LoginPage() {

    return `

        ${Background()}

        <section class="login">

            <div class="login-hero">

                <img
                id="campusoneLogo"
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

                <div class="hero-time">

                    <p
                        id="liveTime"
                        class="live-time"
                    >

                        --:--

                    </p>

                    <p
                        id="liveDate"
                        class="live-date"
                    >

                        Loading...

                    </p>

                </div>

                <div class="hero-greeting">

                    <h2
                        id="greeting"
                        class="live-greeting"
                    >

                        Welcome

                    </h2>

                    <p class="hero-subtitle">

                        Welcome back to CampusOne.

                    </p>

                </div>

            </div>

<div class="auth-card">

    ${Input({

        label: "Institution Code",

        id: "institution",

        placeholder: "Enter institution code",

        icon: BuildingIcon(),

        errorId: "institutionError"

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

        placeholder: "Enter your password",

        icon: LockIcon(),

        rightIcon: EyeIcon(),

        errorId: "passwordError"

    })}

    <div class="login-options">

        <label class="remember-me">

            <input
                type="checkbox"
                id="rememberMe"
            >

            <span>Remember Me</span>

        </label>

        ${Link({

            text: "Forgot Password?",

            id: "forgotPassword"

        })}

    </div>

${Button({

    text: "Continue",

    id: "loginButton",

    type: "button",

    variant: "primary"

})}

<div class="login-divider">

    <span>OR</span>

</div>

${Button({

    text: "Continue with Google",

    id: "googleLogin",

    type: "button",

    variant: "secondary",

    icon: GoogleIcon()

})}

<div class="login-register">

    <p class="register-text">

        Don't have an account?

    </p>

    ${Link({

        text: "Create Account",

        id: "createAccount"

    })}

</div>

<div class="institution-register">

    <p class="institution-text">

        Need to onboard your institution?

    </p>

    ${Link({

        text: "Register Your Institution →",

        id: "registerInstitution"

    })}

</div>

</div>

</section>

`;
}
