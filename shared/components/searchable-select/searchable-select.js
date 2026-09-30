/**
 * ==========================================================
 * CampusOne
 * Searchable Select
 * ----------------------------------------------------------
 * A lightweight, dependency-free "combobox": a text input
 * that filters a list of options as the user types, plus a
 * hidden input carrying the actual selected value. Used for
 * long option lists (e.g. Country) where a native <select>
 * is too slow to scan.
 *
 * Usage:
 *   1. Inject SearchableSelect({ id, label, placeholder }) HTML
 *      wherever you render the form.
 *   2. After the markup is in the DOM, call
 *      initSearchableSelect(id, options, { value, onChange })
 *      to wire up behavior. Returns a controller with
 *      { setOptions, setValue, getValue, destroy }.
 * ==========================================================
 */

export function SearchableSelect({
    id = "",
    label = "",
    placeholder = "Search...",
    hint = ""
}) {

    return /* html */ `

        <div class="input-group sa-searchable-select" id="${id}Group">

            <label class="input-label" for="${id}Input">${label}</label>

            <div class="sa-searchable-select-wrap">

                <div class="input-wrapper">
                    <input
                        id="${id}Input"
                        type="text"
                        class="input"
                        placeholder="${placeholder}"
                        autocomplete="off"
                        role="combobox"
                        aria-expanded="false"
                        aria-controls="${id}List"
                    >
                </div>

                <input type="hidden" id="${id}Value">

                <ul
                    id="${id}List"
                    class="sa-searchable-select-list"
                    role="listbox"
                    hidden
                ></ul>

            </div>

            ${hint ? `<p class="input-hint">${hint}</p>` : ""}

        </div>

    `;

}

export function initSearchableSelect(id, options = [], { value = "", disabled = false, onChange } = {}) {

    const input = document.getElementById(`${id}Input`);
    const hiddenInput = document.getElementById(`${id}Value`);
    const list = document.getElementById(`${id}List`);

    if (!input || !hiddenInput || !list) return null;

    let currentOptions = [...options];
    let isOpen = false;

    function renderList(filterText = "") {

        const query = filterText.trim().toLowerCase();

        const filtered = query
            ? currentOptions.filter((opt) => opt.toLowerCase().includes(query))
            : currentOptions;

        list.innerHTML = filtered.length
            ? filtered.map((opt) => /* html */ `
                <li role="option" data-value="${escapeAttr(opt)}" class="${opt === hiddenInput.value ? "is-selected" : ""}">
                    ${opt}
                </li>
              `).join("")
            : `<li class="sa-searchable-select-empty">No matches found</li>`;

    }

    function openList() {

        if (disabled) return;

        isOpen = true;
        list.hidden = false;
        input.setAttribute("aria-expanded", "true");

    }

    function closeList() {

        isOpen = false;
        list.hidden = true;
        input.setAttribute("aria-expanded", "false");

    }

    function selectValue(val) {

        hiddenInput.value = val;
        input.value = val;

        closeList();

        onChange?.(val);

    }

    function setValue(val) {

        hiddenInput.value = val || "";
        input.value = val || "";

    }

    function setOptions(nextOptions) {

        currentOptions = [...nextOptions];

    }

    const onInput = () => {

        renderList(input.value);
        openList();

        // Typing clears an existing exact selection until a
        // new option is explicitly chosen from the list.
        if (input.value !== hiddenInput.value) {
            hiddenInput.value = "";
        }

    };

    const onFocus = () => {

        renderList(input.value);
        openList();

    };

    const onListClick = (event) => {

        const item = event.target.closest("li[data-value]");

        if (!item) return;

        selectValue(item.dataset.value);

    };

    const onDocumentClick = (event) => {

        if (!isOpen) return;

        const wrap = input.closest(".sa-searchable-select-wrap");

        if (wrap && !wrap.contains(event.target)) {
            closeList();
        }

    };

    const onKeydown = (event) => {

        if (event.key === "Escape") {
            closeList();
        }

    };

    // If the field loses focus without an option being picked
    // (typed a partial query, then clicked away), snap the
    // visible text back to the last confirmed selection rather
    // than silently leaving a half-typed, unselected value.
    const onBlur = () => {

        setTimeout(() => {

            if (input.value !== hiddenInput.value) {
                input.value = hiddenInput.value;
            }

        }, 150);

    };

    input.addEventListener("input", onInput);
    input.addEventListener("focus", onFocus);
    input.addEventListener("blur", onBlur);
    list.addEventListener("click", onListClick);
    document.addEventListener("click", onDocumentClick, true);
    input.addEventListener("keydown", onKeydown);

    if (disabled) {
        input.setAttribute("disabled", "true");
    }

    setValue(value);

    return {

        setOptions,

        setValue,

        getValue: () => hiddenInput.value,

        destroy() {

            input.removeEventListener("input", onInput);
            input.removeEventListener("focus", onFocus);
            input.removeEventListener("blur", onBlur);
            list.removeEventListener("click", onListClick);
            document.removeEventListener("click", onDocumentClick, true);
            input.removeEventListener("keydown", onKeydown);

        }

    };

}

function escapeAttr(value) {

    return String(value).replace(/"/g, "&quot;");

}
