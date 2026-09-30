/**
 * ==========================================================
 * CampusOne
 * Institution Owner — Sidebar Gesture Diagnostics
 * ----------------------------------------------------------
 * DIAGNOSTIC-ONLY. Not a fix, not a new gesture strategy, not
 * an architecture change. This file's only job is to answer,
 * on a real device, the 10 PASS/FAIL questions:
 *
 *   0. Is the version running on the device actually current?
 *   1. Is the gesture engine initialized?
 *   2. Are Pointer Events successfully registered?
 *   3. Does pointerdown fire at all?
 *   4. Is the initial touch inside the activation zone?
 *   5. Does pointermove fire?
 *   6. Is beginDrag() called?
 *   7. Is the drawer transform updated during drag?
 *   8. Is the drawer actually rendered and visible?
 *   9. Does pointerup fire?
 *  10. Is open/close logic executed?
 *
 * ACTIVATION (off by default, zero cost in production):
 *   - URL:          ?iodiag=1
 *   - localStorage:  localStorage.setItem('io-gesture-diag','1')
 * Turn off:
 *   - URL:          ?iodiag=0
 *   - localStorage.removeItem('io-gesture-diag')
 *
 * On a real installed PWA there is usually no attached dev
 * console, so this renders a small on-screen panel (bottom of
 * screen, above everything) that updates live as you swipe, and
 * a "Copy report" button so the plain-text result can be pasted
 * back for analysis. Nothing here is imported or executed by
 * sidebar.gesture-engine.js unless isEnabled() is true.
 * ==========================================================
 */

/* ==========================================================
   TEMPORARY DEV-BUILD OVERRIDE
   ----------------------------------------------------------
   Per explicit debugging request: no URL param, no localStorage,
   no user action required. This overlay now mounts itself
   unconditionally the instant this module is imported/evaluated.
   If the overlay never appears on screen, that itself is the
   diagnostic result: this module (and therefore the gesture
   engine that imports it) never loaded/executed at all.

   REVERT BEFORE PRODUCTION: set FORCE_DEV_OVERLAY = false, or
   delete this block, to go back to opt-in (?iodiag=1 / localStorage).
========================================================== */
const FORCE_DEV_OVERLAY = true;

const STORAGE_KEY = "io-gesture-diag";

const STEP_LABELS = {
    0: "Build/version marker",
    1: "Gesture engine initialized",
    2: "Pointer Events registered",
    3: "pointerdown fires",
    4: "Touch inside activation zone",
    5: "pointermove fires",
    6: "beginDrag() called",
    7: "Drawer transform updates during drag",
    8: "Drawer actually visible (computed style)",
    9: "pointerup fires",
    10: "open/close logic executed"
};

const state = {
    panelEl: null,
    rowEls: {},
    counterEls: {},
    engineStateEl: null,
    counters: { pointerdown: 0, pointermove: 0, beginDrag: 0, applyDragFrame: 0, pointerup: 0 },
    reportLines: [`CampusOne IO Sidebar Gesture Diagnostics`, `----------------------------------------`],
    enabled: null
};

/* ==========================================================
   Activation
========================================================== */

export function isEnabled() {

    if (FORCE_DEV_OVERLAY) return true;

    if (state.enabled !== null) return state.enabled;

    try {

        const params = new URLSearchParams(window.location.search);

        if (params.has("iodiag")) {

            const on = params.get("iodiag") !== "0";

            if (on) localStorage.setItem(STORAGE_KEY, "1");
            else localStorage.removeItem(STORAGE_KEY);

            state.enabled = on;

            return on;

        }

        state.enabled = localStorage.getItem(STORAGE_KEY) === "1";

    } catch (err) {

        state.enabled = false;

    }

    return state.enabled;

}

/* ==========================================================
   Panel
========================================================== */

