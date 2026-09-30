export function Link(options = {}) {

    const {
        text = "",
        id = "",
        href = "#"
    } = options;

    return `
        <a
            id="${id}"
            href="${href}"
            class="link"
        >
            ${text}
        </a>
    `;

}