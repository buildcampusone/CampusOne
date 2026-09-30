/**
 * ==========================================================
 * CampusOne
 * Avatar Component
 * ----------------------------------------------------------
 * Phase 8 — shared, role-agnostic. Renders a circular photo
 * when `photoUrl` is provided, otherwise falls back to a
 * monogram (first letter of `name`) — same fallback pattern
 * already used for the Dashboard hero's institution avatar
 * and the Topbar's profile chip, just generalized into one
 * reusable component so every role's Profile module (Super
 * Admin, Institution Owner, Institution Admin, Faculty,
 * Student, Parent) shares the exact same markup/behavior.
 *
 * Photo upload itself is not wired yet (Phase 8 "Future
 * Ready" scope) — this component already accepts a
 * `photoUrl`, so wiring Storage later is a data change only,
 * no markup change.
 *
 * Usage:
 *   Avatar({ name: "Anita Sharma", size: "xl", online: true })
 *   Avatar({ photoUrl: user.photoUrl, name: user.fullName })
 * ==========================================================
 */

export function Avatar({
    name = "",
    photoUrl = "",
    size = "md",
    online = null,
    id = ""
} = {}) {

    const initial = getInitial(name);

    return /* html */ `

        <span
            ${id ? `id="${id}"` : ""}
            class="co-avatar co-avatar--${size}"
            role="img"
            aria-label="${name ? `${name}'s avatar` : "User avatar"}"
        >

            ${
                photoUrl
                    ? `<img class="co-avatar-img" src="${photoUrl}" alt="" />`
                    : `<span class="co-avatar-initial" aria-hidden="true">${initial}</span>`
            }

            ${
                online !== null
                    ? `
                        <span
                            class="co-avatar-status ${online ? "co-avatar-status--online" : "co-avatar-status--offline"}"
                            aria-hidden="true"
                        ></span>
                    `
                    : ""
            }

        </span>

    `;

}

function getInitial(name) {

    const trimmed = (name || "").trim();

    return trimmed ? trimmed.charAt(0).toUpperCase() : "U";

}
