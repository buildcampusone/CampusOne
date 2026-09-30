/* =========================================
   Institution Owner Sub-Router
   -----------------------------------------
   Renders module content into the shell's
   workspace element without re-rendering the
   shell chrome (top bar / sidebar / bottom
   nav stay mounted). Each module is lazy
   loaded via dynamic import the first time
   it's visited, then cached in memory.

   This is the Institution Owner counterpart
   of modules/institution-admin/router/
   router.institution.js (itself modeled on
   modules/super-admin/router/router.super.js).
   Same contract, same lifecycle, same
   navigation-guard behavior — only the
   namespace and the registered modules
   differ. shell.controller.js calls
   initInstitutionOwnerRouter() the exact same
   way Institution Admin's shell controller
   calls initInstitutionAdminRouter() today.

   Routes handled here:
     /institution-owner            -> redirects to Dashboard
     /institution-owner/dashboard  -> Dashboard module
     /institution-owner/<any other registered id>
                                    -> "Coming soon" empty
                                       state (status: "soon"
                                       in modules.registry.js) —
                                       same as Institution
                                       Admin's own non-ready
                                       entries. Routing only,
                                       no business logic.
========================================= */

import { getModule } from "./modules.registry.js";

import {
    parseHashRoute,
    getNavigationState
} from "../../../shared/core/navigation/index.js";

// Namespaced NavigationState for this shell. Additive only —
// mirrors router.institution.js's SHELL_NAMESPACE so this
// shell's own state never collides with Institution Admin's or
// Super Admin's.
const SHELL_NAMESPACE = "institution-owner";
const navigationState = getNavigationState(SHELL_NAMESPACE);

// Default module /institution-owner (no sub-route) redirects to.
const DEFAULT_MODULE_ID = "dashboard";

// id -> dynamic import() returning { render, destroy? }
// Dashboard, My Profile, Institution Profile, and (Phase 5.1.1)
// Users & Roles are wired up today. Add one line here per future
// module (Billing, Payments, Analytics, Security, Settings, ...)
// — no other change required in this file, mirroring how
// Institution Admin's own LOADERS grows.
const LOADERS = {
    dashboard: () => import("../dashboard/dashboard.page.js"),
    profile: () => import("../profile/profile.page.js"),
    "institution-profile": () => import("../institution-profile/institution-profile.page.js"),
    "users-roles": () => import("../admin-management/admin-management.page.js")
};

// id -> already-imported module (avoids duplicate
// dynamic-import network/parse cost on revisits)
const moduleCache = new Map();

let workspaceEl = null;
let activeModuleId = null;
let activeDestroy = null;
let onNavigateCallback = null;
let initialized = false;

// A module (e.g. a form mid-edit) can register a function here
// that gets asked "is it OK to navigate away?" before every
// module switch. Returning false blocks the navigation and
// reverts the URL hash. Only one guard is ever active — the
// currently mounted module owns it, and clears it on teardown.
// Mirrors router.institution.js's navigation guard.
let navigationGuard = null;

export function setNavigationGuard(fn) {

    navigationGuard = typeof fn === "function" ? fn : null;

}

export function initInstitutionOwnerRouter(workspaceElement, { onNavigate } = {}) {

    if (initialized) return;

    initialized = true;

    workspaceEl = workspaceElement;
    onNavigateCallback = onNavigate || null;

    window.addEventListener("hashchange", handleHashChange);

    // /institution-owner with no sub-route (or an unrecognized
    // one) redirects to Dashboard.
    const initialModule = parseHash() || DEFAULT_MODULE_ID;

    navigateToModule(initialModule);

}

export function destroyInstitutionOwnerRouter() {

    if (!initialized) return;

    window.removeEventListener("hashchange", handleHashChange);

    teardownActiveModule();

    workspaceEl = null;
    activeModuleId = null;
    onNavigateCallback = null;
    initialized = false;

    navigationState.reset();

}

function handleHashChange() {

    const id = parseHash();

    if (id && id !== activeModuleId) {

        navigateToModule(id);

    }

}

