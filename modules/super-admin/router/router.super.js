/* =========================================
   Super Admin Sub-Router
   -----------------------------------------
   Renders module content into the shell's
   workspace element without re-rendering the
   shell chrome (top bar / drawer / bottom
   nav stay mounted). Each module is lazy
   loaded via dynamic import the first time
   it's visited, then cached in memory.
========================================= */

import { getModule } from "./modules.registry.js";
import { EmptyState } from "../components/empty-state/empty-state.js";

import {
    parseHashRoute,
    getNavigationState
} from "../../../shared/core/navigation/index.js";

// Namespaced NavigationState for this shell. Additive only —
// shell.controller.js's existing onNavigate callback (below)
// still fires exactly as before; this just also lets a future
// nav surface (or the Institution Admin shell's own router)
// subscribe without router.super.js needing to know it exists.
const SHELL_NAMESPACE = "super-admin";
const navigationState = getNavigationState(SHELL_NAMESPACE);

// id -> dynamic import() returning { render, destroy? }
const LOADERS = {
    home: () => import("../dashboard/dashboard.page.js"),
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

// Phase 2C.4 — Navigation Guard
// A module (e.g. Profile, mid-edit) can register a function
// here that gets asked "is it OK to navigate away?" before
// every module switch. Returning false blocks the navigation
// and reverts the URL hash. Only one guard is ever active —
// the currently mounted module owns it, and clears it on
// teardown.
let navigationGuard = null;

export function setNavigationGuard(fn) {

    navigationGuard = typeof fn === "function" ? fn : null;

}

export function initSuperAdminRouter(workspaceElement, { onNavigate } = {}) {

    if (initialized) return;

    initialized = true;

    workspaceEl = workspaceElement;
    onNavigateCallback = onNavigate || null;

    window.addEventListener("hashchange", handleHashChange);

    const initialModule = parseHash() || "home";

    navigateToModule(initialModule);

}

export function destroySuperAdminRouter() {

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
        console.error("[CampusOne] Router workspace missing.");
        return;
    }

    if (!definition) {
        console.error(`[CampusOne] Unknown module "${id}".`);
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
                window.location.hash = `/super-admin/${activeModuleId}`;
            }

            return;

        }

    }

    window.location.hash = `/super-admin/${id}`;

    teardownActiveModule();

    activeModuleId = id;

    navigationState.setActive(id);

    onNavigateCallback?.(id);

    if (definition.status !== "ready") {

        renderComingSoon(definition);

        return;

    }

    workspaceEl.innerHTML = `<div class="sa-skeleton-page" aria-busy="true"></div>`;

    try {

        const moduleExports = await loadModule(id);

        // Guard against a fast double-navigation where a
        // slower earlier import resolves after a newer one.
        if (activeModuleId !== id) return;

        activeDestroy = await moduleExports.render(workspaceEl, params);

    } catch (error) {

        console.error(`Failed to load module "${id}":`, error);

        workspaceEl.innerHTML = EmptyState({
            title: "This section couldn't load",
            message: "Check your connection and try again.",
            actionLabel: "Retry",
            actionId: "saRetryModule"
        });

        workspaceEl.querySelector("#saRetryModule")
            ?.addEventListener("click", () => navigateToModule(id));

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

function renderComingSoon(definition) {

    workspaceEl.innerHTML = EmptyState({
        title: `${definition.label} is coming soon`,
        message: "This module is on the build roadmap and isn't wired up yet.",
        icon: definition.icon?.()
    });

}

export function getActiveModuleId() {

    return activeModuleId;

}

export function isRouterReady() {

    return initialized;

}
