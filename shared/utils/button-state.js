/**
 * ==========================================================
 * CampusOne
 * Button State Helper
 * ----------------------------------------------------------
 * The same setButtonLoading()/resetButton() pair already lives,
 * reimplemented identically, inside login.controller.js,
 * register.controller.js, and forgot-password.controller.js.
 * A fourth consumer (Phase 5.1.2 Create Institution
 * Administrator) would make that a fourth copy, which crosses
 * the line from "small local helper" to a real
 * Reusable-over-Duplicate violation — so it's promoted here
 * instead. The three existing local copies are left as-is
 * (minimum files modified, no rewrite of working code without
 * explicit instruction); a future pass can point them at this
 * module without changing behavior.
 *
 * Toggles a submit button between its resting state and a
 * "processing" state: disabled, `.loading` class, swapped
 * `.btn-text`, and an injected `.btn-spinner` — the same three
 * things button.css already renders for, so no new CSS is
 * needed here.
 * ==========================================================
 */

export function setButtonLoading(button, text = "Please Wait...") {

    if (!button) return;

    button.disabled = true;

    button.classList.add("loading");

    const buttonText = button.querySelector(".btn-text");

    if (buttonText) {

        buttonText.textContent = text;

    }

    if (!button.querySelector(".btn-spinner")) {

        const spinner = document.createElement("span");

        spinner.className = "btn-spinner";

        button.appendChild(spinner);

    }

}

export function resetButton(button, text = "Submit") {

    if (!button) return;

    button.disabled = false;

    button.classList.remove("loading");

    const buttonText = button.querySelector(".btn-text");

    if (buttonText) {

        buttonText.textContent = text;

    }

    const spinner = button.querySelector(".btn-spinner");

    if (spinner) {

        spinner.remove();

    }

}
