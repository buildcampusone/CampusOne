/**
 * ==========================================================
 * CampusOne
 * Theme Utility
 * ----------------------------------------------------------
 * Applies / persists the light-dark theme via
 * [data-theme] on <html>. CSS tokens already live in
 * shared/styles/variables.css under [data-theme="dark"],
 * so every module gets dark mode for free — this file only
 * flips the attribute and remembers the choice.
 * ==========================================================
 */

const STORAGE_KEY = "campusone-theme";

export function getTheme() {

    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored === "dark" || stored === "light") {
        return stored;
    }

    return window.matchMedia?.("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

}

export function applyTheme(theme) {

    // Set on <html> (always present, covers the very first
    // paint) AND on <body> — router.js applies/removes the
    // Super Admin dark shell on document.body per route, so
    // writing both keeps everything in sync no matter which
    // one currently "wins" the cascade.
    document.documentElement.setAttribute("data-theme", theme);

    if (document.body) {
        document.body.dataset.theme = theme;
    }

}

export function setTheme(theme) {

    localStorage.setItem(STORAGE_KEY, theme);

    applyTheme(theme);

}

export function toggleTheme() {

    const next = getTheme() === "dark" ? "light" : "dark";

    setTheme(next);

    return next;

}

// Call once as early as possible (also mirrored inline in
// index.html <head> to avoid a light-mode flash before this
// module parses).
export function initTheme() {

    applyTheme(getTheme());

}

// Used by router.js specifically for the Super Admin shell,
// which was hard-coded to always render dark. Now it honors
// an explicit user choice (set via Profile > Appearance) but
// still DEFAULTS TO DARK — so nothing changes visually for
// anyone who hasn't touched the new toggle yet.
export function getSuperAdminTheme() {

    const stored = localStorage.getItem(STORAGE_KEY);

    return stored === "light" ? "light" : "dark";

}
