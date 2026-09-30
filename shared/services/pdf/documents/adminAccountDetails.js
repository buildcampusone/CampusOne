/* =========================================
   Admin Account Details PDF
   Confidential — for the institution's admin
   and internal IT record only. Contains login
   credentials, so it gets a visible
   confidentiality banner and security notes
   that the other documents don't need.
========================================= */

import { PdfEngine } from "../engine/pdfEngine.js";
import { THEME } from "../engine/theme.js";
import { drawHeader } from "../engine/header.js";
import { drawFooter } from "../engine/footer.js";
import { generateQrPngBytes } from "../engine/qr.js";
import { formatDate, safeText } from "../engine/helpers.js";

function drawSectionTitle(engine, page, title, x, y) {

    const { margin, width } = THEME.page;

    engine.drawText(page, title.toUpperCase(), x, y, {
        bold: true,
        size: THEME.fonts.labelSize,
        color: THEME.colors.primary
    });

    engine.drawDivider(page, margin, y - 6, width - margin * 2, { thickness: 0.6 });

    return y - 24;

}

function drawConfidentialBanner(engine, page, x, y, width) {

    const bannerHeight = 34;

    const warnColor = [0.62, 0.14, 0.14];

    engine.drawRect(page, x, y - bannerHeight, width, bannerHeight, {
        border: warnColor,
        borderWidth: 1
    });

    engine.drawText(page, "CONFIDENTIAL", x + 12, y - 14, {
        bold: true,
        size: 10,
        color: warnColor
    });

    engine.drawText(
        page,
        "Contains login credentials. Store securely — do not share over unprotected channels.",
        x + 12,
        y - 27,
        { size: THEME.fonts.smallSize, color: THEME.colors.textMuted }
    );

    return y - bannerHeight - 20;

}

function drawBulletList(engine, page, items, x, y, opts = {}) {

    const lineHeight = opts.lineHeight || 16;

    let cursorY = y;

    items.forEach((item) => {

        engine.drawText(page, "•", x, cursorY, {
            size: THEME.fonts.regularSize,
            color: THEME.colors.primary
        });

        engine.drawText(page, item, x + 12, cursorY, {
            size: THEME.fonts.regularSize,
            color: THEME.colors.text
        });

        cursorY -= lineHeight;

    });

    return cursorY;

}

/**
 * Expected `data` shape:
 * {
 *   adminName, adminEmail, adminMobile,
 *   username, institutionId, dashboardUrl,
 *   temporaryPassword, passwordSetupLink   (provide one or the other)
 * }
 */
export async function generateAdminAccountDetailsPdf(data) {

    const {
        adminName,
        adminEmail,
        adminMobile,
        username,
        institutionId,
        dashboardUrl,
        temporaryPassword,
        passwordSetupLink
    } = data;

    const engine = await PdfEngine.create();

    const page = engine.addPage();

    const { margin, width } = THEME.page;

    let cursorY = drawHeader(engine, page, {

        title: "Admin Account Details",

        subtitle: "For admin onboarding and internal IT record only",

        meta: [
            ["Institution ID", institutionId],
            ["Date", formatDate(new Date())]
        ]

    });

    cursorY = drawConfidentialBanner(engine, page, margin, cursorY, width - margin * 2);

    // Admin Profile
    cursorY = drawSectionTitle(engine, page, "Admin Profile", margin, cursorY);

    cursorY = engine.drawKeyValueRows(page, [
        ["Name", safeText(adminName)],
        ["Email", safeText(adminEmail)],
        ["Mobile", safeText(adminMobile)],
        ["Institution ID", safeText(institutionId)]
    ], { x: margin, y: cursorY, rowHeight: 20 });

    cursorY -= 16;

    // Login Credentials — boxed for emphasis
    cursorY = drawSectionTitle(engine, page, "Login Credentials", margin, cursorY);

    const credRows = [
        ["Username", safeText(username)],
        ["Dashboard URL", safeText(dashboardUrl)]
    ];

    if (temporaryPassword) {

        credRows.push(["Temporary Password", temporaryPassword]);

    } else if (passwordSetupLink) {

        credRows.push(["Password Setup Link", passwordSetupLink]);

    }

    const boxTop = cursorY;

    const boxHeight = credRows.length * 20 + 16;

    engine.drawRect(page, margin, boxTop - boxHeight, width - margin * 2, boxHeight, {
        border: THEME.colors.border,
        borderWidth: 1
    });

    cursorY = engine.drawKeyValueRows(page, credRows, {
        x: margin + 12,
        y: boxTop - 16,
        rowHeight: 20,
        valueBold: true
    });

    cursorY -= 30;

    // Login Instructions
    cursorY = drawSectionTitle(engine, page, "Login Instructions", margin, cursorY);

    cursorY = drawBulletList(engine, page, [
        `Visit the dashboard: ${safeText(dashboardUrl)}`,
        `Sign in with the username above`,
        temporaryPassword
            ? "Enter the temporary password shown above"
            : "Use the password setup link above to create your password",
        "You'll be prompted to set a new, permanent password on first login"
    ], margin, cursorY);

    cursorY -= 12;

    // Security Guidelines
    cursorY = drawSectionTitle(engine, page, "Security Guidelines", margin, cursorY);

    cursorY = drawBulletList(engine, page, [
        "Change your temporary password immediately after first login",
        "Never share your login credentials with anyone, including CampusOne support",
        "Use a strong, unique password not reused from other accounts",
        "Log out of shared or public devices after each session"
    ], margin, cursorY);

    cursorY -= 12;

    // QR — dashboard login shortcut
    if (dashboardUrl) {

        try {

            const qrBytes = await generateQrPngBytes(dashboardUrl, { size: 220 });

            const qrImage = await engine.pdfDoc.embedPng(qrBytes);

            const qrSize = 78;

            engine.drawImage(page, qrImage, margin, cursorY - qrSize, qrSize, qrSize);

            engine.drawText(page, "Scan to open dashboard login", margin + qrSize + 12, cursorY - qrSize / 2, {
                size: THEME.fonts.smallSize,
                color: THEME.colors.textMuted
            });

        } catch (err) {

            console.warn("Admin details QR generation failed:", err);

        }

    }

    drawFooter(engine, page, {
        pageNumber: 1,
        totalPages: 1,
        generatedAt: formatDate(new Date()),
        verificationText: "This document contains confidential credentials. If received in error, notify support and discard it."
    });

    return engine;

}

// Convenience wrapper for direct use in a button click handler.
export async function downloadAdminAccountDetails(data) {

    const engine = await generateAdminAccountDetailsPdf(data);

    await engine.download(`Admin-Account-Details-${data.institutionId || "CampusOne"}.pdf`);

}
