/**
 * ==========================================================
 * CampusOne
 * Shared Bottom Navigation — Markup (Phase 7)
 * ----------------------------------------------------------
 * The ONE Bottom Navigation component for the entire platform.
 * Every role (Platform Super Admin, Institution Admin, and any
 * future Institution Owner / Faculty / Student / Parent shell)
 * renders through this exact same function. Nothing here knows
 * about a specific role — only about a generic navigation item:
 *
 *   { id, label, icon, type, badge? }
 *
 *   id    -> matches a route id in that shell's router, or an
 *            action id the owning controller interprets itself.
 *   icon  -> a shared icon function, e.g. HomeIcon (see
 *            shared/components/icons/index.js). No emojis, no
 *            PNGs, no icon fonts.
 *   type  -> "route" or "action" (read by the shared engine,
 *            shared/core/navigation/bottom-nav.engine.js).
 *   badge -> optional boolean. Reserves a live badge slot
 *            (`#bottomNav<Id>Badge`) — future-ready only, not
 *            populated by this pass.
 *
 * Role differences live ENTIRELY in configuration (each role's
 * own bottom-nav.config.js), never in this file, its CSS
 * (bottom-nav.css), or the engine it's wired to. See
 * modules/super-admin/components/bottom-nav/ and
 * modules/institution-admin/components/bottom-nav/ for the two
 * current per-role configs + thin controller wrappers.
 *
 * Phase 1.4: added `.bn-ripple-layer`/`.bn-ripple`, `.bn-content`,
 * and `.bn-icon-wrap`/`.bn-wave` — purely structural, port of
 * Institution Owner's own bottom-nav.page.js layout (io-bottomnav-
 * ripple-layer/-content/-icon-wrap/-wave) so the shared Press/Wave/
 * Ripple engine (shared/core/navigation/bottom-nav-press.engine.js)
 * has elements to animate. `.bn-content` also carries the active-
 * lift that used to live directly on `.bn-icon`, so it can never
 * collide with press-scale on the same element (see bottom-nav.css).
 * ==========================================================
 */

/**
 * @param {Array<{id:string,label:string,icon:Function,type:"route"|"action",badge?:boolean}>} items
 *        Max 5 primary destinations per the platform brief.
 */
export function BottomNavPage(items) {

    return /* html */ `

        <div class="bn-pill">

            <span class="bn-indicator" aria-hidden="true"></span>

            ${items.map(renderItem).join("")}

        </div>

    `;

}

/* ==========================================================
   Nav Item
========================================================== */

function renderItem(item) {

    return /* html */ `

        <button
            type="button"
            class="bn-item"
            data-bottomnav-id="${item.id}"
            data-bottomnav-type="${item.type}"
            aria-label="${item.label}"
            aria-current="false"
        >

            <span class="bn-ripple-layer" aria-hidden="true">
                <span class="bn-ripple" aria-hidden="true"></span>
            </span>

            <span class="bn-content">

                <span class="bn-icon-wrap">

                    <span class="bn-wave" aria-hidden="true"></span>

                    <span class="bn-icon" aria-hidden="true">

                        ${item.icon()}

                        ${item.badge ? /* html */ `
                            <span
                                id="bottomNav${capitalize(item.id)}Badge"
                                class="bn-badge"
                                hidden
                            ></span>
                        ` : ""}

                    </span>

                </span>

                <span class="bn-label">

                    ${item.label}

                </span>

            </span>

        </button>

    `;

}

function capitalize(id) {

    return id
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("");

}
