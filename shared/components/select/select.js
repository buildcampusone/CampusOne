import { ErrorMessage } from "../error/error.js";

export function Select({
    label = "",
    id = "",
    icon = "",
    errorId = "",
    placeholder = "Select an option",
    options = [],
    hint = "",
    value = ""
}) {
    return `
        <div class="input-group">
            <label class="input-label" for="${id}">
                ${label}
            </label>
            <div class="input-wrapper">
                ${icon ? `<span class="input-icon">${icon}</span>` : ""}
                <select id="${id}" class="input select">
                    <option value="" ${value ? "" : "disabled selected"}>
                        ${placeholder}
                    </option>
                    ${options
                        .map(
                            (option) => `
                                <option value="${option.value}" ${option.value === value ? "selected" : ""}>
                                    ${option.label}
                                </option>
                            `
                        )
                        .join("")}
                </select>
            </div>
            ${hint ? `<p class="input-hint">${hint}</p>` : ""}
            ${ErrorMessage({ id: errorId, message: "" })}
        </div>
    `;
}
