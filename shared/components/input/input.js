import { ErrorMessage } from "../error/error.js";

function escapeAttr(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

}

export function Input({

    label = "",

    type = "text",

    placeholder = "",

    id = "",

    icon = "",

    rightIcon = "",

    errorId = "",

    readonly = false,

    hint = "",

    value = "",

    maxlength = ""

}) {

    return `

        <div class="input-group">

            <label
                class="input-label"
                for="${id}"
            >

                ${label}

            </label>

            <div class="input-wrapper">

                ${
                    icon
                        ? `
                            <span class="input-icon">

                                ${icon}

                            </span>
                        `
                        : ""
                }

                <input

                    id="${id}"

                    type="${type}"

                    class="input"

                    placeholder="${placeholder}"

                    autocomplete="off"

                    ${value ? `value="${escapeAttr(value)}"` : ""}

                    ${maxlength ? `maxlength="${maxlength}"` : ""}

                    ${readonly ? "readonly" : ""}

                >

                ${
                    rightIcon
                        ? `
                            <button
                                type="button"
                                class="input-action"
                                data-toggle="${id}"
                                aria-label="Toggle Password"
                            >

                                ${rightIcon}

                            </button>
                        `
                        : ""
                }

            </div>

            ${hint ? `<p class="input-hint">${hint}</p>` : ""}

            ${ErrorMessage({

                id: errorId,

                message: ""

            })}

        </div>

    `;

}