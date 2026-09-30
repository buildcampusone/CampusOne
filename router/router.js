import { getSuperAdminTheme } from "../shared/utils/theme.js";

const routes = {};

/* ==========================================================
   Register Route
========================================================== */

export function registerRoute(name, page) {

    routes[name] = page;

}

/* ==========================================================
   Navigate
========================================================== */

export function navigate(name) {

    const app = document.getElementById("app");

    if (!app) {

        console.error("App container not found.");
        return;

    }

    const page = routes[name];

    if (!page) {

        console.error(`Route not found: ${name}`);
        return;

    }

    /* ------------------------------------------------------
       Theme
    ------------------------------------------------------ */

    if (name === "super-admin") {

        // Was hard-coded to "dark". Now reads the user's
        // Profile > Appearance choice (localStorage), but
        // still defaults to dark, so existing behavior is
        // unchanged unless someone actually flips the toggle.
        document.body.dataset.theme = getSuperAdminTheme();

    } else {

        delete document.body.dataset.theme;

    }

    /* ------------------------------------------------------
       Render Page
    ------------------------------------------------------ */

    app.innerHTML = page();

    /* ------------------------------------------------------
       Super Admin Login
    ------------------------------------------------------ */

    if (name === "super-admin-login") {

        import("../modules/super-admin/login/login.controller.js")
            .then(({ initSuperAdminLogin }) => {

                initSuperAdminLogin();

            });

        return;

    }

    /* ------------------------------------------------------
       Super Admin Shell
    ------------------------------------------------------ */

    if (name === "super-admin") {

        import("../modules/super-admin/shell/shell.controller.js")
            .then(({ initSuperAdminShell }) => {

                initSuperAdminShell();

            });

        return;

    }

    /* ------------------------------------------------------
       Institution Admin Shell
    ------------------------------------------------------ */

    if (name === "institution-admin") {

        import("../modules/institution-admin/shell/shell.controller.js")
            .then(({ initInstitutionAdminShell }) => {

                initInstitutionAdminShell();

            });

        return;

    }

    /* ------------------------------------------------------
       Institution Owner Shell
    ------------------------------------------------------ */

    if (name === "institution-owner") {

        import("../modules/institution-owner/shell/shell.controller.js")
            .then(({ initInstitutionOwnerShell }) => {

                initInstitutionOwnerShell();

            });

        return;

    }

    /* ------------------------------------------------------
       Login
    ------------------------------------------------------ */

    if (name === "login") {

        import("../shared/services/time.service.js")
            .then(({ startLiveClock }) => {

                startLiveClock();

            });

        import("../modules/auth/login/login.controller.js")
            .then(({ initLogin }) => {

                initLogin();

            });

        return;

    }

    /* ------------------------------------------------------
       Register
    ------------------------------------------------------ */

    if (name === "register") {

        import("../modules/auth/register/register.controller.js")
            .then(({ initRegister }) => {

                initRegister();

            });

        return;

    }

    /* ------------------------------------------------------
       Register Institution
    ------------------------------------------------------ */

    if (name === "register-institution") {

        import("../modules/institution/registration/registration.controller.js")
            .then(({ initRegisterInstitution }) => {

                initRegisterInstitution();

            });

    }

}