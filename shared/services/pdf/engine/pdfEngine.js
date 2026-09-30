/* =========================================
   CampusOne — Common PDF Engine
   Thin wrapper around pdf-lib that every
   document (receipt, form, certificate,
   admin details, ...) builds on top of.

   Handles: font/logo loading (via fonts.js),
   drawing primitives, and save/download/
   blob output.
========================================= */

import { PDFDocument, rgb } from "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm";
import { THEME } from "./theme.js";
import { loadFonts } from "./fonts.js";

// Re-exported so documents that need raw pdf-lib primitives
// (e.g. registrationCertificate.js, which draws directly on the
// page instead of going through the drawRect/drawDivider helpers)
// can import from here instead of hitting the CDN a second time.
export { rgb };

function rgbFromArray(rgbArray) {

    return rgb(rgbArray[0], rgbArray[1], rgbArray[2]);

}

async function tryFetchBytes(path) {

    try {

        const res = await fetch(path);

        if (!res.ok) return null;

        return new Uint8Array(await res.arrayBuffer());

    } catch (err) {

        console.warn(`PdfEngine: could not load asset "${path}"`, err);

        return null;

    }

}

export class PdfEngine {

    constructor(pdfDoc, fonts, images) {

        this.pdfDoc = pdfDoc;

        this.fonts = fonts;

        this.images = images;

        this.pages = [];

    }

    static async create() {

        const pdfDoc = await PDFDocument.create();

        const fonts = await loadFonts(pdfDoc);

        const [logoBytes, watermarkBytes, signatureBytes] = await Promise.all([
            tryFetchBytes(THEME.assets.logo),
            tryFetchBytes(THEME.assets.watermark),
            tryFetchBytes(THEME.assets.signature)
        ]);

        const images = {};

        if (logoBytes) images.logo = await pdfDoc.embedPng(logoBytes);

        if (watermarkBytes) images.watermark = await pdfDoc.embedPng(watermarkBytes);

        if (signatureBytes) images.signature = await pdfDoc.embedPng(signatureBytes);

        return new PdfEngine(pdfDoc, fonts, images);

    }

    addPage() {

        const page = this.pdfDoc.addPage([THEME.page.width, THEME.page.height]);

        this.pages.push(page);

        return page;

    }

    drawText(page, text, x, y, opts = {}) {

        page.drawText(String(text ?? "—"), {
            x,
            y,
            size: opts.size || THEME.fonts.regularSize,
            font: opts.bold ? this.fonts.bold : this.fonts.regular,
            color: rgbFromArray(opts.color || THEME.colors.text)
        });

    }

    measureTextWidth(text, opts = {}) {

        const font = opts.bold ? this.fonts.bold : this.fonts.regular;

        const size = opts.size || THEME.fonts.regularSize;

        return font.widthOfTextAtSize(String(text ?? ""), size);

    }

    // Draws text horizontally centered on centerX. Useful for
    // certificates, seals, and anything else that isn't a
    // left-aligned label/value layout.
    drawCenteredText(page, text, centerX, y, opts = {}) {

        const textWidth = this.measureTextWidth(text, opts);

        this.drawText(page, text, centerX - textWidth / 2, y, opts);

    }

    drawDivider(page, x, y, width, opts = {}) {

        page.drawLine({
            start: { x, y },
            end: { x: x + width, y },
            thickness: opts.thickness || 1,
            color: rgbFromArray(opts.color || THEME.colors.border)
        });

    }

    drawRect(page, x, y, width, height, opts = {}) {

        page.drawRectangle({
            x, y, width, height,
            color: opts.fill ? rgbFromArray(opts.fill) : undefined,
            borderColor: opts.border ? rgbFromArray(opts.border) : undefined,
            borderWidth: opts.borderWidth || 0
        });

    }

    drawImage(page, image, x, y, width, height) {

        if (!image) return;

        page.drawImage(image, { x, y, width, height });

    }

    // Simple two-column label/value rows, top-down.
    // Returns the y position after the last row so
    // callers can keep stacking content below it.
    drawKeyValueRows(page, rows, {
        x,
        y,
        rowHeight = 20,
        labelWidth = 160,
        valueBold = false
    } = {}) {

        let cursorY = y;

        rows.forEach(([label, value]) => {

            this.drawText(page, label, x, cursorY, {
                color: THEME.colors.textMuted,
                size: THEME.fonts.labelSize
            });

            this.drawText(page, value, x + labelWidth, cursorY, {
                bold: valueBold,
                size: THEME.fonts.regularSize
            });

            cursorY -= rowHeight;

        });

        return cursorY;

    }

    async bytes() {

        return this.pdfDoc.save();

    }

    async download(filename) {

        const bytes = await this.bytes();

        const blob = new Blob([bytes], { type: "application/pdf" });

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;

        link.download = filename;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);

    }

    async blob() {

        const bytes = await this.bytes();

        return new Blob([bytes], { type: "application/pdf" });

    }

}