function ensurePanel() {

    if (state.panelEl) return state.panelEl;

    const panel = document.createElement("div");
    panel.id = "ioGestureDiagPanel";
    panel.setAttribute("aria-hidden", "true");

    Object.assign(panel.style, {
        position: "fixed",
        left: "0",
        right: "0",
        bottom: "0",
        zIndex: "2147483647",
        maxHeight: "62vh",
        overflowY: "auto",
        background: "rgba(10,14,22,0.94)",
        color: "#e6edf5",
        font: "11px/1.4 -apple-system, Roboto, sans-serif",
        padding: "8px 10px calc(8px + env(safe-area-inset-bottom))",
        boxShadow: "0 -4px 18px rgba(0,0,0,0.35)",
        pointerEvents: "auto"
    });

    const title = document.createElement("div");
    title.textContent = "IO Sidebar Gesture Diagnostics — DEV BUILD (always on)";
    Object.assign(title.style, { fontWeight: "700", marginBottom: "6px", fontSize: "11px" });
    panel.appendChild(title);

    const engineState = document.createElement("div");
    Object.assign(engineState.style, {
        padding: "4px 6px", marginBottom: "6px", background: "rgba(255,255,255,0.06)",
        borderRadius: "4px", fontSize: "11px"
    });
    engineState.textContent = "Engine state: waiting for gesture engine to import/init...";
    panel.appendChild(engineState);
    state.engineStateEl = engineState;

    const countersTitle = document.createElement("div");
    countersTitle.textContent = "Live event counters:";
    Object.assign(countersTitle.style, { fontWeight: "700", margin: "4px 0 2px", fontSize: "11px" });
    panel.appendChild(countersTitle);

    const countersRow = document.createElement("div");
    Object.assign(countersRow.style, { display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "6px" });

    Object.keys(state.counters).forEach((name) => {

        const chip = document.createElement("div");
        Object.assign(chip.style, {
            padding: "3px 8px", background: "rgba(37,99,235,0.25)", borderRadius: "10px", fontSize: "11px"
        });
        chip.textContent = `${name}: 0`;
        countersRow.appendChild(chip);
        state.counterEls[name] = chip;

    });

    panel.appendChild(countersRow);

    const stepsTitle = document.createElement("div");
    stepsTitle.textContent = "Step trace:";
    Object.assign(stepsTitle.style, { fontWeight: "700", margin: "4px 0 2px", fontSize: "11px" });
    panel.appendChild(stepsTitle);

    const list = document.createElement("div");
    list.id = "ioGestureDiagList";
    panel.appendChild(list);

    Object.keys(STEP_LABELS).forEach((key) => {

        const row = document.createElement("div");
        Object.assign(row.style, {
            display: "flex",
            justifyContent: "space-between",
            gap: "8px",
            padding: "2px 0",
            borderBottom: "1px solid rgba(255,255,255,0.08)"
        });

        const label = document.createElement("span");
        label.textContent = `${key}. ${STEP_LABELS[key]}`;

        const status = document.createElement("span");
        status.textContent = "PENDING";
        status.style.color = "#9aa4b2";
        status.style.fontWeight = "700";

        row.appendChild(label);
        row.appendChild(status);
        list.appendChild(row);

        state.rowEls[key] = { row, status };

    });

    const btnRow = document.createElement("div");
    Object.assign(btnRow.style, { display: "flex", gap: "8px", marginTop: "8px" });

    const copyBtn = document.createElement("button");
    copyBtn.textContent = "Copy report";
    Object.assign(copyBtn.style, {
        flex: "1", padding: "8px", background: "#2563EB", color: "#fff",
        border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "700"
    });
    copyBtn.addEventListener("click", copyReport);

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Hide";
    Object.assign(closeBtn.style, {
        padding: "8px 12px", background: "rgba(255,255,255,0.12)", color: "#fff",
        border: "none", borderRadius: "6px", fontSize: "12px"
    });
    closeBtn.addEventListener("click", () => { panel.style.display = "none"; });

    btnRow.appendChild(copyBtn);
    btnRow.appendChild(closeBtn);
    panel.appendChild(btnRow);

    document.body.appendChild(panel);
    state.panelEl = panel;

    return panel;

}

/* ==========================================================
   Public API — called from sidebar.gesture-engine.js
========================================================== */

export function count(name) {

    if (!isEnabled()) return;

    ensurePanel();

    if (!(name in state.counters)) state.counters[name] = 0;

    state.counters[name] += 1;

    const chip = state.counterEls[name];

    if (chip) chip.textContent = `${name}: ${state.counters[name]}`;

}

export function setEngineState(text) {

    if (!isEnabled()) return;

    ensurePanel();

    if (state.engineStateEl) state.engineStateEl.textContent = `Engine state: ${text}`;

    // eslint-disable-next-line no-console
    console.log(`[CampusOne][io-gesture-diag] Engine state: ${text}`);

}

export function mark(step, pass, detail) {

    if (!isEnabled()) return;

    ensurePanel();

    const entry = state.rowEls[step];
    const statusText = pass === null ? "INFO" : (pass ? "PASS" : "FAIL");

    const line = `[${statusText}] Step ${step} — ${STEP_LABELS[step]}${detail ? " :: " + detail : ""}`;

    state.reportLines.push(line);

    // eslint-disable-next-line no-console
    console.log(`[CampusOne][io-gesture-diag] ${line}`);

    if (!entry) return;

    entry.status.textContent = statusText + (detail ? ` — ${detail}` : "");
    entry.status.style.color = pass === null ? "#9aa4b2" : (pass ? "#22c55e" : "#ef4444");

}

export function resetGestureSteps() {

    if (!isEnabled()) return;

    // Steps 3-10 represent one gesture attempt; reset them to
    // PENDING at the start of every new pointerdown so repeated
    // swipe attempts don't show stale PASS/FAIL from a previous try.
    [3, 4, 5, 6, 7, 8, 9, 10].forEach((step) => {

        const entry = state.rowEls[step];

        if (!entry) return;

        entry.status.textContent = "PENDING";
        entry.status.style.color = "#9aa4b2";

    });

}

function copyReport() {

    const text = state.reportLines.join("\n");

    if (navigator.clipboard?.writeText) {

        navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));

    } else {

        fallbackCopy(text);

    }

}

function fallbackCopy(text) {

    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();

    try { document.execCommand("copy"); } catch (err) { /* no-op */ }

    ta.remove();

}

/* ==========================================================
   Auto-mount — runs the instant this module is imported.
   Do NOT gate this behind mark()/count() calls: those only run
   once the gesture engine itself calls them. Mounting here,
   unconditionally, means the overlay's mere presence on screen
   already answers "did this diagnostics module (and therefore
   the gesture engine importing it) load and execute at all?"
========================================================== */
if (isEnabled()) {

    const mount = () => {

        ensurePanel();
        setEngineState("diagnostics module loaded — waiting for gesture engine init()...");

    };

    if (document.body) mount();
    else document.addEventListener("DOMContentLoaded", mount, { once: true });

}
