/* =========================================
   Font Loading
   Kept separate from pdfEngine.js so that
   adding a branded display font later (e.g.
   for the Registration Certificate) is a
   one-file change.
========================================= */

import { StandardFonts } from "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm";

export async function loadFonts(pdfDoc) {

    const [regular, bold] = await Promise.all([
        pdfDoc.embedFont(StandardFonts.Helvetica),
        pdfDoc.embedFont(StandardFonts.HelveticaBold)
    ]);

    return { regular, bold };

}

// Placeholder for future custom (non-standard) font embedding —
// e.g. a serif display font for the premium certificate.
// Usage: const display = await loadCustomFont(pdfDoc, THEME.assets.displayFont);
export async function loadCustomFont(pdfDoc, fontUrl) {

    try {

        const res = await fetch(fontUrl);

        if (!res.ok) return null;

        const bytes = new Uint8Array(await res.arrayBuffer());

        return await pdfDoc.embedFont(bytes, { subset: true });

    } catch (err) {

        console.warn(`loadCustomFont: could not load "${fontUrl}"`, err);

        return null;

    }

}
