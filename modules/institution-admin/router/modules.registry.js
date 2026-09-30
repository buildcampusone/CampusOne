/* =========================================
   Institution Admin — Module Registry
   -----------------------------------------
   Single source of truth for the Institution
   Admin navigation: every module's id, label,
   icon, group, and build status.

   Mirrors modules/super-admin/router/modules.registry.js
   1:1 so router.institution.js can consume it
   with the exact same contract (getModule(),
   getModulesByGroup(), getBottomNavModules()).

   Part 6.0 — Future-Ready Sidebar Navigation
   -------------------------------------------
   This registry now lists the full Institution
   Admin navigation architecture (Admissions,
   People, Academics, Communication,
   Administration, Human Resources, Analytics,
   Settings) alongside Overview. Only "dashboard"
   has a real loader/route wired up today — every
   other entry is status: "soon", which
   router.institution.js already renders as a
   finished "Coming soon" empty state with zero
   extra code (see LOADERS in router.institution.js
   and the `definition.status !== "ready"` branch
   in navigateToModule()).

   This is navigation UI scaffolding only. Adding
   a module here does NOT touch routing, Firebase,
   controllers, or business logic — it only makes
   the module selectable in the sidebar. Wiring an
   entry to a real feature later is a one-line
   LOADERS addition in router.institution.js plus
   flipping its status to "ready", exactly as
   documented there.

   status:
     "ready" - has a real loader, navigable
     "soon"  - shown in nav, opens a finished
               "Coming soon" empty state
               (built module-by-module next)
========================================= */

import {
    HomeIcon,
    BuildingIcon,
    UsersIcon,
    UserIcon,
    BriefcaseIcon,
    SupportIcon,
    LayersIcon,
    ClipboardIcon,
    BookIcon,
    InboxIcon,
    ShieldCheckIcon,
    ClockIcon,
    CalendarIcon,
    FileTextIcon,
    BarChartIcon,
    GlobeIcon,
    BellIcon,
    NotificationIcon,
    MessageIcon,
    LibraryIcon,
    TruckIcon,
    CreditCardIcon,
    SparklesIcon,
    BillingIcon,
    DashboardIcon,
    AnalyticsIcon,
    AuditIcon,
    SettingsIcon
} from "../../../shared/components/icons/index.js";

export const MODULE_GROUPS = [
    { id: "overview", label: "Overview" },
    { id: "admissions", label: "Admissions" },
    { id: "people", label: "People" },
    { id: "academics", label: "Academics" },
    { id: "communication", label: "Communication" },
    { id: "administration", label: "Administration" },
    { id: "human-resources", label: "Human Resources" },
    { id: "analytics", label: "Analytics" },
    { id: "settings", label: "Settings" }
];

