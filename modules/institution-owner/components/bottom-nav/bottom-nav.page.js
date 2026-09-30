/**
 * ==========================================================
 * CampusOne
 * Institution Owner — Bottom Navigation Markup
 * ----------------------------------------------------------
 * Premium Mobile Bottom Navigation (UI-only pass).
 *
 * A full-width, solid Primary-Blue bar — deliberately its own
 * visual treatment (io-bottomnav-*) rather than the shared
 * floating glass pill Super Admin / Institution Admin use
 * (shared/components/bottom-nav/, "bn-*" classes). The two
 * still share everything that ISN'T pixels: same item shape
 * ({ id, label, icon, type, badge }), same click/active-state
 * engine (shared/core/navigation/bottom-nav.engine.js via
 * this module's own bottom-nav.controller.js), same icon
 * library, same design tokens (color, radius, motion) — only
 * the layout/skin differs, per this module's own brief.
 *
 * Role differences live ENTIRELY in configuration
 * (bottom-nav.config.js), never in this file or its CSS.
 *
 * Phase 2 adds one purely-structural element: .io-bottomnav-content,
 * grouping the icon and label into a single unit so the "lift"
 * active-state animation (bottom-nav.css) can move/scale both
 * together with nothing touching bottom-nav.controller.js.
 *
 * Sub-Phase 1.3C: fixed a markup gap the 1.3A parity pass
 * documented but deliberately didn't touch (Institution Owner
 * change, out of scope at the time). .io-bottomnav-ripple-layer
 * was an empty wrapper — the CSS (.io-bottomnav-ripple) and the
 * controller (positionRipple()/restartAnimation()) both already
 * expected a `.io-bottomnav-ripple` child to exist, so the
 * ripple circle silently never rendered; press/scale and the
 * wave glow were unaffected since they don't depend on this
 * element. One line added, no other markup, CSS, or controller
 * logic touched.
 * ==========================================================
 */

/**
 * @param {Array<{id:string,label:string,icon:Function,type:"route"|"action",badge?:boolean}>} items
 *        Exactly 5 primary destinations per the brief.
 */
export function BottomNavPage(items) {

    return /* html */ `

        <div class="io-bottomnav-bar">

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
            class="io-bottomnav-item"
            data-bottomnav-id="${item.id}"
            data-bottomnav-type="${item.type}"
            aria-label="${item.label}"
            aria-current="false"
        >

            <span class="io-bottomnav-ripple-layer" aria-hidden="true">
                <span class="io-bottomnav-ripple" aria-hidden="true"></span>
            </span>

            <span class="io-bottomnav-content">

                <span class="io-bottomnav-icon-wrap">

                    <span class="io-bottomnav-glow" aria-hidden="true"></span>
                    <span class="io-bottomnav-wave" aria-hidden="true"></span>

                    <span class="io-bottomnav-icon" aria-hidden="true">

                        ${item.icon()}

                        ${item.badge ? /* html */ `
                            <span
                                id="bottomNav${capitalize(item.id)}Badge"
                                class="io-bottomnav-badge"
                                hidden
                            ></span>
                        ` : ""}

                    </span>

                </span>

                <span class="io-bottomnav-label">

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
