/**
 * ==========================================================
 * CampusOne User Roles
 * ----------------------------------------------------------
 * Part 3.2 — Role Standardization
 * ----------------------------------------------------------
 * `institution_super_admin` has been permanently retired in
 * favor of `institution_owner` — this is a rename, not an
 * addition; nothing in the app should ever read or write the
 * old value again. `institution_admin` and `department_admin`
 * are reserved for future provisioning (an Owner delegating
 * day-to-day access) — nothing creates or checks for them yet,
 * they exist here so the full ladder is settled once, up
 * front, instead of being extended piecemeal later.
 *
 * Full ladder (top to bottom):
 *   platform_super_admin   — Anthropic/CampusOne platform staff
 *   institution_owner      — created at registration (Part 3.4+);
 *                            one per institution today
 *   institution_admin      — reserved; future delegated admin
 *   department_admin       — reserved; future delegated admin
 *   faculty / student / parent
 * ==========================================================
 */

export const ROLES = Object.freeze({
    PLATFORM_SUPER_ADMIN: "platform_super_admin",

    INSTITUTION_OWNER: "institution_owner",
    INSTITUTION_ADMIN: "institution_admin",
    DEPARTMENT_ADMIN: "department_admin",

    FACULTY: "faculty",
    STUDENT: "student",
    PARENT: "parent"
});

export default ROLES;