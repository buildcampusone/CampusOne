/**
 * ==========================================================
 * CampusOne
 * Profile Header Component
 * ----------------------------------------------------------
 * Phase 8 — shared, role-agnostic. The premium identity card
 * at the top of every role's Profile module: avatar, name,
 * role badge, institution name, verified badge, and the
 * role-specific id (Admin ID / Employee ID / Roll No — the
 * caller decides the label).
 *
 * Only `data` changes between roles — the markup/behavior is
 * identical for Super Admin, Institution Owner, Institution
 * Admin, Faculty, Student, and Parent, per the Phase 8
 * architecture requirement.
 *
 * Usage:
 *   ProfileHeader({
 *       name: "Anita Sharma",
 *       roleLabel: "Institution Admin",
 *       institutionName: "Delhi Public School",
 *       verified: true,
 *       idLabel: "Admin ID",
 *       idValue: "IA-2026-0417",
 *       online: true
 *   })
 * ==========================================================
 */

import { Avatar } from "../avatar/avatar.js";
import { Badge } from "../badge/badge.js";
import { ShieldCheckIcon } from "../icons/index.js";

export function ProfileHeader({
    name = "",
    photoUrl = "",
    roleLabel = "",
    institutionName = "",
    verified = false,
    idLabel = "ID",
    idValue = "—",
    memberSince = "",
    online = null
} = {}) {

    return /* html */ `

        <section class="co-card co-profile-header" aria-label="Profile summary">

            <div class="co-profile-header-glow" aria-hidden="true"></div>

            <div class="co-profile-header-avatar">

                ${Avatar({ name, photoUrl, size: "xl", online, id: "profileAvatar" })}

            </div>

            <div class="co-profile-header-info">

                <div class="co-profile-header-name-row">

                    <h2 class="co-profile-header-name">${name || "—"}</h2>

                    ${verified ? Badge({ text: "Verified", variant: "verified", icon: ShieldCheckIcon() }) : ""}

                </div>

                <div class="co-profile-header-meta">

                    ${roleLabel ? Badge({ text: roleLabel, variant: "role" }) : ""}

                    ${institutionName ? `<span class="co-profile-header-institution">${institutionName}</span>` : ""}

                </div>

                <div class="co-profile-header-footer">

                    <span class="co-profile-header-id">${idLabel}: <strong>${idValue}</strong></span>

                    ${memberSince ? `<span class="co-profile-header-divider" aria-hidden="true"></span><span class="co-profile-header-member">Member since ${memberSince}</span>` : ""}

                </div>

            </div>

        </section>

    `;

}
