/**
 * ==========================================================
 * CampusOne
 * Animation Types
 * ----------------------------------------------------------
 * Constants + timing tokens for the Animation Engine
 * (animation.engine.js / animation.service.js).
 *
 * Durations/easing are read live from shared/styles/variables.css
 * via readToken() instead of being hardcoded here a second time —
 * so a designer changing --animation-normal in one CSS file is
 * automatically respected by every JS-driven animation too.
 * ==========================================================
 */

export const AnimationType = Object.freeze({
    FADE_IN: "fade-in",
    FADE_OUT: "fade-out",
    CROSS_FADE: "cross-fade",
    SHIMMER: "shimmer"
});

// Falls back to these if a token is ever missing from variables.css
// (e.g. engine used in a test page without the full stylesheet).
const FALLBACK = {
    "--animation-fast": "150ms",
    "--animation-normal": "300ms",
    "--animation-slow": "500ms",
    "--ease-premium": "cubic-bezier(.22,1,.36,1)"
};

/**
 * Reads a CSS custom property off :root at call time and returns
 * it in the shape Web Animations API wants.
 *   readToken("--animation-normal") -> 300  (ms, as a number)
 *   readToken("--ease-premium")     -> "cubic-bezier(.22,1,.36,1)"
 */
export function readToken(name) {

    const raw = getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim() || FALLBACK[name];

    if (!raw) return undefined;

    // Durations come back as "300ms" / "0.3s" — WAAPI's `duration`
    // option wants a plain number of milliseconds.
    if (raw.endsWith("ms")) return parseFloat(raw);
    if (raw.endsWith("s")) return parseFloat(raw) * 1000;

    return raw;

}
