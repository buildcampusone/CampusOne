import { registerRoute, navigate } from "./router/router.js";

import "./shared/core/ripple/ripple.service.js";

import { SplashScreen } from "./modules/splash/splash.js";

import { LoginPage } from "./modules/auth/login/login.page.js";
import { RegisterPage } from "./modules/auth/register/register.page.js";
import { ForgotPasswordPage } from "./modules/auth/forgot-password/forgot-password.page.js";

import { RegisterInstitutionPage } from "./modules/institution/registration/registration.page.js";

import { SuperAdminLoginPage } from "./modules/super-admin/login/login.page.js";
import { SuperAdminShellPage } from "./modules/super-admin/shell/shell.page.js";

import { InstitutionAdminShellPage } from "./modules/institution-admin/shell/shell.page.js";

import { InstitutionOwnerShellPage } from "./modules/institution-owner/shell/shell.page.js";

import { runBootstrap } from "./shared/core/bootstrap/bootstrap.manager.js";

/* ==========================================================
   Public Routes
   ========================================================== */

registerRoute("splash", SplashScreen);

registerRoute("login", LoginPage);

registerRoute("register", RegisterPage);

registerRoute("forgot-password", ForgotPasswordPage);

registerRoute(
    "register-institution",
    RegisterInstitutionPage
);

/* ==========================================================
   Super Admin Routes
   ========================================================== */

registerRoute(
    "super-admin-login",
    SuperAdminLoginPage
);

registerRoute(
    "super-admin",
    SuperAdminShellPage
);

/* ==========================================================
   Institution Admin Routes
   ========================================================== */

registerRoute(
    "institution-admin",
    InstitutionAdminShellPage
);

/* ==========================================================
   Institution Owner Routes
   ========================================================== */

registerRoute(
    "institution-owner",
    InstitutionOwnerShellPage
);

/* ==========================================================
   App Bootstrap
   ----------------------------------------------------------
   Splash stays up until the Firebase session has actually
   finished restoring (runBootstrap() resolves once
   session.roleResolved is true) — never on a fixed timer.
   That single resolved value decides the ONE initial
   navigate() call for the whole app: "login" for a signed-out
   visitor, "super-admin" for a restored Platform Super Admin
   session, etc. (see bootstrap.manager.js's
   resolveInitialRoute()).

   A short minimum splash time keeps the logo from flashing
   for a single frame on a warm/instant session restore, but
   never adds a fixed delay beyond however long Firebase
   actually needs — the two run in parallel and whichever
   finishes last determines when navigate() fires.
   ========================================================== */

navigate("splash");

const MIN_SPLASH_MS = 600;

const minSplashDelay = new Promise((resolve) => {
    setTimeout(resolve, MIN_SPLASH_MS);
});

Promise.all([runBootstrap(), minSplashDelay]).then(([route]) => {

    navigate(route);

});