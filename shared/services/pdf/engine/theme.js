/* =========================================
   CampusOne — Shared PDF Theme
   Single source of truth for colors, fonts,
   page geometry, and brand assets used across
   every generated document.

   Asset paths are resolved relative to this
   module's own location (not the host HTML
   page), so they work correctly no matter
   which screen imports a document generator.
========================================= */

const ASSET_BASE_URL = new URL("../assets/", import.meta.url);

export const THEME = {

    colors: {
        primary: [0.055, 0.239, 0.569],      // CampusOne blue
        primaryDark: [0.035, 0.157, 0.373],
        secondaryGold: [0.831, 0.686, 0.216], // Certificate accent
        text: [0.11, 0.11, 0.13],
        textMuted: [0.42, 0.44, 0.49],
        border: [0.85, 0.87, 0.91],
        background: [1, 1, 1],
        success: [0.11, 0.6, 0.36],
        white: [1, 1, 1]
    },

    fonts: {
        regularSize: 10,
        smallSize: 8.5,
        titleSize: 20,
        subtitleSize: 12,
        labelSize: 9
    },

    page: {
        width: 595.28,   // A4 in points
        height: 841.89,
        margin: 48
    },

    assets: {
        logo: new URL("logo.png", ASSET_BASE_URL).href,
        watermark: new URL("watermark.png", ASSET_BASE_URL).href,
        signature: new URL("signature.png", ASSET_BASE_URL).href
    },

    brand: {
        name: "CampusOne",
        tagline: "Educational Institution Management Platform",
        supportEmail: "support@campusone.app",
        website: "https://campusone.app"
    }

};
