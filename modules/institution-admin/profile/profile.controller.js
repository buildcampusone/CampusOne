/**
 * ==========================================================
 * CampusOne
 * Institution Admin Profile Controller
 * ----------------------------------------------------------
 * Phase 8.2
 * Covers the Profile Header, Personal Information,
 * Professional Information, Quick Statistics, Account &
 * Security, My Permissions, My Activity, and Help & Support
 * sections. Logout reuses session.service.js directly from
 * profile.page.js (no data function needed here).
 *
 * Same split used across every other module:
 *   profile.page.js       -> WHEN/WHERE + HOW things look
 *   profile.controller.js -> WHAT the content is
 *
 * No Firebase yet — mirrors dashboard.controller.js and the
 * Topbar's own profile chip: no profile identity fetch/live
 * sync exists for Institution Admin yet, so every field is
 * either an honest "—" placeholder (not connected) or a
 * structurally-known static value (role label), never an
 * invented name/email/number. Wiring `user.service.js` /
 * `session.store.js` here later is a data change only — the
 * shape returned by these functions is the contract
 * profile.page.js already renders against.
 * ==========================================================
 */

/* ==========================================================
   Profile Header
========================================================== */

export function getProfileHeaderData() {

    return {

        name: "Institution Admin",
        photoUrl: "",
        roleLabel: "Institution Admin",
        institutionName: "Your Institution",
        verified: false,
        idLabel: "Admin ID",
        idValue: "—",
        memberSince: "—",
        online: true

    };

}

/* ==========================================================
   Personal Information
   ----------------------------------------------------------
   Read-only by default (Edit Profile button is wired in
   profile.page.js but has no form yet — Phase 8.2).
========================================================== */

export function getPersonalInfo() {

    return [

        { label: "Full Name", value: "—" },
        { label: "Email", value: "—" },
        { label: "Mobile Number", value: "—" },
        { label: "Employee ID", value: "—" },
        { label: "Joining Date", value: "—" }

    ];

}

/* ==========================================================
   Professional Information
========================================================== */

export function getProfessionalInfo() {

    return [

        { label: "Institution Name", value: "Your Institution" },
        { label: "Department", value: "—" },
        { label: "Designation", value: "Institution Admin" },
        { label: "Campus", value: "—" }

    ];

}

/* ==========================================================
   Quick Statistics
   ----------------------------------------------------------
   "—" signals "not connected yet", same convention as the
   Dashboard's Quick Stats — never an invented number.
========================================================== */

export function getQuickStatistics() {

    return [

        { id: "profileStatStudents", icon: "students", label: "Students Managed", value: "—" },
        { id: "profileStatFaculty", icon: "faculty", label: "Faculty Managed", value: "—" },
        { id: "profileStatNotices", icon: "notices", label: "Notices Published", value: "—" },
        { id: "profileStatLastLogin", icon: "lastLogin", label: "Last Login", value: "—" }

    ];

}

/* ==========================================================
   Account & Security
   ----------------------------------------------------------
   Navigational rows only — no destination is wired yet, so
   clicking any of these shows the same "coming soon" toast
   Edit Profile already uses (no dead clicks).
========================================================== */

export function getAccountSecurity() {

    return [

        { id: "navChangePassword", icon: "lock", label: "Change Password", sublabel: "Last changed —" },
        { id: "navActiveSessions", icon: "shield", label: "Active Sessions", sublabel: "—" },
        { id: "navLoginHistory", icon: "clock", label: "Login History", sublabel: "—" }

    ];

}

/* ==========================================================
   My Permissions
   ----------------------------------------------------------
   Module labels are structurally known (the app's real module
   set), but which ones are actually granted depends on the
   institution's plan — not connected yet, so status is an
   honest "—", same convention as everywhere else.
========================================================== */

export function getPermissions() {

    return [

        { label: "Student Management", status: "—" },
        { label: "Faculty Management", status: "—" },
        { label: "Fee Management", status: "—" },
        { label: "Attendance & Academics", status: "—" },
        { label: "Reports & Analytics", status: "—" },
        { label: "Institution Settings", status: "—" }

    ];

}

/* ==========================================================
   My Activity
   ----------------------------------------------------------
   No activity log is wired yet — an empty list is the honest
   answer (never invented log entries); profile.page.js shows
   a plain "no activity yet" hint when this comes back empty.
========================================================== */

export function getRecentActivity() {

    return [];

}

/* ==========================================================
   Help & Support
========================================================== */

export function getSupportItems() {

    return [

        { id: "navHelpCenter", icon: "support", label: "Help Center", sublabel: "Guides & FAQs" },
        { id: "navContactSupport", icon: "support", label: "Contact Support", sublabel: "—" }

    ];

}

/* ==========================================================
   Destroy
   ----------------------------------------------------------
   Nothing to tear down yet (no listeners, no timers, no
   realtime subscriptions) — kept as a named export so this
   module matches every other page's render()/destroy()
   contract.
========================================================== */

export function destroyProfile() {

    // Future: unsubscribe any realtime listeners here.

}
