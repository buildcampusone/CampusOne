/**
 * ==========================================================
 * CampusOne Module Permissions
 * ----------------------------------------------------------
 * Phase 5.1.5 — Permissions & Role Management
 *
 * The flag set an Institution Owner can grant/deny per
 * Institution Administrator, stored at users/{uid}.permissions
 * (an object of moduleKey -> boolean). Deliberately mirrors the
 * module areas already scaffolded in
 * modules/institution-admin/router/modules.registry.js (most
 * still `status: "soon"`) WITHOUT importing from or editing
 * that file — this is the permission model's own vocabulary,
 * kept in shared/constants alongside roles.js/status.js so
 * shared/services/permission.service.js has one place to read
 * valid keys from. Extending access control to a new module is
 * exactly one new entry here — see permission.service.js's own
 * header for why nothing else needs to change.
 * ==========================================================
 */

export const MODULE_PERMISSIONS = Object.freeze({
    DASHBOARD: "dashboard",
    STUDENTS: "students",
    FACULTY: "faculty",
    DEPARTMENTS: "departments",
    COURSES: "courses",
    ATTENDANCE: "attendance",
    NOTICES: "notices",
    TIMETABLE: "timetable",
    FEES: "fees",
    REPORTS: "reports"
});

/**
 * Every Institution Admin document's `permissions` map is
 * created with exactly this shape (all flags present, all
 * false) rather than `{}` — so a future Permissions editor UI
 * always has a concrete, known set of keys to render checkboxes
 * for, with no "field doesn't exist yet" branch needed.
 */
export const DEFAULT_PERMISSIONS = Object.freeze(
    Object.fromEntries(
        Object.values(MODULE_PERMISSIONS).map((key) => [key, false])
    )
);

export default MODULE_PERMISSIONS;
