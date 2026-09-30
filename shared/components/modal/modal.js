/**
 * ==========================================================
 * CampusOne
 * Modal
 * ----------------------------------------------------------
 * The shared "premium SaaS modal" shell. Nothing in the
 * codebase built this before Phase 5.1.2 — but variables.css
 * already reserves --z-modal/--duration-modal, and motion.css
 * already ships a `.co-modal-in` entrance keyframe with a
 * comment saying they're "ready the moment one is [built]".
 * This is that component: it consumes those tokens rather than
 * inventing new ones.
 *
 * Deliberately generic — knows nothing about forms, admins, or
 * any specific feature. A caller hands it a title/subtitle and
 * two HTML strings (body + footer); everything domain-specific
 * (validation, submission, confirmation) stays in the feature's
 * own controller. This is what lets Phase 5.1.2 Part 2 wire a
 * real backend without touching this file, and lets any later
 * feature (edit dialogs, confirmations) reuse it as-is.
 *
 * Usage:
 *   import { createModal } from "shared/components/modal/modal.js";
 *
 *   const modal = createModal({
 *       title: "Create Institution Administrator",
 *       subtitle: "Create an administrator who will manage your institution.",
 *       bodyHtml: FormMarkup(),
 *       footerHtml: FooterMarkup(),
 *       triggerEl: buttonThatOpenedIt,
 *       onRequestClose: () => {
 *           // return true to allow the close now, or handle it
 *           // yourself (e.g. show a confirm bar) and call
 *           // modal.close() later. Omit this option entirely
 *           // to just close immediately on backdrop/Escape/✕.
 *       }
 *   });
 *
 *   modal.open();
 *   // ... later
 *   modal.close();   // always closes immediately, no guard
 *   modal.destroy(); // close() + remove from the DOM for good
 *
 * Accessibility: role="dialog" + aria-modal, labelled by the
 * title, Escape to request-close, backdrop click to
 * request-close, a Tab/Shift+Tab focus trap while open, and
 * focus restored to `triggerEl` (if provided) on destroy.
 * ==========================================================
 */

import { CloseIcon } from "../icons/index.js";

const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
].join(",");

let openModalCount = 0;

function getFocusable(panel) {

    return Array.from(panel.querySelectorAll(FOCUSABLE_SELECTOR))
        .filter((el) => el.offsetParent !== null);

}

