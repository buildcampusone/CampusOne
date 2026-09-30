/**
 * Generates a readable institution code from the
 * institution name, e.g.
 *
 *   "Sarla Birla University" -> "SARLA-BIRLA-4821"
 *
 * The numeric suffix is randomised on every call so
 * that regenerating (e.g. user edits the name again)
 * naturally produces a fresh candidate. Final
 * uniqueness against Firestore is still checked
 * separately in institution.service.js before the
 * code is accepted.
 */

export function generateInstitutionCode(name) {

    if (!name || !name.trim()) {

        return "";

    }

    const slug = name

        .trim()

        .toUpperCase()

        .replace(/[^A-Z0-9\s]/g, "")

        .split(/\s+/)

        .filter(Boolean)

        .slice(0, 2)

        .join("-");

    const suffix = Math.floor(

        1000 + Math.random() * 9000

    );

    if (!slug) {

        return `INST-${suffix}`;

    }

    return `${slug}-${suffix}`;

}
