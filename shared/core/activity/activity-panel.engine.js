/**
 * ==========================================================
 * CampusOne
 * Reusable Activity Panel Engine
 * ----------------------------------------------------------
 * The generic Activity Panel rendering logic — mount, render
 * cards into the feed outlet, and clear/destroy — factored out
 * of Institution Admin's activity-panel.controller.js (itself
 * a ~1:1 copy of Super Admin's) so every role's Activity Panel
 * can create its own instance instead of copy-pasting a static
 * `innerHTML` write.
 *
 * Unlike shared/core/navigation/sidebar.engine.js and
 * topbar-panel.engine.js, this is a RENDERING engine, not an
 * INTERACTION engine — there is no open/close, no keyboard
 * handling, no outside-click, no focus trap, because the
 * Activity Panel itself has none of that today (it's shown or
 * hidden purely by a CSS breakpoint, not a JS toggle). init()/
 * destroy() exist for lifecycle symmetry with the other two
 * engines, not because there's anything to unbind.
 *
 * This engine has NO opinion on what a card's title/description
 * says — that's role-owned data, passed in as a `cards` array
 * at render time. It only knows how to turn that data into
 * markup and write it into the feed outlet, using the
 * caller-supplied CSS class so each role's existing card
 * styling (sa-activity-card / ia-activity-card / etc.) is
 * preserved exactly, not replaced by a new shared class.
 *
 * In practice, every role should go through
 * shared/components/activity-panel/activity-panel.controller.js's
 * createActivityPanel() factory instead of calling this engine
 * directly — see that file.
 *
 * Usage:
 *
 *   const engine = createActivityPanelEngine({
 *       feedId: "activityFeed",
 *       cardClassName: "ia-activity-card"
 *   });
 *
 *   engine.init();
 *   engine.renderCards([
 *       { title: "System Ready", description: "CampusOne Institution Admin has been initialized successfully." }
 *   ]);
 *   engine.destroy();
 * ==========================================================
 */

const DEFAULTS = {
    feedId: "activityFeed"
};

/**
 * @param {object} options
 * @param {string} [options.feedId] - id of the feed outlet element (e.g. "activityFeed").
 * @param {string} options.cardClassName - CSS class applied to each rendered card (role-namespaced, e.g. "ia-activity-card").
 * @returns {{
 *   init: () => object,
 *   destroy: () => void,
 *   renderCards: (cards: Array<{ title: string, description: string|string[] }>) => void,
 *   clear: () => void
 * }}
 */
export function createActivityPanelEngine(options) {

    const config = { ...DEFAULTS, ...options };

    if (!config.cardClassName) {

        throw new Error("[ActivityPanelEngine] `cardClassName` is required.");

    }

    const state = {

        initialized: false,

        feedEl: null

    };

    /* ==========================================================
       Initialize
    ========================================================== */

    function init() {

        if (state.initialized) {

            destroy();

        }

        state.feedEl = document.getElementById(config.feedId);

        if (!state.feedEl) {

            console.error(`[CampusOne] Activity Panel feed (#${config.feedId}) not found.`);

            return api;

        }

        state.initialized = true;

        return api;

    }

    /* ==========================================================
       Destroy
       ----------------------------------------------------------
       Clears rendered content and resets cached state so a
       second init() call (e.g. shell remounted) starts clean
       instead of writing into a stale reference.
    ========================================================== */

    function destroy() {

        if (!state.initialized) return;

        if (state.feedEl) {

            state.feedEl.innerHTML = "";

        }

        state.feedEl = null;

        state.initialized = false;

    }

    /* ==========================================================
       Render
       ----------------------------------------------------------
       `cards` is plain data — { title, description } — owned
       entirely by the caller. `description` may be a single
       string (one paragraph, today's SA/IA shape) or an array
       of strings (multiple paragraphs, e.g. Owner's V1 card).
       This engine never fetches, computes, or interprets what
       the data means — it only turns it into markup.
    ========================================================== */

    function renderCards(cards = []) {

        if (!state.feedEl) return;

        if (!cards.length) {

            state.feedEl.innerHTML = "";

            return;

        }

        state.feedEl.innerHTML = cards.map(renderCard).join("");

    }

    function renderCard({ title = "", description = "" }) {

        const paragraphs = Array.isArray(description) ? description : [description];

        return /* html */ `

            <div class="${config.cardClassName}">

                ${title ? `<h3>${title}</h3>` : ""}

                ${paragraphs.map((text) => `<p>${text}</p>`).join("")}

            </div>

        `;

    }

    /* ==========================================================
       Clear
       ----------------------------------------------------------
       Empties the feed without tearing down the cached
       reference — useful for a future loading-state swap
       (clear -> show skeleton -> renderCards) without a full
       destroy()/init() cycle.
    ========================================================== */

    function clear() {

        if (!state.feedEl) return;

        state.feedEl.innerHTML = "";

    }

    const api = { init, destroy, renderCards, clear };

    return api;

}
