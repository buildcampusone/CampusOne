/* =========================================
   Module Registry
   -----------------------------------------
   Single source of truth for the Super
   Admin navigation: every module's id,
   label, icon, group, and build status.

   NOTE (Platform Refactor):
   Super Admin now manages the PLATFORM only.
   All institution-specific modules
   (Admissions, Attendance, Academics,
   Courses, Examination, Library, Hostel,
   Transport, Fee Management, etc.) have
   moved out of this registry — they belong
   to the Institution Admin panel, which
   every institution gets its own instance
   of after onboarding.

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
    ShieldCheckIcon,
    LockIcon,
    CreditCardIcon,
    BillingIcon,
    ClipboardIcon,
    BarChartIcon,
    AnalyticsIcon,
    AIIcon,
    SparklesIcon,
    BookIcon,
    LayersIcon,
    FileTextIcon,
    AuditIcon,
    ClockIcon,
    GlobeIcon,
    SupportIcon,
    MessageIcon,
    InboxIcon,
    SettingsIcon,
    UserIcon
} from "../../../shared/components/icons/index.js";

export const MODULE_GROUPS = [
    { id: "overview", label: "Overview" },
    { id: "platform", label: "Platform" },
    { id: "users", label: "Users" },
    { id: "subscriptions", label: "Subscriptions" },
    { id: "analytics", label: "Analytics" },
    { id: "ai-center", label: "AI Center" },
    { id: "security", label: "Security" },
    { id: "developer", label: "Developer" },
    { id: "support", label: "Support" },
    { id: "settings", label: "Settings" },
    { id: "account", label: "Account" }
];

export const MODULES = [

    { id: "home", label: "Dashboard Home", icon: HomeIcon, group: "overview", status: "ready", bottomNav: true },

    { id: "institutions", label: "Institutions", icon: BuildingIcon, group: "platform", status: "soon", bottomNav: true },
    { id: "institution-requests", label: "Requests", icon: InboxIcon, group: "platform", status: "soon" },
    { id: "institution-owners", label: "Owners", icon: UsersIcon, group: "platform", status: "soon" },

    { id: "global-users", label: "Global Users", icon: UsersIcon, group: "users", status: "soon" },
    { id: "admins", label: "Admins", icon: ShieldCheckIcon, group: "users", status: "soon" },
    { id: "roles", label: "Roles", icon: LockIcon, group: "users", status: "soon" },

    { id: "subscription-plans", label: "Plans", icon: CreditCardIcon, group: "subscriptions", status: "soon" },
    { id: "billing", label: "Billing", icon: BillingIcon, group: "subscriptions", status: "soon" },
    { id: "coupons", label: "Coupons", icon: ClipboardIcon, group: "subscriptions", status: "soon" },

    { id: "revenue-analytics", label: "Revenue", icon: BarChartIcon, group: "analytics", status: "soon", bottomNav: true },
    { id: "growth-analytics", label: "Growth", icon: AnalyticsIcon, group: "analytics", status: "soon" },
    { id: "usage-analytics", label: "Usage", icon: AnalyticsIcon, group: "analytics", status: "soon" },

    { id: "ai-assistant", label: "Assistant", icon: AIIcon, group: "ai-center", status: "soon", bottomNav: true },
    { id: "ai-agents", label: "Agents", icon: SparklesIcon, group: "ai-center", status: "soon" },
    { id: "ai-skills", label: "Skills", icon: BookIcon, group: "ai-center", status: "soon" },
    { id: "ai-mcp", label: "MCP", icon: LayersIcon, group: "ai-center", status: "soon" },
    { id: "ai-prompts", label: "Prompts", icon: FileTextIcon, group: "ai-center", status: "soon" },

    { id: "audit-logs", label: "Audit Logs", icon: AuditIcon, group: "security", status: "soon" },
    { id: "sessions", label: "Sessions", icon: ClockIcon, group: "security", status: "soon" },
    { id: "api-keys", label: "API Keys", icon: LockIcon, group: "security", status: "soon" },

    { id: "firebase", label: "Firebase", icon: GlobeIcon, group: "developer", status: "soon" },
    { id: "monitoring", label: "Monitoring", icon: BarChartIcon, group: "developer", status: "soon" },
    { id: "logs", label: "Logs", icon: FileTextIcon, group: "developer", status: "soon" },

    { id: "tickets", label: "Tickets", icon: SupportIcon, group: "support", status: "soon" },
    { id: "feedback", label: "Feedback", icon: MessageIcon, group: "support", status: "soon" },
    { id: "help", label: "Help Center", icon: SupportIcon, group: "support", status: "soon" },

    { id: "branding", label: "Branding", icon: SparklesIcon, group: "settings", status: "soon" },
    { id: "platform-settings", label: "Platform Settings", icon: SettingsIcon, group: "settings", status: "soon" },

    { id: "profile", label: "Profile", icon: UserIcon, group: "account", status: "ready" }

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
