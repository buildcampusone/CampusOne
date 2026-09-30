export function ErrorMessage({

    id = "",

    message = ""

}) {

    return `

        <p
            id="${id}"
            class="error-message"
            role="alert"
        >

            ${message}

        </p>

    `;

}