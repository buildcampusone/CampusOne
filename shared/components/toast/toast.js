/**
 * ==========================================================
 * CampusOne
 * Toast
 * ----------------------------------------------------------
 * Premium success/info/error toast used for confirmations
 * like "Changes Saved Successfully". Auto-dismisses after
 * `duration` ms, or on Done click. Singleton root — every
 * call re-uses the same container so toasts never stack up
 * oddly.
 * ==========================================================
 */

const ROOT_ID = "campusoneToastRoot";

const ICONS = {

    success: /* html */ `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6 9 17l-5-5"/>
        </svg>
    `,

    error: /* html */ `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
    `,

    info: /* html */ `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 16v-4M12 8h.01"/>
            <circle cx="12" cy="12" r="9"/>
        </svg>
    `

};

let closeTimer = null;

function getRoot() {

    let root = document.getElementById(ROOT_ID);

    if (!root) {

        root = document.createElement("div");
        root.id = ROOT_ID;
        root.className = "sa-toast-root";
        document.body.appendChild(root);

    }

    return root;

}

export function showToast({
    type = "success",
    title = "Success",
    message = "",
    duration = 3000
} = {}) {

    const root = getRoot();

    if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
    }

    root.innerHTML = /* html */ `

        <div class="sa-toast sa-toast-${type}" role="status" aria-live="polite">

            <div class="sa-toast-icon">
                ${ICONS[type] || ICONS.info}
            </div>

            <div class="sa-toast-body">
                <h4>${title}</h4>
                ${message ? `<p>${message}</p>` : ""}
            </div>

            <button type="button" class="sa-toast-done" id="campusoneToastDone">
                Done
            </button>

            <div class="sa-toast-progress">
                <span style="animation-duration:${duration}ms"></span>
            </div>

        </div>

    `;

    // Force reflow so the enter transition actually plays.
    const card = root.querySelector(".sa-toast");
    void card.offsetWidth;
    card.classList.add("is-visible");

    function close() {

        card.classList.remove("is-visible");
        card.classList.add("is-leaving");

        setTimeout(() => {
            root.innerHTML = "";
        }, 220);

    }

    document.getElementById("campusoneToastDone")
        ?.addEventListener("click", close);

    closeTimer = setTimeout(close, duration);

}
