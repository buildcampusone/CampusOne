/* =========================================
   Registration Form PDF
   A record copy of the full onboarding
   submission — for future reference and
   record-keeping. Multi-page safe: sections
   auto-flow onto a new page if they don't
   fit on the current one.
========================================= */

import { PdfEngine } from "../engine/pdfEngine.js";
import { THEME } from "../engine/theme.js";
import { drawHeader } from "../engine/header.js";
import { drawFooter } from "../engine/footer.js";
import { generateQrPngBytes } from "../engine/qr.js";
import { formatDate, safeText } from "../engine/helpers.js";

const FOOTER_RESERVE = 90;

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

function drawContinuationHeader(engine, page) {

    const { margin, width } = THEME.page;

    let cursorY = THEME.page.height - margin;

    engine.drawText(page, `${THEME.brand.name} — Registration Form (continued)`, margin, cursorY - 4, {
        bold: true,
        size: 12,
        color: THEME.colors.primary
    });

    cursorY -= 26;

    engine.drawDivider(page, margin, cursorY, width - margin * 2, { color: THEME.colors.border });

    cursorY -= 24;

    return cursorY;

}

/**
 * Expected `data` shape (matches collectRegistrationPayload()
 * output from registerInstitution.js, plus a few extras):
 * {
 *   registrationId, registeredAt, verificationUrl,
 *   profile: { name, code, type, establishedYear, affiliation },
 *   contact: { email, mobile, website },
 *   address: { country, state, district, city, pinCode, fullAddress },
 *   owner: { fullName, designation, email, mobile },
 *   branding: { primaryColor, secondaryColor },
 *   modules: [...],
 *   subscription: { plan, billingCycle, institutionSize, status }
 * }
 */
export async function generateRegistrationFormPdf(data) {

    const { margin, width } = THEME.page;

    const engine = await PdfEngine.create();

    let page = engine.addPage();

    let cursorY = drawHeader(engine, page, {

        title: "Registration Form",

        subtitle: "A record copy of your CampusOne onboarding submission",

        meta: [
            ["Registration ID", data.registrationId],
            ["Date", formatDate(data.registeredAt)]
        ]

    });

    const sections = [
        {
            title: "Institution Information",
            rows: [
                ["Institution Name", safeText(data.profile.name)],
                ["Institution Code", safeText(data.profile.code)],
                ["Type", safeText(data.profile.type)],
                ["Established Year", safeText(data.profile.establishedYear)],
                ["Affiliation", safeText(data.profile.affiliation)]
            ]
        },
        {
            title: "Contact Information",
            rows: [
                ["Official Email", safeText(data.contact.email)],
                ["Official Mobile", safeText(data.contact.mobile)],
                ["Website", safeText(data.contact.website)]
            ]
        },
        {
            title: "Address",
            rows: [
                ["Country", safeText(data.address.country)],
                ["State", safeText(data.address.state)],
                ["District", safeText(data.address.district)],
                ["City", safeText(data.address.city)],
                ["PIN Code", safeText(data.address.pinCode)],
                ["Full Address", safeText(data.address.fullAddress)]
            ]
        },
        {
            title: "Admin Information",
            rows: [
                ["Name", safeText(data.owner.fullName)],
                ["Designation", safeText(data.owner.designation)],
                ["Email", safeText(data.owner.email)],
                ["Mobile", safeText(data.owner.mobile)]
            ]
        },
        {
            title: "Branding Details",
            rows: [
                ["Primary Color", safeText(data.branding.primaryColor)],
                ["Secondary Color", safeText(data.branding.secondaryColor)]
            ]
        },
        {
            title: "Subscription & Plan",
            rows: [
                ["Plan", safeText(data.subscription.plan)],
                ["Billing Cycle", safeText(data.subscription.billingCycle)],
                ["Institution Size", safeText(data.subscription.institutionSize)],
                ["Modules", (data.modules || []).join(", ") || "—"],
                ["Payment Status", safeText(data.subscription.status) || "Pending Payment"]
            ]
        }
    ];

    sections.forEach((section) => {

        const neededHeight = 24 + section.rows.length * 20 + 20;

        if (cursorY - neededHeight < FOOTER_RESERVE) {

            page = engine.addPage();

            cursorY = drawContinuationHeader(engine, page);

        }

        cursorY = drawSectionTitle(engine, page, section.title, margin, cursorY);

        cursorY = engine.drawKeyValueRows(page, section.rows, {
            x: margin,
            y: cursorY,
            rowHeight: 20
        });

        cursorY -= 16;

    });

    // Verification QR on whichever page has room
    if (data.verificationUrl) {

        try {

            const qrBytes = await generateQrPngBytes(data.verificationUrl, { size: 220 });

            const qrImage = await engine.pdfDoc.embedPng(qrBytes);

            const qrSize = 84;

            if (cursorY - qrSize < FOOTER_RESERVE) {

                page = engine.addPage();

                cursorY = drawContinuationHeader(engine, page);

            }

            engine.drawImage(
                page,
                qrImage,
                width - margin - qrSize,
                cursorY - qrSize + 20,
                qrSize,
                qrSize
            );

            engine.drawText(page, "Scan to verify", width - margin - qrSize, cursorY - qrSize + 6, {
                size: THEME.fonts.smallSize,
                color: THEME.colors.textMuted
            });

        } catch (err) {

            console.warn("Registration form QR generation failed:", err);

        }

    }

    // Footer needs the final page count, so it's drawn last,
    // once for every page that ended up in the document.
    const totalPages = engine.pages.length;

    engine.pages.forEach((pg, index) => {

        drawFooter(engine, pg, {
            pageNumber: index + 1,
            totalPages,
            generatedAt: formatDate(new Date()),
            verificationText: "This is a system-generated copy for reference and record-keeping."
        });

    });

    return engine;

}

// Convenience wrapper for direct use in a button click handler.
export async function downloadRegistrationForm(data) {

    const engine = await generateRegistrationFormPdf(data);

    await engine.download(`Registration-Form-${data.registrationId || "CampusOne"}.pdf`);

}
