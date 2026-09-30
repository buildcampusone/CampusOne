/* =========================================
   Shared Document Footer
   Draws page number, generation timestamp,
   an optional verification note, and brand
   contact info at the bottom of every page.
========================================= */

import { THEME } from "./theme.js";

export function drawFooter(engine, page, {
    pageNumber = 1,
    totalPages = 1,
    generatedAt,
    verificationText
} = {}) {

    const { margin, width } = THEME.page;

    const y = margin;

    engine.drawDivider(page, margin, y + 28, width - margin * 2, { thickness: 0.8 });

    engine.drawText(page, `Generated on ${generatedAt}`, margin, y + 12, {
        size: THEME.fonts.smallSize,
        color: THEME.colors.textMuted
    });

    engine.drawText(page, `Page ${pageNumber} of ${totalPages}`, width - margin - 70, y + 12, {
        size: THEME.fonts.smallSize,
        color: THEME.colors.textMuted
    });

    if (verificationText) {

        engine.drawText(page, verificationText, margin, y - 2, {
            size: THEME.fonts.smallSize,
            color: THEME.colors.textMuted
        });

    }

    engine.drawText(
        page,
        `${THEME.brand.website}  ·  ${THEME.brand.supportEmail}`,
        margin,
        y - 16,
        { size: THEME.fonts.smallSize, color: THEME.colors.textMuted }
    );

}