export function createModal({

    id = "",

    title = "",

    subtitle = "",

    bodyHtml = "",

    footerHtml = "",

    triggerEl = null,

    onRequestClose = null

} = {}) {

    const titleId = id ? `${id}Title` : "";

    const subtitleId = subtitle && id ? `${id}Subtitle` : "";

    const root = document.createElement("div");

    root.className = "co-modal-root co-z-modal";

    if (id) root.id = id;

    root.innerHTML = /* html */ `

        <div class="co-modal-backdrop" data-modal-backdrop></div>

        <div
            class="co-modal-panel"
            role="dialog"
            aria-modal="true"
            ${titleId ? `aria-labelledby="${titleId}"` : ""}
            ${subtitleId ? `aria-describedby="${subtitleId}"` : ""}
            tabindex="-1"
        >

            <div class="co-modal-header">

                <div class="co-modal-header-text">

                    ${title ? `<h2 class="co-modal-title" id="${titleId}">${title}</h2>` : ""}

                    ${subtitle ? `<p class="co-modal-subtitle" id="${subtitleId}">${subtitle}</p>` : ""}

                </div>

                <button
                    type="button"
                    class="co-modal-close co-touch-target co-ripple-surface"
                    data-modal-close
                    aria-label="Close dialog"
                >

                    ${CloseIcon()}

                </button>

            </div>

            <div class="co-modal-body" data-modal-body></div>

            <div class="co-modal-footer" data-modal-footer></div>

        </div>

    `;

    const backdropEl = root.querySelector("[data-modal-backdrop]");

    const panelEl = root.querySelector(".co-modal-panel");

    const closeButtonEl = root.querySelector("[data-modal-close]");

    const bodyEl = root.querySelector("[data-modal-body]");

    const footerEl = root.querySelector("[data-modal-footer]");

    bodyEl.innerHTML = bodyHtml;

    footerEl.innerHTML = footerHtml;

    let isOpen = false;

    let previouslyFocused = null;

    /* ==========================================================
       Back Button (M5)
       ----------------------------------------------------------
       Same synthetic-history-entry pattern
       sidebar.gesture-engine.js already uses for the Owner
       drawer: one entry is pushed only while this modal is open,
       and only ever popped by this module — router/router.js
       never sees it. This rides on top of the current route
       rather than touching routing.
    ========================================================== */

    let historyPushed = false;

    let suppressNextPopstate = false;

    function pushHistoryEntry() {

        if (historyPushed) return;

        history.pushState({ coModal: true, modalId: id }, "");

        historyPushed = true;

    }

    function popHistoryEntry() {

        if (!historyPushed) return;

        historyPushed = false;

        suppressNextPopstate = true;

        history.back();

    }

    function handlePopState() {

        if (suppressNextPopstate) {

            suppressNextPopstate = false;

            return;

        }

        if (!historyPushed) return;

        historyPushed = false;

        attemptClose();

        if (isOpen) {

            // attemptClose() was blocked (isSubmitting, or a
            // caller's onRequestClose showed a confirmation step
            // instead of closing) — re-push the entry so the modal
            // stays reachable by the next Back press instead of
            // being stranded with no history entry behind it.
            pushHistoryEntry();

        }

    }

    function attemptClose() {

        if (typeof onRequestClose === "function") {

            onRequestClose();

            return;

        }

        close();

    }

    function handleKeydown(event) {

        if (event.key === "Escape") {

            event.preventDefault();

            attemptClose();

            return;

        }

        if (event.key === "Tab") {

            const focusable = getFocusable(panelEl);

            if (!focusable.length) return;

            const first = focusable[0];

            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {

                event.preventDefault();

                last.focus();

            } else if (!event.shiftKey && document.activeElement === last) {

                event.preventDefault();

                first.focus();

            }

        }

    }

    function handleBackdropClick() {

        attemptClose();

    }

    function open() {

        if (isOpen) return;

        isOpen = true;

        previouslyFocused = document.activeElement;

        if (!root.isConnected) {

            document.body.appendChild(root);

        }

        openModalCount += 1;

        document.body.classList.add("co-overflow-hidden");

        // Force reflow so the enter transition actually plays,
        // same technique toast.js already uses.
        void panelEl.offsetWidth;

        root.classList.add("is-open");

        const focusable = getFocusable(panelEl);

        (focusable[0] || panelEl).focus();

        document.addEventListener("keydown", handleKeydown);

        backdropEl.addEventListener("click", handleBackdropClick);

        closeButtonEl.addEventListener("click", attemptClose);

        window.addEventListener("popstate", handlePopState);

        pushHistoryEntry();

    }

    function close() {

        if (!isOpen) return;

        isOpen = false;

        root.classList.remove("is-open");

        document.removeEventListener("keydown", handleKeydown);

        backdropEl.removeEventListener("click", handleBackdropClick);

        closeButtonEl.removeEventListener("click", attemptClose);

        window.removeEventListener("popstate", handlePopState);

        popHistoryEntry();

        openModalCount = Math.max(0, openModalCount - 1);

        if (openModalCount === 0) {

            document.body.classList.remove("co-overflow-hidden");

        }

        const restoreFocus = triggerEl || previouslyFocused;

        setTimeout(() => {

            if (restoreFocus && typeof restoreFocus.focus === "function") {

                restoreFocus.focus();

            }

        }, 260); // matches --duration-modal

    }

    function destroy() {

        close();

        setTimeout(() => {

            root.remove();

        }, 260); // matches --duration-modal

    }

    function setFooter(html) {

        footerEl.innerHTML = html;

    }

    function setBody(html) {

        bodyEl.innerHTML = html;

    }

    /**
     * M1 fix — lets a caller (e.g. a submission in progress) lock
     * the ✕ the same way it already locks Cancel/Reset: a real
     * `disabled` button, so a click during submission neither
     * fires attemptClose() nor looks clickable (see
     * .co-modal-close:disabled in modal.css).
     */
    function setCloseDisabled(disabled) {

        closeButtonEl.disabled = disabled;

        closeButtonEl.setAttribute("aria-disabled", disabled ? "true" : "false");

    }

    return {
        element: root,
        panelEl,
        bodyEl,
        footerEl,
        open,
        close,
        destroy,
        setFooter,
        setBody,
        setCloseDisabled
    };

}
