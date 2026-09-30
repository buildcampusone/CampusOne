export function Button(options = {}) {

    const {

        text = "Button",

        type = "button",

        variant = "primary",

        id = "",

        icon = "",

        disabled = false,

        loading = false

    } = options;

    return `

        <button

            id="${id}"

            type="${type}"

            class="btn btn-${variant} co-ripple-surface"

            ${disabled ? "disabled" : ""}

        >

            ${
                icon && !loading
                    ? `
                        <span class="btn-icon">

                            ${icon}

                        </span>
                    `
                    : ""
            }

            <span class="btn-text">

                ${loading ? "Signing In..." : text}

            </span>

            ${
                loading
                    ? `
                        <span class="btn-spinner"></span>
                    `
                    : ""
            }

        </button>

    `;

}