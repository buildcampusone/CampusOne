/*
=========================================
CampusOne Subscription Receipt

Status:
READY

This document is NOT generated during
institution registration.

It will be generated only after a
successful subscription payment.

Trigger:
paymentSuccess.js
or
subscription.js

=========================================
*/

import { PdfEngine } from "../engine/pdfEngine.js";
import { THEME } from "../engine/theme.js";
import { drawHeader } from "../engine/header.js";
import { drawFooter } from "../engine/footer.js";
import { generateQrPngBytes } from "../engine/qr.js";
import { formatCurrency, formatDate } from "../engine/helpers.js";

/**
 * Builds a Subscription Receipt PDF and returns the PdfEngine
 * instance (so callers can .download(), .blob(), or .bytes()
 * depending on whether this is a single download or part of
 * a "Download All (ZIP)" bundle).
 *
 * Expected `data` shape:
 * {
 *   receiptNo, institutionName, institutionId,
 *   plan, billingCycle, amount, gstRate,
 *   paymentStatus, transactionId, paymentDate,
 *   nextRenewalDate, verificationUrl
 * }
 */
export async function generateSubscriptionReceiptPdf(data) {

    const {
        receiptNo,
        institutionName,
        institutionId,
        plan,
        billingCycle,
        amount,
        gstRate = 0,
        paymentStatus = "Paid",
        transactionId,
        paymentDate,
        nextRenewalDate,
        verificationUrl
    } = data;

    const gstAmount = Number(amount) * (Number(gstRate) / 100);

    const totalAmount = Number(amount) + gstAmount;

    const engine = await PdfEngine.create();

    const page = engine.addPage();

    const { margin, width } = THEME.page;

    let cursorY = drawHeader(engine, page, {

        title: "Subscription Receipt",

        subtitle: "Official payment record for your CampusOne subscription",

        meta: [
            ["Receipt No.", receiptNo],
            ["Date", formatDate(paymentDate)]
        ]

    });

    // Billed To block
    engine.drawText(page, "BILLED TO", margin, cursorY, {
        bold: true,
        size: THEME.fonts.labelSize,
        color: THEME.colors.primary
    });

    cursorY -= 18;

    engine.drawText(page, institutionName, margin, cursorY, { bold: true, size: 13 });

    cursorY -= 16;

    engine.drawText(page, `Institution ID: ${institutionId}`, margin, cursorY, {
        size: THEME.fonts.smallSize,
        color: THEME.colors.textMuted
    });

    cursorY -= 34;

    engine.drawDivider(page, margin, cursorY, width - margin * 2);

    cursorY -= 26;

    // Line items
    engine.drawText(page, "DESCRIPTION", margin, cursorY, {
        bold: true,
        size: THEME.fonts.labelSize,
        color: THEME.colors.textMuted
    });

    engine.drawText(page, "AMOUNT", width - margin - 100, cursorY, {
        bold: true,
        size: THEME.fonts.labelSize,
        color: THEME.colors.textMuted
    });

    cursorY -= 20;

    engine.drawText(page, `${plan} Plan — ${billingCycle} billing`, margin, cursorY);

    engine.drawText(page, formatCurrency(amount), width - margin - 100, cursorY);

    cursorY -= 22;

    if (gstRate > 0) {

        engine.drawText(page, `GST (${gstRate}%)`, margin, cursorY, {
            color: THEME.colors.textMuted,
            size: THEME.fonts.smallSize
        });

        engine.drawText(page, formatCurrency(gstAmount), width - margin - 100, cursorY, {
            size: THEME.fonts.smallSize
        });

        cursorY -= 22;

    }

    engine.drawDivider(page, margin, cursorY, width - margin * 2);

    cursorY -= 24;

    engine.drawText(page, "Total Paid", margin, cursorY, { bold: true, size: 13 });

    engine.drawText(page, formatCurrency(totalAmount), width - margin - 100, cursorY, {
        bold: true,
        size: 13,
        color: THEME.colors.primary
    });

    cursorY -= 40;

    // Payment meta
    cursorY = engine.drawKeyValueRows(page, [
        ["Payment Status", paymentStatus],
        ["Transaction ID", transactionId || "—"],
        ["Payment Date", formatDate(paymentDate)],
        ["Next Renewal", nextRenewalDate ? formatDate(nextRenewalDate) : "—"]
    ], { x: margin, y: cursorY, rowHeight: 20 });

    // Verification QR, bottom-right of body
    if (verificationUrl) {

        try {

            const qrBytes = await generateQrPngBytes(verificationUrl, { size: 220 });

            const qrImage = await engine.pdfDoc.embedPng(qrBytes);

            const qrSize = 84;

            engine.drawImage(
                page,
                qrImage,
                width - margin - qrSize,
                cursorY + 10,
                qrSize,
                qrSize
            );

            engine.drawText(page, "Scan to verify", width - margin - qrSize, cursorY - 4, {
                size: THEME.fonts.smallSize,
                color: THEME.colors.textMuted
            });

        } catch (err) {

            console.warn("Receipt QR generation failed:", err);

        }

    }

    drawFooter(engine, page, {
        pageNumber: 1,
        totalPages: 1,
        generatedAt: formatDate(new Date()),
        verificationText: "This is a system-generated receipt and does not require a physical signature."
    });

    return engine;

}

// Convenience wrapper for direct use in a button click handler.
export async function downloadSubscriptionReceipt(data) {

    const engine = await generateSubscriptionReceiptPdf(data);

    await engine.download(`Subscription-Receipt-${data.receiptNo || "CampusOne"}.pdf`);

}
