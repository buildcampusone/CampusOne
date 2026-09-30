/* =========================================
   QR Code Helper
   Generates a QR code as PNG bytes so it can
   be embedded directly into a pdf-lib page.
========================================= */

import QRCode from "https://cdn.jsdelivr.net/npm/qrcode@1.5.3/+esm";

export async function generateQrPngBytes(text, options = {}) {

    const dataUrl = await QRCode.toDataURL(text, {

        margin: 1,

        width: options.size || 200,

        color: {
            dark: options.dark || "#0E3D91",
            light: options.light || "#FFFFFF"
        }

    });

    const base64 = dataUrl.split(",")[1];

    const binary = atob(base64);

    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {

        bytes[i] = binary.charCodeAt(i);

    }

    return bytes;

}
