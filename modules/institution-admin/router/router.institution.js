/* =========================================
   Institution Admin Sub-Router
   -----------------------------------------
   Renders module content into the shell's
   workspace element without re-rendering the
   shell chrome (top bar / drawer / bottom
   nav stay mounted). Each module is lazy
   loaded via dynamic import the first time
   it's visited, then cached in memory.

   This is the Institution Admin counterpart
   of modules/super-admin/router/router.super.js.
   Same contract, same lifecycle, same
   navigation-guard behavior — only the
   namespace and the registered modules
   differ. When an Institution Admin shell
   controller exists, it calls
   initInstitutionAdminRouter() the exact same
   way shell.controller.js calls
   initSuperAdminRouter() today.

   Routes handled here:
     /institution-admin            -> redirects to Dashboard
     /institution-admin/dashboard  -> Dashboard module
========================================= */

import { getModule } from "./modules.registry.js";

import {
    parseHashRoute,
    getNavigationState
} from "../../../shared/core/navigation/index.js";

import { authorize } from "../../../shared/services/permission.service.js";

import { MODULE_PERMISSIONS } from "../../../shared/constants/permissions.js";

// Namespaced NavigationState for this shell. Additive only —
// mirrors router.super.js's SHELL_NAMESPACE so a future
// Institution Admin shell controller's onNavigate callback
// works identically, and so nothing here collides with the
// Super Admin shell's own namespaced state.
const SHELL_NAMESPACE = "institution-admin";
const navigationState = getNavigationState(SHELL_NAMESPACE);

// Default module /institution-admin (no sub-route) redirects to.
const DEFAULT_MODULE_ID = "dashboard";

// id -> dynamic import() returning { render, destroy? }
// Only Dashboard is wired up today. Add one line here per
// future module (Admissions, Attendance, Academics, Fee
// Management, ...) — no other change required in this file.
const LOADERS = {
    dashboard: () => import("../dashboard/dashboard.page.js"),
    profile: () => import("../profile/profile.page.js")
};

// id -> already-imported module (avoids duplicate
// dynamic-import network/parse cost on revisits)
const moduleCache = new Map();

let workspaceEl = null;
let activeModuleId = null;
let activeDestroy = null;
let onNavigateCallback = null;
let initialized = false;

// Phase C / R1 — threaded in from shell.controller.js's
// renderWorkspace(). Phase C / R3 — now actually read, by
// isModuleAuthorized() below, before a "ready" module renders.
let currentUserProfile = null;

// A module (e.g. a form mid-edit) can register a function here
// that gets asked "is it OK to navigate away?" before every
// module switch. Returning false blocks the navigation and
// reverts the URL hash. Only one guard is ever active — the
// currently mounted module owns it, and clears it on teardown.
// Mirrors router.super.js's navigation guard.
let navigationGuard = null;

export function setNavigationGuard(fn) {

    navigationGuard = typeof fn === "function" ? fn : null;

}

export function initInstitutionAdminRouter(workspaceElement, { onNavigate, userProfile } = {}) {

    if (initialized) return;

    initialized = true;

    workspaceEl = workspaceElement;
    onNavigateCallback = onNavigate || null;
    currentUserProfile = userProfile || null;

    window.addEventListener("hashchange", handleHashChange);

    // /institution-admin with no sub-route (or an unrecognized
    // one) redirects to Dashboard.
    const initialModule = parseHash() || DEFAULT_MODULE_ID;

    navigateToModule(initialModule);

}

export function destroyInstitutionAdminRouter() {

    if (!initialized) return;

    window.removeEventListener("hashchange", handleHashChange);

    teardownActiveModule();

    workspaceEl = null;
    activeModuleId = null;
    onNavigateCallback = null;
    currentUserProfile = null;
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
        console.error("[CampusOne] Institution Admin router workspace missing.");
        return;
    }

    if (!definition) {

        // Unknown/unregistered module id (including a stale or
        // hand-typed hash) — fall back to Dashboard rather than
        // dead-ending the user, consistent with "/institution-admin
        // redirects to Dashboard".
        console.error(`[CampusOne] Unknown Institution Admin module "${id}".`);

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
                window.location.hash = `/institution-admin/${activeModuleId}`;
            }

            return;

        }

    }

    window.location.hash = `/institution-admin/${id}`;

    teardownActiveModule();

    activeModuleId = id;

    navigationState.setActive(id);

    onNavigateCallback?.(id);

    if (definition.status !== "ready") {

        renderComingSoon(definition);

        return;

    }

    // Phase C / R3 — consult the permission engine before a "ready"
    // module actually renders, instead of relying solely on the shell
    // guard's one-time Dashboard check at shell entry. Same
    // redirect-to-Dashboard idiom as the unknown-module fallback
    // above, so an unauthorized module is never rendered — not even
    // briefly — and the hash/activeModuleId end up correctly pointing
    // at Dashboard once navigateToModule() re-runs for it.
    if (!isModuleAuthorized(id)) {

        console.error(`[CampusOne] Institution Admin "${id}" blocked — user lacks permission.`);

        if (id !== DEFAULT_MODULE_ID) {
            navigateToModule(DEFAULT_MODULE_ID, params);
        }

        return;

    }

    workspaceEl.innerHTML = `<div class="ia-skeleton-page" aria-busy="true"></div>`;

    try {

        const moduleExports = await loadModule(id);

        // Guard against a fast double-navigation where a
        // slower earlier import resolves after a newer one.
        if (activeModuleId !== id) return;

        activeDestroy = await moduleExports.render(workspaceEl, params);

    } catch (error) {

        console.error(`Failed to load Institution Admin module "${id}":`, error);

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

// Phase C / R3 — only module ids that are actually part of
// MODULE_PERMISSIONS are gated through authorize(). Ids like
// "profile" were never part of the delegable permission model
// and were never blocked before this phase — leaving them
// ungated here means they stay exactly as accessible as they
// always were, rather than this router silently inventing a new
// restriction permission.service.js was never asked to enforce.
function isModuleAuthorized(id) {

    if (!Object.values(MODULE_PERMISSIONS).includes(id)) return true;

    return authorize(currentUserProfile, id);

}

// Deliberately dependency-free (no shared/UI component import)
// so this routing foundation doesn't reach for UI pieces ahead
// of the Institution Admin shell being designed. Swap these two
// renderers out for the shell's own EmptyState component once
// it exists — same spot router.super.js uses one today.
function renderComingSoon(definition) {

    workspaceEl.innerHTML = `
        <div class="ia-empty-state" data-state="coming-soon">
            <h3>${definition.label} is coming soon</h3>
            <p>This module is on the build roadmap and isn't wired up yet.</p>
        </div>
    `;

}

function renderLoadError(id) {

    workspaceEl.innerHTML = `
        <div class="ia-empty-state" data-state="error">
            <h3>This section couldn't load</h3>
            <p>Check your connection and try again.</p>
            <button id="iaRetryModule" type="button">Retry</button>
        </div>
    `;

    workspaceEl.querySelector("#iaRetryModule")
        ?.addEventListener("click", () => navigateToModule(id));

}

export function getActiveModuleId() {

    return activeModuleId;

}

export function isRouterReady() {

    return initialized;

}
