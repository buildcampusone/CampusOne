/* =========================================
   Registration Certificate PDF
   The most premium document — landscape,
   bordered, sealed. Printable and frame-
   worthy. Deliberately does NOT reuse the
   shared header/footer templates since its
   layout is fully custom.
========================================= */

import { PdfEngine, rgb } from "../engine/pdfEngine.js";
import { THEME } from "../engine/theme.js";
import { generateQrPngBytes } from "../engine/qr.js";
import { formatDate } from "../engine/helpers.js";

// Landscape = portrait dimensions swapped
const PAGE_WIDTH = THEME.page.height;
const PAGE_HEIGHT = THEME.page.width;

function rgbFromArray(rgbArray) {

    return rgb(rgbArray[0], rgbArray[1], rgbArray[2]);

}

// Simple "C E R T I F I C A T E" style letter-spacing,
// a common decorative convention on formal certificates.
function letterSpace(text) {

    return text.toUpperCase().split("").join(" ");

}

function drawBorder(page) {

    const outerMargin = 22;

    const innerMargin = 32;

    page.drawRectangle({
        x: outerMargin,
        y: outerMargin,
        width: PAGE_WIDTH - outerMargin * 2,
        height: PAGE_HEIGHT - outerMargin * 2,
        borderColor: rgbFromArray(THEME.colors.secondaryGold),
        borderWidth: 2.5
    });

    page.drawRectangle({
        x: innerMargin,
        y: innerMargin,
        width: PAGE_WIDTH - innerMargin * 2,
        height: PAGE_HEIGHT - innerMargin * 2,
        borderColor: rgbFromArray(THEME.colors.primary),
        borderWidth: 1
    });

}

function drawSeal(engine, page, centerX, centerY) {

    const outerRadius = 46;

    const innerRadius = 38;

    page.drawEllipse({
        x: centerX,
        y: centerY,
        xScale: outerRadius,
        yScale: outerRadius,
        borderColor: rgbFromArray(THEME.colors.secondaryGold),
        borderWidth: 2
    });

    page.drawEllipse({
        x: centerX,
        y: centerY,
        xScale: innerRadius,
        yScale: innerRadius,
        borderColor: rgbFromArray(THEME.colors.secondaryGold),
        borderWidth: 0.75
    });

    engine.drawCenteredText(page, "OFFICIAL", centerX, centerY + 12, {
        bold: true,
        size: 8,
        color: THEME.colors.primary
    });

    engine.drawCenteredText(page, "SEAL", centerX, centerY + 2, {
        bold: true,
        size: 8,
        color: THEME.colors.primary
    });

    engine.drawCenteredText(page, THEME.brand.name, centerX, centerY - 12, {
        size: 7,
        color: THEME.colors.textMuted
    });

}

/**
 * Expected `data` shape:
 * {
 *   institutionName, institutionId,
 *   registrationDate, plan, status, verificationUrl
 * }
 */
export async function generateRegistrationCertificatePdf(data) {

    const {
        institutionName,
        institutionId,
        registrationDate,
        plan,
        status,
        verificationUrl
    } = data;

    const engine = await PdfEngine.create();

    const page = engine.pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

    engine.pages.push(page);

    const centerX = PAGE_WIDTH / 2;

    drawBorder(page);

    let cursorY = PAGE_HEIGHT - 70;

    // Logo + wordmark, centered
    if (engine.images.logo) {

        engine.drawImage(page, engine.images.logo, centerX - 18, cursorY - 18, 36, 36);

        cursorY -= 44;

    }

    engine.drawCenteredText(page, THEME.brand.name, centerX, cursorY, {
        bold: true,
        size: 18,
        color: THEME.colors.primary
    });

    cursorY -= 24;

    engine.drawCenteredText(page, letterSpace("Certificate of Registration"), centerX, cursorY, {
        size: 11,
        color: THEME.colors.secondaryGold
    });

    cursorY -= 50;

    engine.drawCenteredText(page, "This is to certify that", centerX, cursorY, {
        size: 11,
        color: THEME.colors.textMuted
    });

    cursorY -= 42;

    engine.drawCenteredText(page, institutionName, centerX, cursorY, {
        bold: true,
        size: 30,
        color: THEME.colors.text
    });

    cursorY -= 22;

    engine.drawCenteredText(
        page,
        "has been successfully registered on the CampusOne platform",
        centerX,
        cursorY,
        { size: 11, color: THEME.colors.textMuted }
    );

    cursorY -= 50;

    // Four-column detail row: Institution ID | Date | Plan | Status
    // Kept within the same total width the original 3-column
    // layout used, just split one extra way.
    const columnCenters = [
        centerX - 220,
        centerX - 73,
        centerX + 73,
        centerX + 220
    ];

    const columns = [
        ["INSTITUTION ID", institutionId],
        ["REGISTRATION DATE", formatDate(registrationDate)],
        ["PLAN", plan],
        ["STATUS", status || "Pending Payment"]
    ];

    columns.forEach(([label, value], index) => {

        engine.drawCenteredText(page, label, columnCenters[index], cursorY, {
            bold: true,
            size: 8,
            color: THEME.colors.primary
        });

        const isStatusColumn = label === "STATUS";

        engine.drawCenteredText(page, value, columnCenters[index], cursorY - 16, {
            size: isStatusColumn ? 10 : 12,
            color: isStatusColumn ? THEME.colors.secondaryGold : THEME.colors.text
        });

    });

    // Bottom row: QR (left) · Seal (center) · Signature (right)
    const bottomY = 92;

    if (verificationUrl) {

        try {

            const qrBytes = await generateQrPngBytes(verificationUrl, { size: 220 });

            const qrImage = await engine.pdfDoc.embedPng(qrBytes);

            const qrSize = 64;

            engine.drawImage(page, qrImage, 90, bottomY - qrSize / 2, qrSize, qrSize);

            engine.drawCenteredText(page, "Scan to verify", 90 + qrSize / 2, bottomY - qrSize / 2 - 12, {
                size: 7.5,
                color: THEME.colors.textMuted
            });

        } catch (err) {

            console.warn("Certificate QR generation failed:", err);

        }

    }

    drawSeal(engine, page, centerX, bottomY);

    const signatureX = PAGE_WIDTH - 180;

    if (engine.images.signature) {

        engine.drawImage(page, engine.images.signature, signatureX - 45, bottomY - 6, 90, 36);

    }

    engine.drawDivider(page, signatureX - 60, bottomY - 10, 120, {
        thickness: 0.8,
        color: THEME.colors.textMuted
    });

    engine.drawCenteredText(page, "Authorized Signatory", signatureX, bottomY - 22, {
        bold: true,
        size: 9,
        color: THEME.colors.text
    });

    engine.drawCenteredText(page, "CampusOne", signatureX, bottomY - 34, {
        size: 8,
        color: THEME.colors.textMuted
    });

    return engine;

}

// Convenience wrapper for direct use in a button click handler.
export async function downloadRegistrationCertificate(data) {

    const engine = await generateRegistrationCertificatePdf(data);

    await engine.download(`Registration-Certificate-${data.institutionId || "CampusOne"}.pdf`);

}
