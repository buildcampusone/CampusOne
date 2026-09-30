/**
 * ==========================================================
 * CampusOne
 * Active Class Switching — Shared Utility
 * ----------------------------------------------------------
 * Part 2.1: Active Navigation State — Foundation
 *
 * Generic "paint active state onto elements" helper. Factored
 * out as its own file, separate from bottom-nav.engine.js's
 * internal setActive() (Part 1), so it isn't bottom-nav
 * specific — any future surface (a sidebar, a tab bar in
 * another shell) can reuse the exact same class/aria-current
 * pairing instead of re-writing it.
 *
 * Deliberately has zero knowledge of routes, tabs, or engines
 * — it only takes elements + an id and paints them. Safe to
 * call as often as you like; each call is a full repaint.
 * ==========================================================
 */

const DEFAULTS = {
    activeClass: "is-active",
    ariaCurrentValue: "page"
};

/**
 * @param {Iterable<{ id: string, el: HTMLElement }>} entries
 * @param {string|null} activeId
 * @param {{ activeClass?: string, ariaCurrentValue?: string }} [options]
 */
export function paintActiveTab(entries, activeId, options = {}) {

    const config = { ...DEFAULTS, ...options };

    for (const { id, el } of entries) {

        if (!el) continue;

        const isActive = activeId !== null && id === activeId;

        el.classList.toggle(config.activeClass, isActive);

        el.setAttribute("aria-current", isActive ? config.ariaCurrentValue : "false");

    }

}
