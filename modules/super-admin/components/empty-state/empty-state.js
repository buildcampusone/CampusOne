/**
 * ==========================================================
 * CampusOne
 * Super Admin — Empty State Component
 * ----------------------------------------------------------
 * Shared placeholder view used by the Super Admin sub-router
 * (router.super.js) whenever a module:
 *   - is not built yet ("coming soon"), or
 *   - fails to lazy-load (network / import error).
 * ==========================================================
 */

export function EmptyState({

    title = "Nothing here yet",

    message = "",

    icon = "",

    actionLabel = "",

    actionId = ""

} = {}) {

    return /* html */ `

        <div class="sa-empty-state">

            <div class="sa-empty-state-icon">

                ${icon || defaultIcon()}

            </div>

            <h3 class="sa-empty-state-title">

                ${title}

            </h3>

            ${
                message
                    ? `
                        <p class="sa-empty-state-message">

                            ${message}

                        </p>
                    `
                    : ""
            }

            ${
                actionLabel
                    ? `
                        <button
                            id="${actionId}"
                            type="button"
                            class="sa-empty-state-action"
                        >

                            ${actionLabel}

                        </button>
                    `
                    : ""
            }

        </div>

    `;

}

/* ==========================================================
   Default Icon
========================================================== */

function defaultIcon() {

    return /* html */ `

        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
        >

            <rect
                x="3"
                y="7"
                width="18"
                height="13"
                rx="2"
            ></rect>

            <path
                d="M3 7L12 13L21 7"
            ></path>

        </svg>

    `;

}
