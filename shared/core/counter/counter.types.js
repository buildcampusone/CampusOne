/**
 * ==========================================================
 * CampusOne
 * Counter Types
 * ----------------------------------------------------------
 * Constants + formatting for the Counter Engine
 * (counter.engine.js / counter.service.js).
 *
 * Duration/easing are read live from shared/styles/variables.css
 * via readToken() — the same helper animation.types.js exports —
 * so a KPI counter and a fade share one source of truth for
 * timing instead of two hardcoded numbers drifting apart.
 * ==========================================================
 */

export { readToken } from "../animation/animation.types.js";

export const CounterFormat = Object.freeze({
    NUMBER: "number",       // 1234        -> "1,234"
    CURRENCY: "currency",   // 1234, "₹"   -> "₹ 1,234"
    COMPACT: "compact"      // 12400       -> "12.4K"
});

/**
 * Formats a numeric value the same way at every animation frame
 * and at the final frame, so the counter never "pops" to a
 * differently-formatted string the instant it finishes.
 */
export function formatCounterValue(value, {
    format = CounterFormat.NUMBER,
    prefix = "",
    suffix = "",
    decimals = 0
} = {}) {

    const rounded = Number(value.toFixed(decimals));

    let body;

    if (format === CounterFormat.COMPACT) {

        body = new Intl.NumberFormat("en-IN", {
            notation: "compact",
            maximumFractionDigits: rounded >= 1000 ? 1 : decimals
        }).format(rounded);

    } else {

        body = new Intl.NumberFormat("en-IN", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(rounded);

    }

    if (format === CounterFormat.CURRENCY) {
        return `${prefix || "₹"} ${body}${suffix}`;
    }

    return `${prefix}${body}${suffix}`;

}
