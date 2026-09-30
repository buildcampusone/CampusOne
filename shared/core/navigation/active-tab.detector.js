/**
 * ==========================================================
 * CampusOne
 * Active Tab Detection
 * ----------------------------------------------------------
 * Part 2.1: Active Navigation State — Foundation
 *
 * Resolves "which tab should be active" from two possible
 * sources, in priority order:
 *
 *   1. An ephemeral override — an action-kind tab (Alerts,
 *      Activity) whose panel/sheet is currently open. Action
 *      tabs never appear in the route, so they can only ever
 *      become active this way.
 *
 *   2. The current route id — for route-kind tabs (Dashboard,
 *      Institutions, Profile), read via a caller-supplied
 *      value so this file never imports a specific router,
 *      matching the pattern active-route.detector.js (Part 1)
 *      already uses.
 *
 * Pure function, no DOM, no router import, no side effects —
 * trivially testable and reusable by any future shell that
 * adopts the tab registry.
 * ==========================================================
 */

import { getTabKind, isKnownTabId } from "./tab-registry.js";

/**
 * @param {object} params
 * @param {string|null} [params.routeId] - currently active route id (e.g. from getActiveModuleId()).
 * @param {string|null} [params.ephemeralActiveId] - an action-kind tab currently "open" (e.g. "activity" while its sheet is open), or null.
 * @param {string} [params.namespace] - which role's tab registry to resolve ids against. Omitted -> the legacy
 *   global registry (see tab-registry.js's getNamespaceTabs() fallback), so any pre-1.3C caller behaves identically.
 * @returns {string|null} the tab id that should be marked active, or null if none applies.
 */
export function detectActiveTab({ routeId = null, ephemeralActiveId = null, namespace } = {}) {

    if (ephemeralActiveId && isKnownTabId(ephemeralActiveId, namespace) && getTabKind(ephemeralActiveId, namespace) === "action") {

        return ephemeralActiveId;

    }

    if (routeId && isKnownTabId(routeId, namespace) && getTabKind(routeId, namespace) === "route") {

        return routeId;

    }

    return null;

}
