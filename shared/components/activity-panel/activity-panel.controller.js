/**
 * ==========================================================
 * CampusOne
 * Shared Activity Panel — Controller Factory
 * ----------------------------------------------------------
 * The ONE piece of rendering plumbing every role's Activity
 * Panel is built from. A role's own activity-panel.controller.js
 * (see modules/institution-admin/activity-panel/ and, going
 * forward, any other role) is now a thin wrapper: call
 * createActivityPanel() with that role's feed id and card
 * class name, supply its own card data, and call render() —
 * exactly the same "component wraps engine" convention
 * shared/components/sidebar/sidebar.controller.js and
 * shared/components/topbar/topbar.controller.js already
 * established.
 *
 * What lives here (shared, never duplicated):
 *   - Wiring to the reusable rendering engine
 *     (shared/core/activity/activity-panel.engine.js): mount,
 *     render(cards), clear, destroy.
 *
 * What deliberately stays OUT of this file (role-specific glue,
 * owned by each role's own thin controller):
 *   - What a card's title/description says — supplied as data
 *     by the caller, this file never hardcodes any card
 *     content.
 *   - Where that data comes from (today: a static literal in
 *     each role's controller; later: a real feed/analytics
 *     service) — fetching or computing activity data is not
 *     this file's or the engine's concern.
 *   - CSS class names — passed in as config so each role's
 *     existing card styling (sa-/ia-/io-activity-card) is
 *     preserved, never replaced by a shared class.
 * ==========================================================
 */

import { createActivityPanelEngine } from "../../core/activity/index.js";

/**
 * @param {object} options
 * @param {string} [options.feedId] - id of the feed outlet element (e.g. "activityFeed").
 * @param {string} options.cardClassName - CSS class applied to each rendered card (role-namespaced).
 * @returns {{
 *   init: () => void,
 *   destroy: () => void,
 *   renderCards: (cards: Array<{ title: string, description: string|string[] }>) => void,
 *   clear: () => void
 * }}
 */
export function createActivityPanel(options) {

    const state = {
        initialized: false,
        engine: null
    };

    function init() {

        if (state.initialized) destroy();

        state.engine = createActivityPanelEngine(options).init();

        state.initialized = true;

    }

    function destroy() {

        if (!state.initialized) return;

        state.engine?.destroy();

        state.initialized = false;
        state.engine = null;

    }

    function renderCards(cards) {

        state.engine?.renderCards(cards);

    }

    function clear() {

        state.engine?.clear();

    }

    return { init, destroy, renderCards, clear };

}