function parseHash() {

    return parseHashRoute(SHELL_NAMESPACE);

}

function teardownActiveModule() {

    if (typeof activeDestroy === "function") {

        try {

            activeDestroy();

        } catch (error) {

            console.error("Module cleanup failed:", error);

        }

    }

    activeDestroy = null;

    // Whatever module owned the guard is being torn down —
    // don't let a stale guard block the module that's about
    // to mount.
    navigationGuard = null;

}

export async function navigateToModule(id, params = {}) {

    const definition = getModule(id);

    if (!workspaceEl) {
        console.error("[CampusOne] Institution Owner router workspace missing.");
        return;
    }

    if (!definition) {

        // Unknown/unregistered module id (including a stale or
        // hand-typed hash) — fall back to Dashboard rather than
        // dead-ending the user, consistent with "/institution-owner
        // redirects to Dashboard".
        console.error(`[CampusOne] Unknown Institution Owner module "${id}".`);

        if (id !== DEFAULT_MODULE_ID) {
            navigateToModule(DEFAULT_MODULE_ID, params);
        }

        return;

    }

    // Ask the currently mounted module (if it registered a
    // guard) whether it's safe to leave. Only relevant when
    // actually switching away from a different module — not
    // on the very first navigation, and not when re-entering
    // the same module (e.g. tab deep-links).
    if (navigationGuard && activeModuleId && activeModuleId !== id) {

        const allowed = navigationGuard();

        if (!allowed) {

            // The hashchange listener may have already flipped
            // the URL before calling us — put it back so the
            // address bar matches what's actually on screen.
            if (parseHash() !== activeModuleId) {
                window.location.hash = `/institution-owner/${activeModuleId}`;
            }

            return;

        }

    }

    window.location.hash = `/institution-owner/${id}`;

    teardownActiveModule();

    activeModuleId = id;

    navigationState.setActive(id);

    onNavigateCallback?.(id);

    if (definition.status !== "ready") {

        renderComingSoon(definition);

        return;

    }

    workspaceEl.innerHTML = `<div class="io-skeleton-page" aria-busy="true"></div>`;

    try {

        const moduleExports = await loadModule(id);

        // Guard against a fast double-navigation where a
        // slower earlier import resolves after a newer one.
        if (activeModuleId !== id) return;

        activeDestroy = await moduleExports.render(workspaceEl, params);

    } catch (error) {

        console.error(`Failed to load Institution Owner module "${id}":`, error);

        renderLoadError(id);

    }

}

async function loadModule(id) {

    if (moduleCache.has(id)) {

        return moduleCache.get(id);

    }

    const loader = LOADERS[id];

    if (!loader) {
        throw new Error(`No loader registered for "${id}".`);
    }

    const moduleExports = await loader();

    if (typeof moduleExports.render !== "function") {
        throw new Error(`"${id}" module must export render().`);
    }

    moduleCache.set(id, moduleExports);

    return moduleExports;

}

// Deliberately dependency-free (no shared/UI component import)
// so this routing foundation doesn't reach for UI pieces ahead
// of schedule — same rationale as router.institution.js. Swap
// these two renderers out for the shell's own EmptyState
// component once it exists.
function renderComingSoon(definition) {

    workspaceEl.innerHTML = `
        <div class="io-empty-state" data-state="coming-soon">
            <h3>${definition.label} is coming soon</h3>
            <p>This module is on the build roadmap and isn't wired up yet.</p>
        </div>
    `;

}

function renderLoadError(id) {

    workspaceEl.innerHTML = `
        <div class="io-empty-state" data-state="error">
            <h3>This section couldn't load</h3>
            <p>Check your connection and try again.</p>
            <button id="ioRetryModule" type="button">Retry</button>
        </div>
    `;

    workspaceEl.querySelector("#ioRetryModule")
        ?.addEventListener("click", () => navigateToModule(id));

}

export function getActiveModuleId() {

    return activeModuleId;

}

export function isRouterReady() {

    return initialized;

}