export const MODULES = [

    { id: "dashboard", label: "Dashboard", icon: HomeIcon, group: "overview", status: "ready", bottomNav: true },

    // Phase 8 — Profile is reached only via the Topbar's Account
    // Menu (see topbar.page.js "My Profile" row), never the
    // Sidebar. Its group id ("account") is intentionally NOT in
    // MODULE_GROUPS above, so sidebar.page.js's
    // `MODULE_GROUPS.map(group => getModulesByGroup(group.id))`
    // loop never surfaces it — this entry only exists so the
    // router (getModule()) can resolve the route. No sidebar
    // change required or made.
    { id: "profile", label: "My Profile", icon: UserIcon, group: "account", status: "ready" },

    { id: "admission-enquiries", label: "Admission Enquiries", icon: InboxIcon, group: "admissions", status: "soon" },
    { id: "applications", label: "Applications", icon: ClipboardIcon, group: "admissions", status: "soon" },
    { id: "student-admissions", label: "Student Admissions", icon: UserIcon, group: "admissions", status: "soon" },
    { id: "document-verification", label: "Document Verification", icon: ShieldCheckIcon, group: "admissions", status: "soon" },

    { id: "students", label: "Students", icon: UsersIcon, group: "people", status: "soon" },
    { id: "parents", label: "Parents", icon: UserIcon, group: "people", status: "soon" },
    { id: "faculty", label: "Faculty", icon: BriefcaseIcon, group: "people", status: "soon" },
    { id: "staff", label: "Staff", icon: SupportIcon, group: "people", status: "soon" },
    { id: "departments", label: "Departments", icon: BuildingIcon, group: "people", status: "soon" },
    { id: "classes", label: "Classes", icon: LayersIcon, group: "people", status: "soon" },
    { id: "sections", label: "Sections", icon: ClipboardIcon, group: "people", status: "soon" },
    { id: "subjects", label: "Subjects", icon: BookIcon, group: "people", status: "soon" },

    { id: "attendance", label: "Attendance", icon: ClockIcon, group: "academics", status: "soon" },
    { id: "timetable", label: "Timetable", icon: CalendarIcon, group: "academics", status: "soon" },
    { id: "assignments", label: "Assignments", icon: FileTextIcon, group: "academics", status: "soon" },
    { id: "homework", label: "Homework", icon: BookIcon, group: "academics", status: "soon" },
    { id: "lesson-plans", label: "Lesson Plans", icon: LayersIcon, group: "academics", status: "soon" },
    { id: "examinations", label: "Examinations", icon: ClipboardIcon, group: "academics", status: "soon" },
    { id: "results", label: "Results", icon: BarChartIcon, group: "academics", status: "soon" },
    { id: "academic-calendar", label: "Academic Calendar", icon: GlobeIcon, group: "academics", status: "soon" },

    { id: "notices", label: "Notices", icon: BellIcon, group: "communication", status: "soon" },
    { id: "events", label: "Events", icon: CalendarIcon, group: "communication", status: "soon" },
    { id: "announcements", label: "Announcements", icon: NotificationIcon, group: "communication", status: "soon" },
    { id: "messages", label: "Messages", icon: MessageIcon, group: "communication", status: "soon" },
    { id: "circulars", label: "Circulars", icon: FileTextIcon, group: "communication", status: "soon" },

    { id: "library", label: "Library", icon: LibraryIcon, group: "administration", status: "soon" },
    { id: "transport", label: "Transport", icon: TruckIcon, group: "administration", status: "soon" },
    { id: "hostel", label: "Hostel", icon: BuildingIcon, group: "administration", status: "soon" },
    { id: "inventory", label: "Inventory", icon: LayersIcon, group: "administration", status: "soon" },
    { id: "fees", label: "Fees", icon: CreditCardIcon, group: "administration", status: "soon" },
    { id: "scholarships", label: "Scholarships", icon: SparklesIcon, group: "administration", status: "soon" },
    { id: "certificates", label: "Certificates", icon: ShieldCheckIcon, group: "administration", status: "soon" },
    { id: "reports", label: "Reports", icon: BarChartIcon, group: "administration", status: "soon" },

    { id: "leave-management", label: "Leave Management", icon: CalendarIcon, group: "human-resources", status: "soon" },
    { id: "payroll", label: "Payroll", icon: BillingIcon, group: "human-resources", status: "soon" },
    { id: "staff-attendance", label: "Staff Attendance", icon: ClockIcon, group: "human-resources", status: "soon" },

    { id: "dashboard-analytics", label: "Dashboard Analytics", icon: DashboardIcon, group: "analytics", status: "soon" },
    { id: "academic-analytics", label: "Academic Analytics", icon: AnalyticsIcon, group: "analytics", status: "soon" },
    { id: "attendance-analytics", label: "Attendance Analytics", icon: BarChartIcon, group: "analytics", status: "soon" },
    { id: "financial-reports", label: "Financial Reports", icon: AuditIcon, group: "analytics", status: "soon" },

    { id: "academic-session", label: "Academic Session", icon: CalendarIcon, group: "settings", status: "soon" },
    { id: "integrations", label: "Integrations", icon: GlobeIcon, group: "settings", status: "soon" },
    { id: "settings", label: "Settings", icon: SettingsIcon, group: "settings", status: "soon" }

];

export function getModule(id) {

    return MODULES.find((module) => module.id === id) || null;

}

export function getModulesByGroup(groupId) {

    return MODULES.filter((module) => module.group === groupId);

}

export function getBottomNavModules() {

    return MODULES.filter((module) => module.bottomNav);

}
