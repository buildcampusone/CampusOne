/**
 * ==========================================================
 * CampusOne
 * Institution Admin Dashboard Controller
 * ----------------------------------------------------------
 * Phase 5.4.1 — Hero Section 2.0
 *
 * Still content only, not visuals — icons/markup/CSS all live
 * in dashboard.page.js / dashboard.css. Mirrors the Super
 * Admin split used in
 * modules/super-admin/dashboard/dashboard.controller.js:
 *
 *   dashboard.page.js       -> WHEN/WHERE + HOW things look
 *   dashboard.controller.js -> WHAT the content is
 *
 * 5.4.1 adds two small derived fields to the banner data:
 *   - institutionInitial: first letter of institutionName,
 *     used for the hero's monogram avatar. Derived from the
 *     same placeholder string, not a new data source.
 *   - statusLabel: a static "Active Session" label for the
 *     hero's live-status badge — describes that the admin is
 *     viewing a live dashboard, not a claim about institution
 *     operations, so it stays honest with no backend behind
 *     it.
 *
 * Foundation rules carry over unchanged from Phase 5.1:
 *   - No Firebase, no services, no APIs.
 *   - No seeded/fake data — every card either shows an honest
 *     placeholder value or an explicit empty state. The trend
 *     placeholders added in 5.2 are the same rule applied to
 *     Statistics Cards: "No data yet", never an invented %.
 *   - Institution Name / Academic Session stay static
 *     placeholders (no live data source exists yet); Current
 *     Date and Greeting are derived from the client clock
 *     only, never from a backend.
 * ==========================================================
 */

/* ==========================================================
   Welcome Banner Data
========================================================== */

export function getWelcomeBannerData() {

    const institutionName = "Your Institution";

    return {

        institutionName,

        institutionInitial: getInitial(institutionName),

        academicSession: "Academic Session 2025 - 2026",

        currentDate: formatCurrentDate(),

        greeting: getGreeting(),

        statusLabel: "Active Session"

    };

}

function getInitial(name) {

    const trimmed = (name || "").trim();

    return trimmed ? trimmed.charAt(0).toUpperCase() : "C";

}

function getGreeting() {

    const hour = new Date().getHours();

    if (hour < 12) return "Good Morning";

    if (hour < 17) return "Good Afternoon";

    return "Good Evening";

}

function formatCurrentDate() {

    return new Date().toLocaleDateString("en-IN", {

        weekday: "long",

        day: "numeric",

        month: "long",

        year: "numeric"

    });

}

/* ==========================================================
   Quick Statistics
   ----------------------------------------------------------
   Foundation only — "—" signals "not connected yet" rather
   than a real zero, and trend is an honest "No data yet"
   rather than an invented percentage, so neither can be
   misread as live data once Firestore-backed counts land in
   a later phase.
========================================================== */

export function getQuickStats() {

    return [

        {
            id: "iaStatStudents",
            icon: "students",
            label: "Total Students",
            value: "—",
            trend: "No data yet"
        },

        {
            id: "iaStatFaculty",
            icon: "faculty",
            label: "Total Faculty",
            value: "—",
            trend: "No data yet"
        },

        {
            id: "iaStatClasses",
            icon: "classes",
            label: "Active Classes",
            value: "—",
            trend: "No data yet"
        },

        {
            id: "iaStatAttendance",
            icon: "attendance",
            label: "Today's Attendance",
            value: "—",
            trend: "No data yet"
        }

    ];

}

/* ==========================================================
   Quick Actions
   ----------------------------------------------------------
   Cards only — no click handlers, no routes wired yet.

   Phase 5.5.1.2 adds a `subtitle` per action so the card can
   show a title + supporting line (id/icon/label/routing all
   unchanged — this is the only new field).
========================================================== */

export function getQuickActions() {

    return [

        { id: "iaActionAddStudent", icon: "addStudent", label: "Add Student", subtitle: "Enroll a new student" },

        { id: "iaActionAddFaculty", icon: "addFaculty", label: "Add Faculty", subtitle: "Onboard a faculty member" },

        { id: "iaActionCreateNotice", icon: "createNotice", label: "Create Notice", subtitle: "Publish an announcement" },

        { id: "iaActionTakeAttendance", icon: "takeAttendance", label: "Take Attendance", subtitle: "Mark today's attendance" },

        { id: "iaActionManageClasses", icon: "manageClasses", label: "Manage Classes", subtitle: "Organize class sections" },

        { id: "iaActionViewReports", icon: "viewReports", label: "View Reports", subtitle: "Access analytics & reports" }

    ];

}

/* ==========================================================
   Information Widgets
========================================================== */

export function getInformationWidgets() {

    return [

        {
            id: "iaWidgetActivity",
            icon: "activity",
            title: "Recent Activity",
            message: "No recent activity yet."
        },

        {
            id: "iaWidgetAnnouncements",
            icon: "announcements",
            title: "Announcements",
            message: "No announcements yet."
        },

        {
            id: "iaWidgetEvents",
            icon: "events",
            title: "Upcoming Events",
            message: "No upcoming events yet."
        }

    ];

}

/* ==========================================================
   Destroy
   ----------------------------------------------------------
   Nothing to tear down yet (no listeners, no timers, no
   realtime subscriptions) — kept as a named export so this
   module matches the render()/destroy() contract every other
   Institution Admin and Super Admin module already follows.
========================================================== */

export function destroyDashboard() {

    // Future: unsubscribe any realtime listeners here.

}
