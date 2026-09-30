/* =========================================
   Shared Document Header
   Draws the CampusOne logo/wordmark, doc
   title, subtitle, and a right-aligned meta
   block (e.g. Receipt No., Date).

   Returns the y-coordinate immediately below
   the header so callers know where to start
   placing body content.
========================================= */

import { THEME } from "./theme.js";

export function drawHeader(engine, page, { title, subtitle, meta = [] }) {

    const { margin, width } = THEME.page;

    let cursorY = THEME.page.height - margin;

    if (engine.images.logo) {

        engine.drawImage(page, engine.images.logo, margin, cursorY - 28, 34, 34);

        engine.drawText(page, THEME.brand.name, margin + 44, cursorY - 12, {
            bold: true,
            size: 16,
            color: THEME.colors.primary
        });

    } else {

        engine.drawText(page, THEME.brand.name, margin, cursorY - 12, {
            bold: true,
            size: 16,
            color: THEME.colors.primary
        });

    }

    engine.drawText(
        page,
        THEME.brand.tagline,
        margin + (engine.images.logo ? 44 : 0),
        cursorY - 26,
        { size: THEME.fonts.smallSize, color: THEME.colors.textMuted }
    );

    // Right-aligned meta block (Receipt No., Date, etc.)
    let metaY = cursorY - 8;

    meta.forEach(([label, value]) => {

        const line = `${label}: ${value}`;

        const approxWidth = line.length * 5.2;

        engine.drawText(page, line, width - margin - approxWidth, metaY, {
            size: THEME.fonts.smallSize,
            color: THEME.colors.textMuted
        });

        metaY -= 14;

    });

    cursorY -= 48;

    engine.drawDivider(page, margin, cursorY, width - margin * 2, {
        thickness: 1.4,
        color: THEME.colors.primary
    });

    cursorY -= 28;

    engine.drawText(page, title, margin, cursorY, {
        bold: true,
        size: THEME.fonts.titleSize,
        color: THEME.colors.text
    });

    if (subtitle) {

        cursorY -= 20;

        engine.drawText(page, subtitle, margin, cursorY, {
            size: THEME.fonts.subtitleSize,
            color: THEME.colors.textMuted
        });

    }

    cursorY -= 24;

    return cursorY;

}
