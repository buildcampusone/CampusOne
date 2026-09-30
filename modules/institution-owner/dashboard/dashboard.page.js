/**
 * ==========================================================
 * CampusOne
 * Institution Owner Dashboard
 * ----------------------------------------------------------
 * Phase 5 / Section 1 — Welcome Header (V1.0, full spec)
 *
 * Extends the existing dashboard — KPI Grid, Quick Actions,
 * and Information Widgets (Sections 2-4 of the approved plan)
 * are byte-for-byte untouched below. Only the Welcome Header
 * changes in this pass:
 *
 *   - Full field set: Greeting, Owner Name, Institution Name,
 *     Institution Code, Verification Badge, Academic Session,
 *     Current Date, Current Time — see dashboard.controller.js's
 *     `fetchWelcomeBannerData()` for the data contract.
 *   - Firestore-ready loading sequence: skeleton paints
 *     instantly inside `#ioWelcomeHeaderWrap`, the rest of the
 *     dashboard (KPI/Actions/Widgets) mounts in the same tick
 *     as before (unchanged, still synchronous — Sections 2-4
 *     aren't part of this pass), then the header awaits
 *     `fetchWelcomeBannerData()` and fades the skeleton out for
 *     the real hero — same fadeOut → swap → fadeIn sequence
 *     Super Admin's dashboard.page.js already uses for its own
 *     skeleton, reused here rather than reinvented.
 *   - Live clock: Current Time re-renders on a `setInterval`
 *     started once the real hero mounts, cleared by this
 *     module's `render()`-returned destroy function — no
 *     orphaned timers if the shell tears the module down.
 *   - `.io-hero-card` carries `role="region"
 *     aria-label="Welcome header"`; the skeleton wrap carries
 *     `aria-busy` while pending.
 *
 * Avatar, gradient, blob decor, status dot — all untouched.
 * ----------------------------------------------------------
 * Phase 5 / Section 2 — KPI Cards (V1.0)
 * ----------------------------------------------------------
 * KPI Grid moved onto the same async skeleton/fetch/fade
 * sequence as the Welcome Header (own `#ioKpiGridWrap`, own
 * `fetchQuickStats()`, own error state) — see loadKpiGrid()
 * near render() below. Card markup itself unchanged.
 * ----------------------------------------------------------
 * Phase 5 / Section 3 — Quick Actions (V1.0)
 * ----------------------------------------------------------
 * Quick Actions now follow that same pattern too, plus two
 * things Sections 1-2 didn't need:
 *   - An empty state (QuickActionsEmptyState()) if
 *     fetchQuickActions() ever resolves an empty list.
 *   - A delegated click handler (bindQuickActionHandlers()) that
 *     shows a per-card loading state — the shared `.btn-spinner`
 *     primitive, not a new one — while performQuickAction()
 *     resolves, then a toast with the result. Unbound in
 *     destroyDashboard() alongside the live-clock interval.
 * The six actions themselves (Institution Profile / Institution
 * Admin Management / Departments / Institution Settings /
 * Subscription & Billing / Invite Team) are Owner-specific
 * operational shortcuts, not the generic SaaS set — see
 * dashboard.controller.js's QUICK_ACTIONS for the full rationale.
 * Section 4 (Widgets) still mounts synchronously — not part of
 * this pass.
 * ----------------------------------------------------------
 * Part 2.2 — Executive Dashboard Implementation
 * ----------------------------------------------------------
 * Same four-section shape audited in Part 2.1 — Welcome Hero,
 * KPI Grid, Quick Actions, Information Widgets — all inside
 * this module's own #ioContent outlet (mounted by
 * modules/institution-owner/shell/shell.controller.js, Part
 * 1.4B). Nothing about the shell changes here.
 *
 * Reuse, not re-derivation, per the audit:
 *   - Every card (`io-kpi-card` / `io-action-card` /
 *     `io-dashboard-card`) is built on the shared `co-card`
 *     base class (shared/styles/components.css) first, exactly
 *     like Institution Admin's `.ia-kpi-card` etc. do — surface/
 *     border/base-radius/shadow-sm come from there, not
 *     redeclared here.
 *   - Icons are 100% shared SVGs from shared/components/icons —
 *     no new icon assets.
 *   - Visual language (accent-tinted icon tiles, hero gradient
 *     card, empty-state depth) follows the same *pattern*
 *     Institution Admin's dashboard.css established — copied as
 *     a pattern, not by importing Institution Admin's CSS file,
 *     so `io-` stays a fully independent namespace.
 *
 * What's genuinely Owner-specific (per the audit, Section 5):
 *   - KPI set (Total Users / Active Modules / Billing Status /
 *     Security Status) — an executive summary spanning every
 *     module group, not one operational domain.
 *   - Quick Actions are a dedicated Owner-specific config
 *     (QUICK_ACTIONS in dashboard.controller.js) rather than
 *     derived from modules.registry.js — see that file's header
 *     for why the two lists don't map 1:1.
 *   - Widgets (Business Snapshot / Security & Access / Recent
 *     Activity) — none of these map to an existing Super Admin
 *     or Institution Admin widget.
 *
 * ----------------------------------------------------------
 * Phase 5 / Section 5 — Institution Health (V1.0)
 * ----------------------------------------------------------
 * A fifth, independently renderable/destroyable section (own
 * #ioHealthWrap, own skeleton -> fetch -> success/empty -> error
 * lifecycle) surfacing the institution's operational readiness —
 * profile completion, verification, subscription, admin/
 * department setup, student/faculty data — as a score (0-100%),
 * a status badge, and per-indicator rows. All scoring lives in
 * dashboard.controller.js's fetchInstitutionHealth(); this file
 * only renders whatever it resolves. See loadInstitutionHealth()
 * near render() below and that function's own doc comment for
 * the full contract.
 *
 * ----------------------------------------------------------
 * Phase 5 / Section 6 — Pending Tasks (V1.0)
 * ----------------------------------------------------------
 * A sixth, independently renderable/destroyable section (own
 * #ioTasksWrap, own skeleton -> fetch -> success/empty -> error
 * lifecycle) surfacing the Owner's operational setup checklist —
 * profile, verification, first admin, departments, faculty,
 * students, academic session, first notice — as prioritized task
 * rows with priority/status badges and a CTA (the shared Button
 * component), disabled whenever a task's destination module
 * doesn't exist yet. All task-state computation lives in
 * dashboard.controller.js's fetchPendingTasks(); this file only
 * renders whatever it resolves. See loadPendingTasks() near
 * render() below for the full contract.
 *
 * Refinement pass (Section 6 V1.1) — premium onboarding polish,
 * UI-only, contract-compatible:
 *   - Header gains an "Institution Setup Progress" bar reusing
 *     Section 5's `.io-health-progress` bar verbatim, driven by
 *     three new controller fields (`completedTasks` / `totalTasks`
 *     / `completionPercentage`) added to fetchPendingTasks()'s
 *     resolved shape — page.js only interpolates them.
 *   - Each task icon gets its own accent (TASK_ACCENTS registry
 *     below), same one-tint-per-card pattern as KPI_ACCENTS.
 *   - The old "Not Available Yet" badge + disabled button
 *     duplication collapses into a single indicator: an unavailable
 *     task's own CTA becomes a disabled "Coming Soon" button.
 *   - The empty state, reached once every task is complete, becomes
 *     a celebratory screen with two (currently inert — no routed
 *     destination exists yet, same discipline as Subscription
 *     Overview's disabled CTAs) actions.
 *
 * ----------------------------------------------------------
 * Phase 5 / Section 7 — Subscription Overview (V1.0)
 * ----------------------------------------------------------
 * A seventh, independently renderable/destroyable section (own
 * #ioSubscriptionWrap, own skeleton -> fetch -> success/empty ->
 * error lifecycle) — the Owner's subscription health and
 * entitlement widget, NOT a billing widget. Shows Current Plan,
 * Plan/Status/Billing badges, Renewal Date, Days Remaining, a
 * Usage Summary, and a Premium CTA area (Upgrade Plan / Manage
 * Subscription), both disabled — gracefully, no "Coming Soon",
 * no fake navigation — while the Subscription & Billing module
 * doesn't exist yet. All plan/status/billing/usage computation
 * lives in dashboard.controller.js's fetchSubscriptionOverview();
 * this file only renders the exact
 * `{ plan, status, renewalDate, daysRemaining, billingStatus,
 *   trial, usage, actions }` shape it resolves. See
 * loadSubscriptionOverview() near render() below for the full
 * contract.
 *
 * ----------------------------------------------------------
 * Phase 5 / Section 8 — Resource Usage (V1.0)
 * ----------------------------------------------------------
 * An eighth, independently renderable/destroyable section (own
 * #ioResourceUsageWrap, own skeleton -> fetch -> success/empty ->
 * error lifecycle) — a quick operational view of resource
 * utilization (Students / Faculty / Storage) against the current
 * subscription, NOT a storage widget. Each row shows a Resource
 * Icon, Resource Name, Used/Limit, Progress Bar, Utilization %,
 * and Status Badge, reusing Section 5's `.io-health-progress`
 * bar verbatim — no second progress component. All used/limit/
 * utilization/status/detail computation lives in
 * dashboard.controller.js's fetchResourceUsage(); this file only
 * renders the exact `{ hasSubscription, resources }` shape it
 * resolves. See loadResourceUsage() near render() below for the
 * full contract.
 *
 * ----------------------------------------------------------
 * Phase 5 / Section 9 — Security Overview (V1.0, FINAL widget)
 * ----------------------------------------------------------
 * A ninth and final, independently renderable/destroyable section
 * (own #ioSecurityWrap, own skeleton -> fetch -> success/empty ->
 * error lifecycle) — a quick operational security summary, NOT a
 * Security Center. Reuses Section 5's score ring for the Overall
 * Security Score and Section 4's activity list for Recent Security
 * Events (latest 3) — no new visual primitives. All overallScore/
 * overallStatus/password-strength/security-classification
 * computation lives in dashboard.controller.js's
 * fetchSecurityOverview(); this file only renders the exact
 * `{ hasSecurityData, overallScore, overallStatus,
 *   lastSuccessfulLogin, activeSessions, failedLoginAttempts,
 *   passwordStatus, mfa, recentEvents }` shape it resolves. See
 * loadSecurityOverview() near render() below for the full
 * contract.
 *
 * ==========================================================
 * Foundation rules unchanged: no Firebase, no APIs, no charts,
 * no seeded/fake data, no routing/guard changes. Only ever
 * writes inside this module's own folder.
 * ==========================================================
 */

import {
    fetchWelcomeBannerData,
    formatCurrentTime,
    fetchQuickStats,
    fetchQuickActions,
    performQuickAction,
    getInformationWidgets,
    fetchActivityWidgetData,
    ACTIVITY_TYPES,
    fetchInstitutionHealth,
    fetchPendingTasks,
    fetchSubscriptionOverview,
    fetchResourceUsage,
    fetchSecurityOverview,
    destroyDashboard as destroyDashboardData
} from "./dashboard.controller.js";

import { Animation } from "../../../shared/core/animation/animation.service.js";

import { BaseSkeleton } from "../../../shared/components/skeleton/base/base.skeleton.js";

import { showToast } from "../../../shared/components/toast/toast.js";

import { Badge } from "../../../shared/components/badge/badge.js";

import { Button } from "../../../shared/components/button/button.js";

import {
    SparklesIcon,
    InstitutionIcon,
    UsersIcon,
    LayersIcon,
    LibraryIcon,
    SettingsIcon,
    MailIcon,
    BillingIcon,
    ShieldCheckIcon,
    ClockIcon,
    InboxIcon,
    ChevronDownIcon,
    BriefcaseIcon,
    FileTextIcon,
    EditIcon,
    BuildingIcon,
    UserIcon,
    BarChartIcon,
    CheckIcon,
    CalendarIcon,
    LockIcon
} from "../../../shared/components/icons/index.js";

/* ==========================================================
   Icon Registry
   ----------------------------------------------------------
   Maps the plain string keys dashboard.controller.js hands back
   for KPI cards and Widgets (data layer shouldn't need to know
   the icon library's import names) to the actual shared icon
   components. Quick Actions skip this map entirely — their
   `icon` field is already a live component reference, straight
   from modules.registry.js.
========================================================== */

const ICONS = {

    users: UsersIcon,
    modules: LayersIcon,
    billing: BillingIcon,
    security: ShieldCheckIcon,
    activity: InboxIcon,

    institution: InstitutionIcon,
    admin: UsersIcon,
    departments: LibraryIcon,
    settings: SettingsIcon,
    invite: MailIcon,

    adminCreated: UserIcon,
    facultyAdded: BriefcaseIcon,
    studentImported: UsersIcon,
    noticePublished: FileTextIcon,
    profileUpdated: EditIcon,
    departmentCreated: BuildingIcon,
    settingsChanged: SettingsIcon,

    readiness: BarChartIcon,

    // Section 7/8/9 rows. Reuses the exact icon components already
    // imported above rather than adding new SVG assets.
    students: UsersIcon,
    storage: LayersIcon,
    clock: ClockIcon,
    failedAttempts: LockIcon,
    mfa: CheckIcon

};

function renderIcon(key) {

    const Icon = ICONS[key];

    return Icon ? Icon() : "";

}

/* ==========================================================
   KPI Accent Registry
   ----------------------------------------------------------
   Purely presentational — mirrors Institution Admin's
   KPI_ACCENTS: maps each KPI's icon key to a shared brand/
   status token so its icon tile gets its own tint
   (`.io-kpi-card--{accent}` sets `--kpi-accent` in
   dashboard.css). Data layer stays untouched.
========================================================== */

const KPI_ACCENTS = {

    users: "primary",
    modules: "info",
    billing: "primary",
    security: "secondary"

};

/* ==========================================================
   Quick Action Accent Registry
   ----------------------------------------------------------
   Keyed by QUICK_ACTIONS' own `actionId` (dashboard.controller.js)
   — same one-tint-per-card pattern as KPI_ACCENTS above.
========================================================== */

const ACTION_ACCENTS = {

    "institution-profile": "primary",
    "admin-management": "secondary",
    "departments": "info",
    "institution-settings": "default",
    "subscription-billing": "primary",
    "invite-team": "success"

};

/* ==========================================================
   Widget Accent Registry
========================================================== */

const WIDGET_ACCENTS = {

    billing: "primary",
    security: "secondary",
    activity: "info"

};

/* ==========================================================
   Widget Empty-State Copy
   ----------------------------------------------------------
   getInformationWidgets() only returns one line (`message`) —
   this registry supplies the second, explanatory line the
   empty state shows underneath it, same pattern Institution
   Admin's WIDGET_EMPTY_COPY uses.
========================================================== */

const WIDGET_EMPTY_COPY = {

    billing: "Plan, invoices, and payment history will appear here once billing is connected.",
    security: "Login activity, access changes, and security alerts will be listed here.",
    activity: "Actions taken across the institution will show up here as they happen."

};

const WIDGET_EMPTY_COPY_DEFAULT = "Updates will show up here once there's something to display.";

/* ==========================================================
   Institution Health — Status Band Registry
   ----------------------------------------------------------
   Phase 5 / Section 5 — Institution Health (V1.0)

   Maps `status.band` from dashboard.controller.js's
   getReadinessStatus() to the shared Badge component's own
   variants (shared/components/badge/badge.js — role, success,
   warning, danger, neutral only, no new variant added) and to
   this widget's own `.io-health-card--{band}` CSS modifier,
   which just sets `--health-accent` to the matching design
   token. Purely presentational, same pattern as WIDGET_ACCENTS
   etc. above — the controller never hands back a color.
========================================================== */

const HEALTH_BADGE_VARIANTS = {

    excellent: "success",
    good: "role",
    attention: "warning",
    critical: "danger"

};

/* ==========================================================
   Pending Tasks — Badge Registries
   ----------------------------------------------------------
   Phase 5 / Section 6 — Pending Tasks (V1.0)

   Same registry-not-inline-logic pattern as every accent map
   above. Maps dashboard.controller.js's `priority`/`status`
   strings to the shared Badge component's own variants — the
   controller never hands back a color, only the plain label.
========================================================== */

const TASK_PRIORITY_BADGE_VARIANTS = {

    High: "danger",
    Medium: "warning",
    Low: "neutral"

};

/* ----------------------------------------------------------
   Section 6 refinement — Task Icon Accent Registry
   ----------------------------------------------------------
   One tint per task (previously every task icon shared the
   same default blue) — same one-tint-per-card pattern as
   KPI_ACCENTS / ACTION_ACCENTS above, just keyed by task `id`
   instead of icon key since two tasks share an icon component
   (`security`) but need different accents. Reuses the existing
   six semantic tokens only — no new design tokens added.
   "Departments" (orange) maps to `warning`, the closest existing
   hue; "Academic Session" (indigo) maps to `secondary`, the
   closest existing hue — both reused rather than duplicated.
---------------------------------------------------------- */

const TASK_ACCENTS = {

    "complete-profile": "primary",
    "verify-documents": "secondary",
    "create-admin": "success",
    "create-departments": "warning",
    "add-faculty": "info",
    "import-students": "warning",
    "configure-session": "secondary",
    "publish-notice": "danger"

};

const TASK_STATUS_BADGE_VARIANTS = {

    "Completed": "success",
    "In Progress": "role",
    "Pending": "neutral"

};

/* ==========================================================
   Activity Type Accent Registry
   ----------------------------------------------------------
   Phase 5.7 — Section 4: Recent Activity

   Same pattern as KPI_ACCENTS / ACTION_ACCENTS / WIDGET_ACCENTS
   above — maps each ACTIVITY_TYPES key (dashboard.controller.js)
   to a semantic tint for that entry's icon tile. Purely
   presentational; getRecentActivity() only ever returns
   { type, description, timestamp }.
========================================================== */

const ACTIVITY_ACCENTS = {

    adminCreated: "success",
    facultyAdded: "info",
    studentImported: "warning",
    noticePublished: "danger",
    profileUpdated: "default",
    departmentCreated: "warning",
    settingsChanged: "default"

};

/* ==========================================================
   Indicator Icon Accent Registry
   ----------------------------------------------------------
   Icon Consistency Audit — every `.io-health-indicator-icon`
   row (Institution Health indicators, Security Overview
   indicators, Resource Usage rows, Subscription Usage rows)
   previously rendered with no per-icon tint at all — every row
   inherited the same flat default color regardless of category,
   so e.g. the Institution icon read blue in Quick Actions but
   plain/untinted inside Institution Health. Keyed by the same
   ICONS registry keys used everywhere else in this file, reusing
   the identical six semantic tokens KPI_ACCENTS/ACTION_ACCENTS/
   TASK_ACCENTS/ACTIVITY_ACCENTS already use — no new tokens.
========================================================== */

const INDICATOR_ACCENTS = {

    institution: "primary",
    admin: "success",
    departments: "warning",
    facultyAdded: "info",
    students: "warning",
    billing: "primary",
    security: "secondary",
    storage: "info",
    users: "primary",
    clock: "primary",
    readiness: "primary",
    failedAttempts: "danger",
    mfa: "success"

};

function indicatorAccentClass(iconKey) {

    return `io-health-indicator-icon--${INDICATOR_ACCENTS[iconKey] || "default"}`;

}

/* ==========================================================
   Subscription Overview — Badge & Accent Registries
   ----------------------------------------------------------
   Phase 5 / Section 7 — Subscription Overview (V1.0)

   Same registry-not-inline-logic pattern as every accent/badge
   map above. dashboard.controller.js's fetchSubscriptionOverview()
   only ever hands back plain enum strings (plan/status/
   billingStatus) — every color/tint mapping lives here.
========================================================== */

const SUBSCRIPTION_PLAN_BADGE_VARIANTS = {

    Free: "neutral",
    Starter: "role",
    Professional: "success",
    Enterprise: "warning"

};

const SUBSCRIPTION_STATUS_BADGE_VARIANTS = {

    Active: "success",
    Trial: "role",
    Expired: "danger",
    Suspended: "danger"

};

const SUBSCRIPTION_BILLING_BADGE_VARIANTS = {

    Paid: "success",
    Pending: "warning",
    Overdue: "danger",
    "N/A": "neutral"

};

// Maps `status` to the same `.io-dashboard-card--{accent}`
// modifier Sections 4/6 already established — no new CSS, just
// a different key set for this widget's own status enum.
const SUBSCRIPTION_STATUS_ACCENT = {

    Active: "success",
    Trial: "info",
    Expired: "danger",
    Suspended: "danger"

};

// Maps each `usage` key (dashboard.controller.js's
// fetchSubscriptionOverview()) to its icon-registry key.
const SUBSCRIPTION_USAGE_ICON_KEYS = {

    institutions: "institution",
    students: "students",
    faculty: "facultyAdded",
    storage: "storage"

};

/* ==========================================================
   Resource Usage — Badge & Accent Registries
   ----------------------------------------------------------
   Phase 5 / Section 8 — Resource Usage (V1.0)

   Same registry-not-inline-logic pattern as Section 7 above.
   dashboard.controller.js's fetchResourceUsage() only ever hands
   back plain enum strings (`status`) — every color/tint mapping
   lives here.
========================================================== */

const RESOURCE_STATUS_BADGE_VARIANTS = {

    Excellent: "success",
    Healthy: "role",
    Warning: "warning",
    Critical: "danger"

};

// CSS custom-property name each status maps to, set inline per
// row so the reused `.io-health-progress` bar (which already
// reads `var(--health-accent, var(--primary))`) tints by this
// widget's own status, without a single new CSS rule.
const RESOURCE_STATUS_ACCENT_VAR = {

    Excellent: "--success",
    Healthy: "--primary",
    Warning: "--warning",
    Critical: "--danger"

};

// Same `.io-dashboard-card--{accent}` modifiers Sections 4/6/7
// already use, keyed by the worst status found among this
// widget's resource rows.
const RESOURCE_CARD_ACCENT = {

    Excellent: "success",
    Healthy: "info",
    Warning: "warning",
    Critical: "danger"

};

// Reuses the exact same icon-registry keys Section 7's usage
// rows already established — no new icons.
const RESOURCE_USAGE_ICON_KEYS = {

    students: "students",
    faculty: "facultyAdded",
    storage: "storage"

};

/* ==========================================================
   Security Overview — Badge & Accent Registries
   ----------------------------------------------------------
   Phase 5 / Section 9 — Security Overview (V1.0, FINAL widget)

   Same registry-not-inline-logic pattern as Sections 7/8.
   dashboard.controller.js's fetchSecurityOverview() only ever
   hands back plain enum strings (`overallStatus`,
   `passwordStatus.strength`) or booleans (`mfa.enabled`) — every
   color/tint/band mapping lives here.
========================================================== */

// Maps this widget's own overallStatus enum onto the exact same
// `.io-health-card--{band}` classes (and HEALTH_BADGE_VARIANTS
// keys) Section 5 already established — no new CSS, no new badge
// registry, just a different key set feeding the same reuse.
const SECURITY_STATUS_BAND = {

    Excellent: "excellent",
    Healthy: "good",
    "Basic Security": "attention",
    Warning: "attention",
    Critical: "critical"

};

const PASSWORD_STRENGTH_BADGE_VARIANTS = {

    Strong: "success",
    Medium: "warning",
    Weak: "danger"

};

// Reuses `.io-activity-entry--{accent}` (Section 4's Recent
// Activity list) for Recent Security Events — no new CSS beyond
// the one --danger variant line Critical needs (the existing
// registry only had primary/secondary/info/success/warning/
// default).
const SECURITY_EVENT_ACCENTS = {

    info: "info",
    warning: "warning",
    critical: "danger"

};

/* ==========================================================
   Dashboard Template
========================================================== */

function DashboardPage() {

    return /* html */ `

        <section class="io-dashboard">

            <div id="ioWelcomeHeaderWrap" aria-busy="true">

                ${WelcomeHeaderSkeleton()}

            </div>

            <div id="ioKpiGridWrap" aria-busy="true">

                ${KpiGridSkeleton()}

            </div>

            <div id="ioQuickActionsWrap" aria-busy="true">

                ${QuickActionsSkeleton()}

            </div>

            <section class="io-dashboard-grid">

                ${getInformationWidgets().map((widget) =>
                    widget.icon === "activity"
                        ? /* html */ `<div id="ioActivityWidgetWrap" aria-busy="true">${ActivityWidgetSkeleton()}</div>`
                        : WidgetCard(widget)
                ).join("")}

            </section>

            <div id="ioHealthWrap" aria-busy="true">

                ${InstitutionHealthSkeleton()}

            </div>

            <div id="ioTasksWrap" aria-busy="true">

                ${PendingTasksSkeleton()}

            </div>

            <div id="ioSubscriptionWrap" aria-busy="true">

                ${SubscriptionOverviewSkeleton()}

            </div>

            <div id="ioResourceUsageWrap" aria-busy="true">

                ${ResourceUsageSkeleton()}

            </div>

            <div id="ioSecurityWrap" aria-busy="true">

                ${SecurityOverviewSkeleton()}

            </div>

        </section>

    `;

}

/* ==========================================================
   Section 1 — Welcome Header
   ----------------------------------------------------------
   Full spec field set:
     Greeting + Owner Name  -> .io-hero-greeting
     Institution Name       -> .io-hero-institution
     Verification Badge     -> .io-verify-badge (next to name)
     Institution Code       -> .io-hero-pill
     Academic Session       -> .io-hero-pill
     Current Date           -> .io-hero-pill
     Current Time           -> .io-hero-pill, live (see
                                startLiveClock() near render())
     Status (session)       -> .io-hero-status (unchanged)
========================================================== */

function WelcomeHero(banner) {

    return /* html */ `

        <section class="io-hero-card" role="region" aria-label="Welcome header">

            <div class="io-hero-decor" aria-hidden="true">
                <span class="io-hero-blob io-hero-blob-a"></span>
                <span class="io-hero-blob io-hero-blob-b"></span>
            </div>

            <div class="io-hero-main">

                <div class="io-hero-avatar">

                    <span class="io-hero-avatar-initial">${banner.institutionInitial}</span>

                    <span class="io-hero-avatar-badge" aria-hidden="true">
                        ${InstitutionIcon()}
                    </span>

                </div>

                <div class="io-hero-content">

                    <div class="io-hero-top">

                        <h2 class="io-hero-greeting">${formatGreetingLine(banner)}</h2>

                        <span class="io-hero-status">
                            <span class="io-hero-status-dot"></span>
                            ${banner.statusLabel}
                        </span>

                    </div>

                    <div class="io-hero-institution-row">

                        <p class="io-hero-institution">${banner.institutionName}</p>

                        ${VerificationBadge(banner.isVerified)}

                    </div>

                    <div class="io-hero-meta">

                        <span class="io-hero-pill" title="Institution code">Code: ${banner.institutionCode}</span>

                        <span class="io-hero-pill" title="Academic session">Session: ${banner.academicSession}</span>

                        <span class="io-hero-pill" title="Current date">${banner.currentDate}</span>

                        <span class="io-hero-pill" id="ioHeroTime" title="Current time">${ClockIcon()} <span id="ioHeroTimeValue">${banner.currentTime}</span></span>

                    </div>

                </div>

            </div>

            <div class="io-hero-icon" aria-hidden="true">

                ${SparklesIcon()}

            </div>

        </section>

    `;

}

/**
 * "Good Morning" alone when there's no real owner name yet
 * (honest placeholder, no invented name), "Good Morning, Asha"
 * once a real session/profile source supplies one.
 */
function formatGreetingLine(banner) {

    const hasOwnerName = banner.ownerName && banner.ownerName !== "—";

    return hasOwnerName
        ? `${banner.greeting}, ${banner.ownerName}`
        : banner.greeting;

}

/**
 * Verified / Pending Verification badge. Reuses ShieldCheckIcon
 * (already imported for the KPI grid) and ClockIcon — no new
 * icon assets. Defaults to "pending", never a fake "verified"
 * state, per the no-seeded-data rule.
 */
function VerificationBadge(isVerified) {

    const label = isVerified ? "Verified" : "Pending Verification";

    return /* html */ `

        <span
            class="io-verify-badge io-verify-badge--${isVerified ? "verified" : "pending"}"
            role="status"
            aria-label="Institution ${isVerified ? "verified" : "verification pending"}"
        >

            <span class="io-verify-badge-icon" aria-hidden="true">
                ${isVerified ? ShieldCheckIcon() : ClockIcon()}
            </span>

            <span class="io-verify-badge-label">${label}</span>

        </span>

    `;

}

/* ==========================================================
   Section 1 — Welcome Header Skeleton
   ----------------------------------------------------------
   Composed entirely from BaseSkeleton primitives (same
   composition approach shared/components/skeleton/card/
   card.skeleton.js uses) sized to roughly match the real hero
   card, so there's no layout jump on swap. No new skeleton
   primitive component created — reuse only.
========================================================== */

function WelcomeHeaderSkeleton() {

    return /* html */ `

        <div class="io-hero-card io-hero-skeleton" aria-hidden="true">

            <div class="io-hero-main">

                ${BaseSkeleton.circle(64)}

                <div class="io-hero-skeleton-lines">

                    ${BaseSkeleton.rounded("220px", "28px")}

                    ${BaseSkeleton.rounded("160px", "18px")}

                    <div class="io-hero-skeleton-pills">
                        ${BaseSkeleton.rounded("90px", "24px", "var(--radius-full)")}
                        ${BaseSkeleton.rounded("110px", "24px", "var(--radius-full)")}
                        ${BaseSkeleton.rounded("140px", "24px", "var(--radius-full)")}
                        ${BaseSkeleton.rounded("90px", "24px", "var(--radius-full)")}
                    </div>

                </div>

            </div>

        </div>

    `;

}

/* ==========================================================
   Section 1 — Welcome Header Error State
========================================================== */

function WelcomeHeaderErrorState() {

    return /* html */ `

        <div class="io-hero-card io-hero-error" role="alert">

            Failed to load welcome header.

        </div>

    `;

}

/* ==========================================================
   Section 2 — KPI Grid
   ----------------------------------------------------------
   Phase 5 / Section 2 — KPI Cards (V1.0)
   Reuses the Welcome Header's loading pattern from Section 1
   rather than a new one: skeleton in #ioKpiGridWrap, fetched
   via dashboard.controller.js's fetchQuickStats() (Firestore-
   ready, same shape as fetchWelcomeBannerData()), faded in via
   the same Animation.fadeOut/fadeIn sequence — see
   loadKpiGrid() near render() below. Card markup itself
   (io-kpi-card, accent tint, icon badge) is unchanged from
   before.
========================================================== */

function QuickStatistics(stats) {

    return /* html */ `

        <section class="io-kpi-grid" role="region" aria-label="Key performance indicators">

            ${stats.map((stat) => /* html */ `

                <div class="co-card io-kpi-card io-kpi-card--${KPI_ACCENTS[stat.icon] || "default"}" id="${stat.id}">

                    <div class="io-icon-badge io-icon-badge-kpi">

                        ${renderIcon(stat.icon)}

                    </div>

                    <div class="io-kpi-body">

                        <span class="io-kpi-label">${stat.label}</span>

                        <h3 class="io-kpi-value">${stat.value}</h3>

                        <span class="io-kpi-trend">${stat.trend}</span>

                    </div>

                </div>

            `).join("")}

        </section>

    `;

}

/* ==========================================================
   Section 2 — KPI Grid Skeleton
   ----------------------------------------------------------
   Four placeholder cards inside the real `.io-kpi-grid`/
   `.io-kpi-card` classes (so sizing/spacing/columns match the
   real grid exactly, no layout jump on swap) — only the inner
   content is BaseSkeleton primitives, same composition approach
   Section 1's WelcomeHeaderSkeleton() uses.
========================================================== */

function KpiGridSkeleton() {

    return /* html */ `

        <section class="io-kpi-grid io-kpi-skeleton" aria-hidden="true">

            ${Array.from({ length: 4 }, () => /* html */ `

                <div class="co-card io-kpi-card">

                    ${BaseSkeleton.circle(40)}

                    <div class="io-kpi-body">

                        ${BaseSkeleton.rounded("70%", "12px")}

                        ${BaseSkeleton.rounded("50%", "22px")}

                        ${BaseSkeleton.rounded("85%", "12px")}

                    </div>

                </div>

            `).join("")}

        </section>

    `;

}

/* ==========================================================
   Section 2 — KPI Grid Error State
========================================================== */

function KpiGridErrorState() {

    return /* html */ `

        <div class="io-hero-error" role="alert">

            Failed to load KPI cards.

        </div>

    `;

}

/* ==========================================================
   Section 3 — Quick Actions
   ----------------------------------------------------------
   Phase 5 / Section 3 — Quick Actions (V1.0)
   Same four-step loading pattern as Sections 1-2: skeleton in
   #ioQuickActionsWrap, fetched via dashboard.controller.js's
   fetchQuickActions() (Firestore-ready, same shape as
   fetchWelcomeBannerData()/fetchQuickStats()), faded in via the
   same Animation.fadeOut/fadeIn sequence — see loadQuickActions()
   near render() below. An empty QUICK_ACTIONS list renders
   QuickActionsEmptyState() instead of an empty grid; a fetch
   failure renders QuickActionsErrorState().

   Card markup itself is unchanged from before — only the data
   source (actionId-keyed config, not MODULES) and the loading
   lifecycle around it changed.
========================================================== */

function QuickActionsSection(actions) {

    return /* html */ `

        <section class="io-quick-actions" role="region" aria-labelledby="ioQuickActionsHeading">

            <h3 class="io-section-title" id="ioQuickActionsHeading">Quick Actions</h3>

            <div class="io-action-grid">

                ${actions.map((action) => {

                    const available = Boolean(action.moduleId);

                    return /* html */ `

                        <button
                            type="button"
                            class="co-card io-action-card io-action-card--${ACTION_ACCENTS[action.actionId] || "default"}${available ? "" : " io-action-card--unavailable"}"
                            id="${action.id}"
                            data-action-id="${action.actionId}"
                            ${available ? "" : "disabled aria-disabled=\"true\""}
                            aria-label="${action.label}: ${available ? action.subtitle : "Module not available yet"}"
                        >

                            <div class="io-icon-badge io-icon-badge-action" aria-hidden="true">

                                ${renderIcon(action.icon)}

                            </div>

                            <div class="io-action-text">

                                <span class="io-action-title">${action.label}</span>

                                <span class="io-action-subtitle">${action.subtitle}</span>

                                ${available ? "" : Badge({ text: "Not Available Yet", variant: "neutral" })}

                            </div>

                            ${available ? /* html */ `

                                <span class="io-action-arrow" aria-hidden="true">

                                    ${ChevronDownIcon()}

                                </span>

                            ` : ""}

                        </button>

                    `;

                }).join("")}

            </div>

        </section>

    `;

}

/* ==========================================================
   Section 3 — Quick Actions Skeleton
   ----------------------------------------------------------
   Six placeholder cards inside the real `.io-action-grid`/
   `.io-action-card` classes (so sizing/spacing/columns match
   the real grid exactly, no layout jump on swap) — only the
   inner content is BaseSkeleton primitives, same composition
   approach Section 2's KpiGridSkeleton() uses.
========================================================== */

function QuickActionsSkeleton() {

    return /* html */ `

        <section class="io-quick-actions io-quick-actions-skeleton" aria-hidden="true">

            <h3 class="io-section-title">Quick Actions</h3>

            <div class="io-action-grid">

                ${Array.from({ length: 6 }, () => /* html */ `

                    <div class="co-card io-action-card">

                        ${BaseSkeleton.circle(48)}

                        <div class="io-action-text">

                            ${BaseSkeleton.rounded("70%", "16px")}

                            ${BaseSkeleton.rounded("90%", "12px")}

                        </div>

                    </div>

                `).join("")}

            </div>

        </section>

    `;

}

/* ==========================================================
   Section 3 — Quick Actions Empty State
   ----------------------------------------------------------
   Reuses the exact `.io-dash-empty` primitive Section 4's
   WidgetCard() already established, rather than a new
   empty-state implementation — per the no-duplicate-empty-
   states rule. Only reachable if fetchQuickActions() ever
   resolves an empty list.
========================================================== */

function QuickActionsEmptyState() {

    return /* html */ `

        <section class="io-quick-actions" role="region" aria-labelledby="ioQuickActionsHeading">

            <h3 class="io-section-title" id="ioQuickActionsHeading">Quick Actions</h3>

            <div class="co-card io-dashboard-card io-dashboard-card--default">

                <div class="io-dash-empty">

                    <div class="io-dash-empty-icon" aria-hidden="true">

                        ${LayersIcon()}

                    </div>

                    <p class="io-dash-empty-title">No quick actions available yet.</p>

                    <p class="io-dash-empty-description">Actions will appear here once they're configured for your institution.</p>

                </div>

            </div>

        </section>

    `;

}

/* ==========================================================
   Section 3 — Quick Actions Error State
========================================================== */

function QuickActionsErrorState() {

    return /* html */ `

        <div class="io-hero-error" role="alert">

            Failed to load Quick Actions.

        </div>

    `;

}

/* ==========================================================
   Section 4 — Information Widgets
========================================================== */

function WidgetCard(widget, entries = []) {

    const accent = WIDGET_ACCENTS[widget.icon] || "default";

    const description = WIDGET_EMPTY_COPY[widget.icon] || WIDGET_EMPTY_COPY_DEFAULT;

    // Phase 5.7 — Section 4: only the "activity" widget has a
    // real data source. Business Snapshot / Security & Access are
    // always called with no second argument, so `entries` stays
    // `[]` for them — same empty state as before, no data source
    // yet. Phase 3.8A: the Activity widget no longer reads
    // getRecentActivity() in here directly — its own loader
    // (loadActivityWidget() near render() below) awaits
    // fetchActivityWidgetData() and passes the resolved `entries`
    // in, so this function stays a pure renderer either way.

    return /* html */ `

        <div class="co-card io-dashboard-card io-dashboard-card--${accent}" id="${widget.id}">

            <div class="io-widget-header">

                <div class="io-icon-badge io-icon-badge-widget" aria-hidden="true">

                    ${renderIcon(widget.icon)}

                </div>

                <h3 class="io-section-title">${widget.title}</h3>

            </div>

            ${entries.length ? /* html */ `

                <div class="io-activity-list" role="list">

                    ${entries.map(ActivityEntry).join("")}

                </div>

            ` : /* html */ `

                <div class="io-dash-empty">

                    <div class="io-dash-empty-icon" aria-hidden="true">

                        ${renderIcon(widget.icon)}

                    </div>

                    <p class="io-dash-empty-title">${widget.message}</p>

                    <p class="io-dash-empty-description">${description}</p>

                </div>

            `}

        </div>

    `;

}

/* ==========================================================
   Recent Activity — Entry Renderer
   ----------------------------------------------------------
   Phase 5.7 — Section 4: Recent Activity

   One entry = { type, description?, timestamp? } from
   getRecentActivity(). `type` must be a key in ACTIVITY_TYPES
   (dashboard.controller.js); unknown types render nothing
   rather than a broken row, so a bad Firestore doc can't corrupt
   the list.
========================================================== */

function ActivityEntry(entry) {

    const meta = ACTIVITY_TYPES[entry.type];

    if (!meta) return "";

    const accent = ACTIVITY_ACCENTS[entry.type] || "default";

    return /* html */ `

        <div class="io-activity-entry io-activity-entry--${accent}" role="listitem">

            <div class="io-icon-badge io-icon-badge-activity" aria-hidden="true">

                ${renderIcon(meta.icon)}

            </div>

            <div class="io-activity-entry-body">

                <span class="io-activity-entry-title">${meta.label}</span>

                ${entry.description ? `<span class="io-activity-entry-desc">${entry.description}</span>` : ""}

            </div>

            ${entry.timestamp ? `<span class="io-activity-entry-time">${entry.timestamp}</span>` : ""}

        </div>

    `;

}

/* ==========================================================
   Section 4 — Recent Activity Widget Skeleton
   ----------------------------------------------------------
   Phase 3.8A — Activity Widget Reliability (Critical Issue 1)

   Only the Activity widget gets this treatment — Business
   Snapshot and Security & Access have no real data source yet,
   so they still mount synchronously via WidgetCard() with no
   loading step, unchanged. Sized to roughly match a loaded
   WidgetCard (header + a few activity rows) so there's no layout
   jump on swap, same composition approach every other section's
   skeleton in this file already uses.
========================================================== */

function ActivityWidgetSkeleton() {

    return /* html */ `

        <div class="co-card io-dashboard-card io-dashboard-card--info io-activity-widget-skeleton" aria-hidden="true">

            <div class="io-widget-header">

                ${BaseSkeleton.circle(40)}

                ${BaseSkeleton.rounded("140px", "20px")}

            </div>

            <div class="io-activity-list" role="list">

                ${[0, 1, 2].map(() => /* html */ `

                    <div class="io-activity-entry">

                        ${BaseSkeleton.circle(36)}

                        <div class="io-activity-entry-body">

                            ${BaseSkeleton.rounded("70%", "14px")}

                            ${BaseSkeleton.rounded("40%", "10px")}

                        </div>

                    </div>

                `).join("")}

            </div>

        </div>

    `;

}

/* ==========================================================
   Section 4 — Recent Activity Widget Error State
   ----------------------------------------------------------
   Phase 3.8A — Activity Widget Reliability (Critical Issue 2)

   A dedicated error state so a fetch failure can never render
   as "No recent activity yet." — that empty-state copy is
   reserved for genuine no-data. Reuses the exact `.io-hero-error`
   alert primitive every other section's error state in this file
   already uses (WelcomeHeaderErrorState(), InstitutionHealthErrorState(),
   SecurityOverviewErrorState(), ...) — no new CSS, no redesign.
========================================================== */

function ActivityWidgetErrorState() {

    return /* html */ `

        <div class="io-hero-error" role="alert">

            Unable to load activity. Retry later.

        </div>

    `;

}

/* ==========================================================
   Section 5 — Institution Health
   ----------------------------------------------------------
   Phase 5 / Section 5 — Institution Health (V1.0)

   Same independent skeleton -> async loader -> success/empty/
   error lifecycle as Sections 1-3 (own #ioHealthWrap, own
   loadInstitutionHealth() near render() below, own error state)
   — reused, not reinvented. Unlike Section 4's widgets, this one
   has a real (controller-computed) Empty state: whenever
   fetchInstitutionHealth() resolves `started: false`,
   InstitutionHealthEmptyState() renders instead of the score
   card. No Firestore access here — the widget only ever consumes
   the `{ started, score, status, indicators }` shape
   dashboard.controller.js's fetchInstitutionHealth() hands back;
   every percentage and label already comes calculated.
========================================================== */

function InstitutionHealthCard(health) {

    const badgeVariant = HEALTH_BADGE_VARIANTS[health.status.band] || "neutral";

    return /* html */ `

        <section
            class="co-card io-health-card io-health-card--${health.status.band}"
            role="region"
            aria-labelledby="ioHealthHeading"
        >

            <div class="io-health-top">

                <div class="io-widget-header">

                    <div class="io-icon-badge io-icon-badge-widget" aria-hidden="true">

                        ${renderIcon("readiness")}

                    </div>

                    <h3 class="io-section-title" id="ioHealthHeading">Institution Health</h3>

                </div>

                ${Badge({ text: health.status.label, variant: badgeVariant })}

            </div>

            <div class="io-health-score-row">

                <div
                    class="io-health-score-ring"
                    style="--health-score:${health.score}"
                    role="img"
                    aria-label="Overall institution readiness: ${health.score} percent, ${health.status.label}"
                >

                    <span class="io-health-score-value">${health.score}%</span>

                </div>

                <p class="io-health-score-caption">Overall Institution Readiness</p>

            </div>

            <div class="io-health-indicators" role="list">

                ${health.indicators.map(HealthIndicatorRow).join("")}

            </div>

        </section>

    `;

}

/**
 * One indicator row. `type: "progress"` (only Institution Profile
 * Completion today) gets an actual progress bar since its value
 * is a real completion percentage; every other, inherently
 * binary indicator (verified or not, admins added or not, etc.)
 * gets a Complete/Pending status pill instead — a bar that can
 * only ever read 0% or 100% isn't a meaningful bar, per the
 * Section 5 spec.
 */
function HealthIndicatorRow(indicator) {

    return /* html */ `

        <div class="io-health-indicator" role="listitem">

            <div class="io-icon-badge io-icon-badge-widget io-health-indicator-icon ${indicatorAccentClass(indicator.icon)}" aria-hidden="true">

                ${renderIcon(indicator.icon)}

            </div>

            <div class="io-health-indicator-body">

                <div class="io-health-indicator-top">

                    <span class="io-health-indicator-label">${indicator.label}</span>

                    ${indicator.type === "progress"
                        ? `<span class="io-health-indicator-percent">${indicator.value}%</span>`
                        : Badge({
                            text: indicator.ok ? "Complete" : "Pending",
                            variant: indicator.ok ? "success" : "neutral"
                        })}

                </div>

                ${indicator.type === "progress" ? /* html */ `

                    <div
                        class="io-health-progress"
                        role="progressbar"
                        aria-valuenow="${indicator.value}"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-label="${indicator.label}"
                    >

                        <div class="io-health-progress-fill" style="width:${indicator.value}%"></div>

                    </div>

                ` : ""}

                <span class="io-health-indicator-detail">${indicator.detail}</span>

            </div>

        </div>

    `;

}

/* ==========================================================
   Section 5 — Institution Health Skeleton
   ----------------------------------------------------------
   Composed from BaseSkeleton primitives sized to roughly match
   the real card (score ring + four indicator rows), same
   approach every other section's skeleton above uses — no
   layout jump on swap.
========================================================== */

function InstitutionHealthSkeleton() {

    return /* html */ `

        <div class="co-card io-health-card io-health-skeleton" aria-hidden="true">

            <div class="io-health-top">

                <div class="io-widget-header">

                    ${BaseSkeleton.circle(40)}

                    ${BaseSkeleton.rounded("180px", "20px")}

                </div>

                ${BaseSkeleton.rounded("90px", "24px", "var(--radius-full)")}

            </div>

            <div class="io-health-score-row">

                ${BaseSkeleton.circle(96)}

                ${BaseSkeleton.rounded("200px", "14px")}

            </div>

            <div class="io-health-indicators">

                ${Array.from({ length: 4 }, () => /* html */ `

                    <div class="io-health-indicator">

                        ${BaseSkeleton.circle(36)}

                        <div class="io-health-indicator-body">

                            ${BaseSkeleton.rounded("60%", "14px")}

                            ${BaseSkeleton.rounded("100%", "8px")}

                        </div>

                    </div>

                `).join("")}

            </div>

        </div>

    `;

}

/* ==========================================================
   Section 5 — Institution Health Empty State
   ----------------------------------------------------------
   Reaches this whenever fetchInstitutionHealth() resolves
   `started: false` — professional onboarding guidance rather
   than a 0% score card, per the Section 5 spec. Reuses the exact
   `.io-dash-empty` primitive Section 4's WidgetCard() already
   established, not a new empty-state implementation.
========================================================== */

function InstitutionHealthEmptyState() {

    return /* html */ `

        <section
            class="co-card io-dashboard-card io-dashboard-card--default io-health-card io-health-card--empty"
            role="region"
            aria-label="Institution Health"
        >

            <div class="io-widget-header">

                <div class="io-icon-badge io-icon-badge-widget" aria-hidden="true">

                    ${renderIcon("readiness")}

                </div>

                <h3 class="io-section-title">Institution Health</h3>

            </div>

            <div class="io-dash-empty">

                <div class="io-dash-empty-icon" aria-hidden="true">

                    ${renderIcon("institution")}

                </div>

                <p class="io-dash-empty-title">Institution setup hasn't started yet.</p>

                <p class="io-dash-empty-description">Complete your institution profile, add admins, departments, and student/faculty data to see your readiness score here.</p>

            </div>

        </section>

    `;

}

/* ==========================================================
   Section 5 — Institution Health Error State
========================================================== */

function InstitutionHealthErrorState() {

    return /* html */ `

        <div class="io-hero-error" role="alert">

            Failed to load Institution Health.

        </div>

    `;

}

/* ==========================================================
   Section 6 — Pending Tasks
   ----------------------------------------------------------
   Phase 5 / Section 6 — Pending Tasks (V1.0)

   Same independent skeleton -> async loader -> success/empty/
   error lifecycle as Sections 1-3 and 5 (own #ioTasksWrap, own
   loadPendingTasks() near render() below, own error state). No
   Firestore access here — the widget only ever consumes the
   task array dashboard.controller.js's fetchPendingTasks() hands
   back; `status`/`completed`/`available` already arrive computed.
   A task's CTA is a plain reuse of the shared Button component
   (shared/components/button/button.js), disabled whenever
   `task.available` is false — no "Coming Soon", no dead click.
========================================================== */

function PendingTasksSection(tasks, progress) {

    const { completedTasks, totalTasks, completionPercentage } = progress;

    return /* html */ `

        <section class="co-card io-dashboard-card io-dashboard-card--default io-tasks-card" role="region" aria-labelledby="ioTasksHeading">

            <div class="io-widget-header">

                <div class="io-icon-badge io-icon-badge-widget" aria-hidden="true">

                    ${renderIcon("activity")}

                </div>

                <h3 class="io-section-title" id="ioTasksHeading">Pending Tasks</h3>

            </div>

            <div class="io-tasks-progress">

                <div class="io-tasks-progress-top">

                    <span class="io-tasks-progress-label">Institution Setup Progress</span>

                    <span class="io-tasks-progress-count">${completedTasks} / ${totalTasks} Completed</span>

                </div>

                <div
                    class="io-health-progress"
                    role="progressbar"
                    aria-valuenow="${completionPercentage}"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-label="Institution Setup Progress"
                >

                    <div class="io-health-progress-fill" style="width:${completionPercentage}%"></div>

                </div>

            </div>

            <div class="io-task-list" role="list">

                ${tasks.map(TaskRow).join("")}

            </div>

        </section>

    `;

}

function TaskRow(task) {

    const accent = TASK_ACCENTS[task.id] || "primary";
    const priorityClass = `io-task-row--${task.priority.toLowerCase()}`;

    return /* html */ `

        <div class="io-task-row ${priorityClass}${task.completed ? " io-task-row--completed" : ""}" role="listitem" id="ioTask-${task.id}">

            <div class="io-icon-badge io-icon-badge-widget io-task-icon io-task-icon--${accent}" aria-hidden="true">

                ${renderIcon(task.icon)}

            </div>

            <div class="io-task-body">

                <div class="io-task-top">

                    <span class="io-task-title">${task.title}</span>

                    <div class="io-task-badges">

                        ${Badge({ text: task.priority, variant: TASK_PRIORITY_BADGE_VARIANTS[task.priority] || "neutral" })}

                        ${Badge({ text: task.status, variant: TASK_STATUS_BADGE_VARIANTS[task.status] || "neutral" })}

                    </div>

                </div>

                <p class="io-task-description">${task.description}</p>

            </div>

            <div class="io-task-cta">

                ${Button({
                    id: `ioTaskAction-${task.id}`,
                    text: task.available ? task.actionLabel : "Coming Soon",
                    variant: "primary",
                    disabled: !task.available
                })}

            </div>

        </div>

    `;

}

/* ==========================================================
   Section 6 — Pending Tasks Skeleton
========================================================== */

function PendingTasksSkeleton() {

    return /* html */ `

        <div class="co-card io-dashboard-card io-dashboard-card--default io-tasks-card io-tasks-skeleton" aria-hidden="true">

            <div class="io-widget-header">

                ${BaseSkeleton.circle(40)}

                ${BaseSkeleton.rounded("140px", "20px")}

            </div>

            <div class="io-tasks-progress">

                ${BaseSkeleton.rounded("100%", "34px", "var(--radius-md)")}

            </div>

            <div class="io-task-list">

                ${Array.from({ length: 4 }, () => /* html */ `

                    <div class="io-task-row">

                        ${BaseSkeleton.circle(40)}

                        <div class="io-task-body">

                            ${BaseSkeleton.rounded("70%", "16px")}

                            ${BaseSkeleton.rounded("95%", "12px")}

                        </div>

                        ${BaseSkeleton.rounded("110px", "40px", "var(--radius-md)")}

                    </div>

                `).join("")}

            </div>

        </div>

    `;

}

/* ==========================================================
   Section 6 — Pending Tasks Empty State
   ----------------------------------------------------------
   Reaches this whenever every resolved task is `completed` —
   a premium "all caught up" success state, not a plain empty
   list. Reuses `.io-dash-empty` verbatim, only its icon tile
   gets a success tint (`.io-dashboard-card--success`, same
   modifier Section 4's WIDGET_ACCENTS already established) since
   this particular empty state is a positive one.
========================================================== */

function PendingTasksEmptyState() {

    return /* html */ `

        <section class="co-card io-dashboard-card io-dashboard-card--success io-tasks-card" role="region" aria-label="Pending Tasks">

            <div class="io-widget-header">

                <div class="io-icon-badge io-icon-badge-widget" aria-hidden="true">

                    ${renderIcon("activity")}

                </div>

                <h3 class="io-section-title">Pending Tasks</h3>

            </div>

            <div class="io-dash-empty">

                <div class="io-dash-empty-icon" aria-hidden="true">

                    ${CheckIcon()}

                </div>

                <p class="io-dash-empty-title">🎉 Institution Setup Complete</p>

                <p class="io-dash-empty-description">Your institution is ready.</p>

                <div class="io-tasks-celebrate-actions">

                    ${Button({ id: "ioTasksOpenDashboard", text: "Open Dashboard", variant: "primary", disabled: true })}

                    ${Button({ id: "ioTasksExplore", text: "Explore CampusOne", variant: "secondary", disabled: true })}

                </div>

            </div>

        </section>

    `;

}

/* ==========================================================
   Section 6 — Pending Tasks Error State
========================================================== */

function PendingTasksErrorState() {

    return /* html */ `

        <div class="io-hero-error" role="alert">

            Failed to load Pending Tasks.

        </div>

    `;

}

/* ==========================================================
   Section 7 — Subscription Overview
   ----------------------------------------------------------
   Phase 5 / Section 7 — Subscription Overview (V1.0)

   Same independent skeleton -> async loader -> success/empty/
   error lifecycle as every section above (own #ioSubscriptionWrap,
   own loadSubscriptionOverview() near render() below, own error
   state). No Firestore access here — the widget only ever
   consumes the exact `{ plan, status, renewalDate, daysRemaining,
   billingStatus, trial, usage, actions, hasPlan }` shape
   dashboard.controller.js's fetchSubscriptionOverview() hands
   back; the widget performs zero subscription calculations —
   days remaining, plan status, and billing state all arrive
   already computed, per the Section 7 spec.

   This is explicitly NOT a billing widget — no invoice history,
   no payment form, nothing beyond plan/entitlement/renewal
   health and a CTA area gated on module availability.
========================================================== */

function SubscriptionOverviewCard(subscription) {

    const accent = SUBSCRIPTION_STATUS_ACCENT[subscription.status] || "default";
    const moduleAvailable = Boolean(subscription.actions.moduleId);

    return /* html */ `

        <section
            class="co-card io-dashboard-card io-dashboard-card--${accent} io-sub-card"
            role="region"
            aria-labelledby="ioSubHeading"
        >

            <div class="io-widget-header">

                <div class="io-icon-badge io-icon-badge-widget" aria-hidden="true">

                    ${renderIcon("billing")}

                </div>

                <h3 class="io-section-title" id="ioSubHeading">Subscription Overview</h3>

            </div>

            <div class="io-task-badges" style="margin-bottom:var(--space-16)">

                ${Badge({ text: subscription.plan, variant: SUBSCRIPTION_PLAN_BADGE_VARIANTS[subscription.plan] || "neutral" })}

                ${Badge({ text: subscription.status, variant: SUBSCRIPTION_STATUS_BADGE_VARIANTS[subscription.status] || "neutral" })}

                ${Badge({ text: subscription.billingStatus, variant: SUBSCRIPTION_BILLING_BADGE_VARIANTS[subscription.billingStatus] || "neutral" })}

                ${subscription.trial.active
                    ? Badge({ text: `Trial: ${subscription.trial.daysRemaining} day(s) left`, variant: "role" })
                    : ""}

            </div>

            <div class="io-sub-meta">

                <span class="io-sub-pill" title="Renewal date">${CalendarIcon()} Renews: ${subscription.renewalDate}</span>

                <span class="io-sub-pill" title="Days remaining">${ClockIcon()} ${subscription.daysRemaining !== null ? `${subscription.daysRemaining} day(s) remaining` : "—"}</span>

            </div>

            <div class="io-sub-usage">

                <p class="io-sub-usage-heading">Usage Summary</p>

                <div class="io-health-indicators" role="list">

                    ${Object.entries(subscription.usage)
                        .map(([key, item]) => SubscriptionUsageRow(key, item))
                        .join("")}

                </div>

            </div>

            <div class="io-sub-cta">

                ${Button({
                    id: "ioSubUpgradeBtn",
                    text: "Upgrade Plan",
                    variant: "primary",
                    disabled: !(subscription.actions.canUpgrade && moduleAvailable)
                })}

                ${Button({
                    id: "ioSubManageBtn",
                    text: "Manage Subscription",
                    variant: "secondary",
                    disabled: !(subscription.actions.canManageSubscription && moduleAvailable)
                })}

                ${!moduleAvailable ? Badge({ text: "Not Available Yet", variant: "neutral" }) : ""}

            </div>

        </section>

    `;

}

/**
 * One usage row. Reuses `.io-health-indicator*` (Section 5)
 * wholesale — same icon + label + detail shape, just a plain
 * value in place of a progress bar, since no real usage limit
 * exists yet to make a bar meaningful.
 */
function SubscriptionUsageRow(key, item) {

    const iconKey = SUBSCRIPTION_USAGE_ICON_KEYS[key] || "billing";

    return /* html */ `

        <div class="io-health-indicator" role="listitem">

            <div class="io-icon-badge io-icon-badge-widget io-health-indicator-icon ${indicatorAccentClass(iconKey)}" aria-hidden="true">

                ${renderIcon(iconKey)}

            </div>

            <div class="io-health-indicator-body">

                <div class="io-health-indicator-top">

                    <span class="io-health-indicator-label">${item.label}</span>

                    <span class="io-health-indicator-percent">${item.value}</span>

                </div>

                <span class="io-health-indicator-detail">${item.detail}</span>

            </div>

        </div>

    `;

}

/* ==========================================================
   Section 7 — Subscription Overview Skeleton
========================================================== */

function SubscriptionOverviewSkeleton() {

    return /* html */ `

        <div class="co-card io-dashboard-card io-dashboard-card--default io-sub-card io-sub-skeleton" aria-hidden="true">

            <div class="io-widget-header">

                ${BaseSkeleton.circle(40)}

                ${BaseSkeleton.rounded("200px", "20px")}

            </div>

            <div class="io-task-badges" style="margin-bottom:var(--space-16)">

                ${BaseSkeleton.rounded("70px", "24px", "var(--radius-full)")}

                ${BaseSkeleton.rounded("70px", "24px", "var(--radius-full)")}

                ${BaseSkeleton.rounded("70px", "24px", "var(--radius-full)")}

            </div>

            <div class="io-sub-meta">

                ${BaseSkeleton.rounded("140px", "32px", "var(--radius-full)")}

                ${BaseSkeleton.rounded("160px", "32px", "var(--radius-full)")}

            </div>

            <div class="io-health-indicators">

                ${Array.from({ length: 4 }, () => /* html */ `

                    <div class="io-health-indicator">

                        ${BaseSkeleton.circle(36)}

                        <div class="io-health-indicator-body">

                            ${BaseSkeleton.rounded("60%", "14px")}

                            ${BaseSkeleton.rounded("100%", "8px")}

                        </div>

                    </div>

                `).join("")}

            </div>

            <div class="io-sub-cta">

                ${BaseSkeleton.rounded("140px", "54px", "var(--radius-md)")}

                ${BaseSkeleton.rounded("180px", "54px", "var(--radius-md)")}

            </div>

        </div>

    `;

}

/* ==========================================================
   Section 7 — Subscription Overview Empty State
   ----------------------------------------------------------
   Reaches this whenever fetchSubscriptionOverview() resolves
   `hasPlan: false` — which is the live path today: no
   subscription document exists yet, so the controller honestly
   resolves `plan`/`status` as `null` rather than assuming an
   active Free plan (approved Case B), same discipline Section 5's
   Empty state already follows for `started: false`. Reuses
   `.io-dash-empty` verbatim, exactly like Section 5.
========================================================== */

function SubscriptionOverviewEmptyState() {

    return /* html */ `

        <section
            class="co-card io-dashboard-card io-dashboard-card--default io-sub-card"
            role="region"
            aria-label="Subscription Overview"
        >

            <div class="io-widget-header">

                <div class="io-icon-badge io-icon-badge-widget" aria-hidden="true">

                    ${renderIcon("billing")}

                </div>

                <h3 class="io-section-title">Subscription Overview</h3>

            </div>

            <div class="io-dash-empty">

                <div class="io-dash-empty-icon" aria-hidden="true">

                    ${renderIcon("billing")}

                </div>

                <p class="io-dash-empty-title">No subscription plan found.</p>

                <p class="io-dash-empty-description">Plan, renewal, and usage details will appear here once a subscription is set up.</p>

            </div>

        </section>

    `;

}

/* ==========================================================
   Section 7 — Subscription Overview Error State
========================================================== */

function SubscriptionOverviewErrorState() {

    return /* html */ `

        <div class="io-hero-error" role="alert">

            Failed to load Subscription Overview.

        </div>

    `;

}

/* ==========================================================
   Section 8 — Resource Usage
   ----------------------------------------------------------
   Phase 5 / Section 8 — Resource Usage (V1.0)

   NOT a storage widget — a quick operational view of resource
   utilization against the current subscription. Same independent
   skeleton -> async loader -> success/empty/error lifecycle as
   every section above (own #ioResourceUsageWrap, own
   loadResourceUsage() near render() below, own error state). No
   Firestore access here — the widget only ever consumes the
   exact `{ hasSubscription, resources }` shape
   dashboard.controller.js's fetchResourceUsage() hands back; the
   widget performs ZERO utilization calculations — used, limit,
   utilization %, and status all arrive already computed, per the
   Section 8 spec. Every row reuses `.io-health-progress` /
   `.io-health-progress-fill` (Section 5's progress bar) verbatim
   — no second progress component.
========================================================== */

function ResourceUsageCard(data) {

    // Presentation-only: picks which already-computed status is
    // "worst" among this render's rows to pick a card accent — no
    // recomputation of any resource's own status.
    const worstStatus = ["Critical", "Warning", "Healthy", "Excellent"]
        .find((status) => data.resources.some((resource) => resource.status === status));

    const accent = RESOURCE_CARD_ACCENT[worstStatus] || "default";

    return /* html */ `

        <section
            class="co-card io-dashboard-card io-dashboard-card--${accent} io-resource-card"
            role="region"
            aria-labelledby="ioResourceHeading"
        >

            <div class="io-widget-header">

                <div class="io-icon-badge io-icon-badge-widget" aria-hidden="true">

                    ${renderIcon("readiness")}

                </div>

                <h3 class="io-section-title" id="ioResourceHeading">Resource Usage</h3>

            </div>

            <div class="io-health-indicators" role="list">

                ${data.resources.map((resource) => ResourceUsageRow(resource)).join("")}

            </div>

        </section>

    `;

}

/**
 * One resource row — Resource Icon, Resource Name, Used/Limit,
 * Progress Bar, Utilization %, Status Badge, per the Section 8
 * spec. Every value (`used`, `limit`, `utilization`, `status`,
 * `detail`) is read straight from the controller's resource
 * object; nothing here is computed.
 */
function ResourceUsageRow(resource) {

    const accentVar = RESOURCE_STATUS_ACCENT_VAR[resource.status] || "--primary";
    const utilizationValue = resource.utilization ?? 0;
    const iconKey = RESOURCE_USAGE_ICON_KEYS[resource.id] || "billing";

    return /* html */ `

        <div class="io-health-indicator" role="listitem" style="--health-accent:var(${accentVar})">

            <div class="io-icon-badge io-icon-badge-widget io-health-indicator-icon ${indicatorAccentClass(iconKey)}" aria-hidden="true">

                ${renderIcon(iconKey)}

            </div>

            <div class="io-health-indicator-body">

                <div class="io-health-indicator-top">

                    <span class="io-health-indicator-label">${resource.label}</span>

                    ${Badge({ text: resource.status, variant: RESOURCE_STATUS_BADGE_VARIANTS[resource.status] || "neutral" })}

                </div>

                <div
                    class="io-health-progress"
                    role="progressbar"
                    aria-valuenow="${utilizationValue}"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-label="${resource.label} utilization"
                >

                    <div class="io-health-progress-fill" style="width:${utilizationValue}%"></div>

                </div>

                <div class="io-health-indicator-top">

                    <span class="io-health-indicator-detail">${resource.used ?? "—"} / ${resource.limit ?? "—"}</span>

                    <span class="io-health-indicator-percent">${resource.utilization !== null ? `${resource.utilization}%` : "—"}</span>

                </div>

                <span class="io-health-indicator-detail">${resource.detail}</span>

            </div>

        </div>

    `;

}

/* ==========================================================
   Section 8 — Resource Usage Skeleton
========================================================== */

function ResourceUsageSkeleton() {

    return /* html */ `

        <div class="co-card io-dashboard-card io-dashboard-card--default io-resource-card io-resource-skeleton" aria-hidden="true">

            <div class="io-widget-header">

                ${BaseSkeleton.circle(40)}

                ${BaseSkeleton.rounded("180px", "20px")}

            </div>

            <div class="io-health-indicators">

                ${Array.from({ length: 3 }, () => /* html */ `

                    <div class="io-health-indicator">

                        ${BaseSkeleton.circle(36)}

                        <div class="io-health-indicator-body">

                            ${BaseSkeleton.rounded("50%", "14px")}

                            ${BaseSkeleton.rounded("100%", "6px")}

                            ${BaseSkeleton.rounded("70%", "10px")}

                        </div>

                    </div>

                `).join("")}

            </div>

        </div>

    `;

}

/* ==========================================================
   Section 8 — Resource Usage Empty State
   ----------------------------------------------------------
   Reaches this whenever fetchResourceUsage() resolves
   `hasSubscription: false` — which is the live path today (same
   "no subscription document" signal Section 7 uses), so this
   fires by default until a real subscription record exists.
   Reuses `.io-dash-empty` verbatim, exactly like Sections 5/7.
========================================================== */

function ResourceUsageEmptyState() {

    return /* html */ `

        <section
            class="co-card io-dashboard-card io-dashboard-card--default io-resource-card"
            role="region"
            aria-label="Resource Usage"
        >

            <div class="io-widget-header">

                <div class="io-icon-badge io-icon-badge-widget" aria-hidden="true">

                    ${renderIcon("readiness")}

                </div>

                <h3 class="io-section-title">Resource Usage</h3>

            </div>

            <div class="io-dash-empty">

                <div class="io-dash-empty-icon" aria-hidden="true">

                    ${renderIcon("readiness")}

                </div>

                <p class="io-dash-empty-title">No subscription plan found.</p>

                <p class="io-dash-empty-description">Resource usage against your plan will appear here once a subscription is set up.</p>

            </div>

        </section>

    `;

}

/* ==========================================================
   Section 8 — Resource Usage Error State
========================================================== */

function ResourceUsageErrorState() {

    return /* html */ `

        <div class="io-hero-error" role="alert">

            Failed to load Resource Usage.

        </div>

    `;

}

/* ==========================================================
   Section 9 — Security Overview (FINAL dashboard widget)
   ----------------------------------------------------------
   Phase 5 / Section 9 — Security Overview (V1.0)

   NOT a Security Center — a quick operational security summary
   only. Same independent skeleton -> async loader -> success/
   empty/error lifecycle as every section above (own
   #ioSecurityWrap, own loadSecurityOverview() near render()
   below, own error state). No Firestore access here — the widget
   only ever consumes the exact `{ hasSecurityData, overallScore,
   overallStatus, lastSuccessfulLogin, activeSessions,
   failedLoginAttempts, passwordStatus, mfa, recentEvents }` shape
   dashboard.controller.js's fetchSecurityOverview() hands back;
   the widget performs ZERO security calculations — overallScore,
   overallStatus, and password strength all arrive already
   computed, per the Section 9 spec. Reuses Section 5's score ring
   (`.io-health-score-ring`) and Section 4's activity list
   (`.io-activity-entry`) verbatim.
========================================================== */

function SecurityOverviewCard(security) {

    const band = SECURITY_STATUS_BAND[security.overallStatus] || "good";
    const badgeVariant = HEALTH_BADGE_VARIANTS[band] || "neutral";
    const recentEvents = security.recentEvents.slice(0, 3);

    return /* html */ `

        <section
            class="co-card io-health-card io-health-card--${band} io-security-card"
            role="region"
            aria-labelledby="ioSecurityHeading"
        >

            <div class="io-health-top">

                <div class="io-widget-header">

                    <div class="io-icon-badge io-icon-badge-widget" aria-hidden="true">

                        ${renderIcon("security")}

                    </div>

                    <h3 class="io-section-title" id="ioSecurityHeading">Security Overview</h3>

                </div>

                ${Badge({ text: security.overallStatus, variant: badgeVariant })}

            </div>

            <div class="io-health-score-row">

                <div
                    class="io-health-score-ring"
                    style="--health-score:${security.overallScore}"
                    role="img"
                    aria-label="Overall security score: ${security.overallScore} percent, ${security.overallStatus}"
                >

                    <span class="io-health-score-value">${security.overallScore}%</span>

                </div>

                <p class="io-health-score-caption">Overall Security Score</p>

            </div>

            <div class="io-health-indicators" role="list">

                ${SecurityIndicatorRow(
                    "clock",
                    "Last Successful Login",
                    /* html */ `<span class="io-health-indicator-percent">${security.lastSuccessfulLogin ?? "—"}</span>`,
                    security.lastSuccessfulLogin ? "" : "No login recorded yet"
                )}

                ${SecurityIndicatorRow(
                    "users",
                    "Active Sessions",
                    /* html */ `<span class="io-health-indicator-percent">${security.activeSessions ?? "—"}</span>`,
                    security.activeSessions !== null ? "" : "No active session data yet"
                )}

                ${SecurityIndicatorRow(
                    "failedAttempts",
                    "Failed Login Attempts",
                    /* html */ `<span class="io-health-indicator-percent">${security.failedLoginAttempts ?? "—"}</span>`,
                    security.failedLoginAttempts !== null ? "" : "No failed-attempt data yet"
                )}

                ${SecurityPasswordRow(security.passwordStatus)}

                ${SecurityMfaRow(security.mfa)}

            </div>

            <p class="io-health-score-caption">Recent Security Events</p>

            ${recentEvents.length ? /* html */ `

                <div class="io-activity-list" role="list">

                    ${recentEvents.map((event) => SecurityEventEntry(event)).join("")}

                </div>

            ` : /* html */ `

                <span class="io-health-indicator-detail">No security events recorded yet.</span>

            `}

        </section>

    `;

}

/**
 * One security indicator row — Resource Icon, Label, and either
 * a plain value or a Badge, plus a detail line. Every value comes
 * straight from the controller's resolved object; nothing here
 * is computed.
 */
function SecurityIndicatorRow(iconKey, label, valueHtml, detail) {

    return /* html */ `

        <div class="io-health-indicator" role="listitem">

            <div class="io-icon-badge io-icon-badge-widget io-health-indicator-icon ${indicatorAccentClass(iconKey)}" aria-hidden="true">

                ${renderIcon(iconKey)}

            </div>

            <div class="io-health-indicator-body">

                <div class="io-health-indicator-top">

                    <span class="io-health-indicator-label">${label}</span>

                    ${valueHtml}

                </div>

                ${detail ? `<span class="io-health-indicator-detail">${detail}</span>` : ""}

            </div>

        </div>

    `;

}

function SecurityPasswordRow(passwordStatus) {

    const badge = passwordStatus.configured
        ? Badge({ text: passwordStatus.strength || "Unknown", variant: PASSWORD_STRENGTH_BADGE_VARIANTS[passwordStatus.strength] || "neutral" })
        : Badge({ text: "Not Configured", variant: "neutral" });

    const detail = passwordStatus.lastChanged
        ? `Last changed ${passwordStatus.lastChanged}`
        : "No password change recorded yet";

    return SecurityIndicatorRow("security", "Password Status", badge, detail);

}

function SecurityMfaRow(mfa) {

    const badge = !mfa.available
        ? Badge({ text: "Not Available Yet", variant: "neutral" })
        : Badge({ text: mfa.enabled ? "Enabled" : "Disabled", variant: mfa.enabled ? "success" : "warning" });

    const detail = !mfa.available
        ? "Multi-factor authentication isn't available yet"
        : (mfa.enabled ? "Two-factor authentication is active" : "Two-factor authentication is not active");

    return SecurityIndicatorRow("mfa", "Multi-Factor Authentication", badge, detail);

}

/**
 * One Recent Security Event entry. Reuses `.io-activity-entry`
 * (Section 4) verbatim. Unknown/missing fields render nothing
 * rather than a broken row, same defensiveness as ActivityEntry().
 */
function SecurityEventEntry(event) {

    if (!event || !event.title) return "";

    const accent = SECURITY_EVENT_ACCENTS[event.severity] || "default";

    return /* html */ `

        <div class="io-activity-entry io-activity-entry--${accent}" role="listitem">

            <div class="io-icon-badge io-icon-badge-activity" aria-hidden="true">

                ${renderIcon("security")}

            </div>

            <div class="io-activity-entry-body">

                <span class="io-activity-entry-title">${event.title}</span>

            </div>

            ${event.timestamp ? `<span class="io-activity-entry-time">${event.timestamp}</span>` : ""}

        </div>

    `;

}

/* ==========================================================
   Section 9 — Security Overview Skeleton
========================================================== */

function SecurityOverviewSkeleton() {

    return /* html */ `

        <div class="co-card io-health-card io-health-skeleton io-security-card io-security-skeleton" aria-hidden="true">

            <div class="io-health-top">

                <div class="io-widget-header">

                    ${BaseSkeleton.circle(40)}

                    ${BaseSkeleton.rounded("180px", "20px")}

                </div>

                ${BaseSkeleton.rounded("90px", "24px", "var(--radius-full)")}

            </div>

            <div class="io-health-score-row">

                ${BaseSkeleton.circle(96)}

                ${BaseSkeleton.rounded("200px", "14px")}

            </div>

            <div class="io-health-indicators">

                ${Array.from({ length: 5 }, () => /* html */ `

                    <div class="io-health-indicator">

                        ${BaseSkeleton.circle(36)}

                        <div class="io-health-indicator-body">

                            ${BaseSkeleton.rounded("60%", "14px")}

                            ${BaseSkeleton.rounded("40%", "10px")}

                        </div>

                    </div>

                `).join("")}

            </div>

        </div>

    `;

}

/* ==========================================================
   Section 9 — Security Overview Empty State
   ----------------------------------------------------------
   Reaches this whenever fetchSecurityOverview() resolves
   `hasSecurityData: false` — which is the live path today (no
   auth/security Firestore source exists yet), so this fires by
   default until a real security record exists. Reuses
   `.io-dash-empty` verbatim, exactly like Sections 5/7/8.
========================================================== */

function SecurityOverviewEmptyState() {

    return /* html */ `

        <section
            class="co-card io-dashboard-card io-dashboard-card--default io-security-card"
            role="region"
            aria-label="Security Overview"
        >

            <div class="io-widget-header">

                <div class="io-icon-badge io-icon-badge-widget" aria-hidden="true">

                    ${renderIcon("security")}

                </div>

                <h3 class="io-section-title">Security Overview</h3>

            </div>

            <div class="io-dash-empty">

                <div class="io-dash-empty-icon" aria-hidden="true">

                    ${renderIcon("security")}

                </div>

                <p class="io-dash-empty-title">No security data available yet.</p>

                <p class="io-dash-empty-description">Login activity, session, and password health will appear here once account security data is tracked.</p>

            </div>

        </section>

    `;

}

/* ==========================================================
   Section 9 — Security Overview Error State
========================================================== */

function SecurityOverviewErrorState() {

    return /* html */ `

        <div class="io-hero-error" role="alert">

            Failed to load Security Overview.

        </div>

    `;

}

/* ==========================================================
   Live Clock
   ----------------------------------------------------------
   Module-scoped so a second render() call (e.g. shell hot
   remount) clears any previous interval before starting a new
   one — same "don't stack a second instance" discipline
   shell.controller.js already applies to its own single
   dashboard instance.
========================================================== */

let clockIntervalId = null;

/**
 * Delegated click listener for the Quick Actions grid — one
 * listener per mount (not one per card), stored here so
 * destroyDashboard() can remove it. Re-bound every time
 * loadQuickActions() successfully mounts real cards (e.g. a
 * future re-render), never left stacked.
 */
let actionsGridEl = null;
let actionsGridClickHandler = null;

function startLiveClock() {

    stopLiveClock();

    clockIntervalId = setInterval(() => {

        const valueEl = document.getElementById("ioHeroTimeValue");

        // Header may have been unmounted (module switch) since the
        // last tick — nothing to update, and the interval keeps
        // running harmlessly until destroyDashboard() clears it.
        if (!valueEl) return;

        valueEl.textContent = formatCurrentTime();

    }, 30000);

}

function stopLiveClock() {

    if (clockIntervalId) {

        clearInterval(clockIntervalId);

        clockIntervalId = null;

    }

}

/* ==========================================================
   Router Renderer
   ----------------------------------------------------------
   Section 4 (Widgets) still mounts synchronously in the same
   tick, exactly as before — not part of this pass. Sections 1
   (Welcome Header), 2 (KPI Cards), and 3 (Quick Actions) each
   load independently through the same four/five-step pattern,
   run concurrently so no section's fetch ever blocks another's:

     1. Skeleton  — paints instantly inside the section's own
                     #io*Wrap, alongside the rest of the
                     (synchronous) dashboard.
     2. Fetch     — awaits its own fetch*() from
                     dashboard.controller.js (Promise today,
                     Firestore later).
     3. Fade Swap — Animation.fadeOut() the skeleton, swap in
                     the real markup, Animation.fadeIn() it.
                     Same sequence Super Admin's own
                     dashboard.page.js already uses. An empty
                     result renders that section's own empty
                     state instead (Quick Actions only, today).
     4. (Header only) Live Clock — starts once the real hero is
                     mounted; destroyDashboard() (below) stops
                     it.
     5. (Quick Actions only) Bind Handlers — a single delegated
                     click listener on `.io-action-grid`;
                     destroyDashboard() (below) unbinds it.

   A failure in one section's fetch renders only that section's
   own error state (WelcomeHeaderErrorState() / KpiGridErrorState()
   / QuickActionsErrorState()) — the other sections are unaffected.
========================================================== */

/**
 * Loads Section 1 — Welcome Header. Self-contained: mounts its
 * own skeleton (already in the DOM from DashboardPage()),
 * fetches, fades, and starts the live clock once mounted.
 */
async function loadWelcomeHeader(workspace) {

    const headerWrap = workspace.querySelector("#ioWelcomeHeaderWrap");

    if (!headerWrap) return;

    try {

        const banner = await fetchWelcomeBannerData();

        // The shell/router may have already unmounted this module
        // while the await above was pending (fast module switch) —
        // the workspace no longer belongs to us, so stop before
        // touching the DOM.
        if (!document.body.contains(headerWrap)) return;

        const skeletonEl = headerWrap.querySelector(".io-hero-skeleton");

        await Animation.fadeOut(skeletonEl, { hideOnFinish: false });

        headerWrap.innerHTML = WelcomeHero(banner);
        headerWrap.removeAttribute("aria-busy");

        const heroEl = headerWrap.querySelector(".io-hero-card");

        await Animation.fadeIn(heroEl);

        startLiveClock();

    } catch (error) {

        console.error(
            "[CampusOne] Welcome Header Error:",
            error
        );

        headerWrap.innerHTML = WelcomeHeaderErrorState();
        headerWrap.removeAttribute("aria-busy");

    }

}

/**
 * Loads Section 2 — KPI Cards. Same shape as
 * loadWelcomeHeader() above — reused, not reinvented.
 */
async function loadKpiGrid(workspace) {

    const kpiWrap = workspace.querySelector("#ioKpiGridWrap");

    if (!kpiWrap) return;

    try {

        const stats = await fetchQuickStats();

        if (!document.body.contains(kpiWrap)) return;

        const skeletonEl = kpiWrap.querySelector(".io-kpi-skeleton");

        await Animation.fadeOut(skeletonEl, { hideOnFinish: false });

        kpiWrap.innerHTML = QuickStatistics(stats);
        kpiWrap.removeAttribute("aria-busy");

        const gridEl = kpiWrap.querySelector(".io-kpi-grid");

        await Animation.fadeIn(gridEl);

    } catch (error) {

        console.error(
            "[CampusOne] KPI Grid Error:",
            error
        );

        kpiWrap.innerHTML = KpiGridErrorState();
        kpiWrap.removeAttribute("aria-busy");

    }

}

/**
 * Loads Section 3 — Quick Actions. Same shape as
 * loadWelcomeHeader()/loadKpiGrid() above — reused, not
 * reinvented. An empty resolved list renders
 * QuickActionsEmptyState() instead of the grid; only a non-empty
 * list gets its click handlers bound.
 */
async function loadQuickActions(workspace) {

    const actionsWrap = workspace.querySelector("#ioQuickActionsWrap");

    if (!actionsWrap) return;

    try {

        const actions = await fetchQuickActions();

        if (!document.body.contains(actionsWrap)) return;

        const skeletonEl = actionsWrap.querySelector(".io-quick-actions-skeleton");

        await Animation.fadeOut(skeletonEl, { hideOnFinish: false });

        actionsWrap.innerHTML = actions.length
            ? QuickActionsSection(actions)
            : QuickActionsEmptyState();

        actionsWrap.removeAttribute("aria-busy");

        const sectionEl = actionsWrap.querySelector(".io-quick-actions");

        await Animation.fadeIn(sectionEl);

        if (actions.length) {

            bindQuickActionHandlers(actionsWrap);

        }

    } catch (error) {

        console.error(
            "[CampusOne] Quick Actions Error:",
            error
        );

        actionsWrap.innerHTML = QuickActionsErrorState();
        actionsWrap.removeAttribute("aria-busy");

    }

}

/**
 * Loads Section 4's Activity widget. Phase 3.8A — Activity
 * Widget Reliability. Independently renderable/destroyable: its
 * own #ioActivityWidgetWrap, its own fetch
 * (fetchActivityWidgetData() — controller-cached, no Firestore
 * access in this file), its own fade sequence, and its own
 * dedicated error state, same lifecycle every other section
 * already follows. A failure here never touches Business
 * Snapshot, Security & Access, or any other section, and vice
 * versa. Business Snapshot / Security & Access mount
 * synchronously inside DashboardPage() as before — only Activity
 * gets this treatment, since it's the only Section 4 widget with
 * a real (async) data source today.
 */
async function loadActivityWidget(workspace) {

    const activityWrap = workspace.querySelector("#ioActivityWidgetWrap");

    if (!activityWrap) return;

    const activityWidgetConfig = getInformationWidgets().find(
        (widget) => widget.icon === "activity"
    );

    if (!activityWidgetConfig) return;

    try {

        const { status, entries } = await fetchActivityWidgetData();

        // The shell/router may have already unmounted this module
        // while the await above was pending — stop before touching
        // the DOM, same guard every other section loader uses.
        if (!document.body.contains(activityWrap)) return;

        const skeletonEl = activityWrap.querySelector(".io-activity-widget-skeleton");

        if (skeletonEl) {
            await Animation.fadeOut(skeletonEl, { hideOnFinish: false });
        }

        // status === "error" gets its own dedicated copy (Critical
        // Issue 2) — never the same markup a genuine empty result
        // renders. Any other status (today only "loaded") renders
        // through the same WidgetCard() Business Snapshot/Security
        // & Access already use, with real (or genuinely empty)
        // entries passed straight through — no invented rows.
        activityWrap.innerHTML = status === "error"
            ? ActivityWidgetErrorState()
            : WidgetCard(activityWidgetConfig, entries);

        activityWrap.removeAttribute("aria-busy");

        const cardEl = activityWrap.querySelector(".io-dashboard-card");

        if (cardEl) {
            await Animation.fadeIn(cardEl);
        }

    } catch (error) {

        console.error(
            "[CampusOne] Recent Activity Widget Error:",
            error
        );

        activityWrap.innerHTML = ActivityWidgetErrorState();
        activityWrap.removeAttribute("aria-busy");

    }

}

/**
 * Loads Section 5 — Institution Health. Independently
 * renderable/destroyable: its own #ioHealthWrap, its own fetch
 * (fetchInstitutionHealth() — controller-computed, no Firestore
 * access in this file), its own fade sequence, and its own error
 * state, exactly like Sections 1-3 above. A failure here never
 * touches the Welcome Header, KPI Grid, Quick Actions, or
 * Information Widgets sections, and vice versa. No listeners or
 * timers are created by this section, so there's nothing for
 * destroyDashboard() to unbind for it.
 */
async function loadInstitutionHealth(workspace) {

    const healthWrap = workspace.querySelector("#ioHealthWrap");

    if (!healthWrap) return;

    try {

        const health = await fetchInstitutionHealth();

        // The shell/router may have already unmounted this module
        // while the await above was pending — stop before touching
        // the DOM, same guard every other section loader uses.
        if (!document.body.contains(healthWrap)) return;

        const skeletonEl = healthWrap.querySelector(".io-health-skeleton");

        await Animation.fadeOut(skeletonEl, { hideOnFinish: false });

        healthWrap.innerHTML = health.started
            ? InstitutionHealthCard(health)
            : InstitutionHealthEmptyState();

        healthWrap.removeAttribute("aria-busy");

        const cardEl = healthWrap.querySelector(".io-health-card");

        await Animation.fadeIn(cardEl);

    } catch (error) {

        console.error(
            "[CampusOne] Institution Health Error:",
            error
        );

        healthWrap.innerHTML = InstitutionHealthErrorState();
        healthWrap.removeAttribute("aria-busy");

    }

}

/**
 * Loads Section 6 — Pending Tasks. Independently renderable/
 * destroyable: its own #ioTasksWrap, its own fetch
 * (fetchPendingTasks() — controller-computed, no Firestore
 * access in this file), its own fade sequence, and its own error
 * state, exactly like every other section above. A failure here
 * never touches any other section, and vice versa.
 * `fetchPendingTasks()` resolves `{ tasks, allCompleted }` —
 * `allCompleted` (the Empty/"all caught up" state trigger) is
 * decided entirely by the controller, same as `started` is for
 * Institution Health; this loader only reads it, it never
 * re-derives task completion from the list. No listeners or
 * timers are created by this section, so there's nothing for
 * destroyDashboard() to unbind for it.
 */
async function loadPendingTasks(workspace) {

    const tasksWrap = workspace.querySelector("#ioTasksWrap");

    if (!tasksWrap) return;

    try {

        const { tasks, allCompleted, completedTasks, totalTasks, completionPercentage } = await fetchPendingTasks();

        if (!document.body.contains(tasksWrap)) return;

        const skeletonEl = tasksWrap.querySelector(".io-tasks-skeleton");

        await Animation.fadeOut(skeletonEl, { hideOnFinish: false });

        tasksWrap.innerHTML = allCompleted
            ? PendingTasksEmptyState()
            : PendingTasksSection(tasks, { completedTasks, totalTasks, completionPercentage });

        tasksWrap.removeAttribute("aria-busy");

        const cardEl = tasksWrap.querySelector(".io-tasks-card");

        await Animation.fadeIn(cardEl);

    } catch (error) {

        console.error(
            "[CampusOne] Pending Tasks Error:",
            error
        );

        tasksWrap.innerHTML = PendingTasksErrorState();
        tasksWrap.removeAttribute("aria-busy");

    }

}

/**
 * Loads Section 7 — Subscription Overview. Independently
 * renderable/destroyable: its own #ioSubscriptionWrap, its own
 * fetch (fetchSubscriptionOverview() — controller-computed, no
 * Firestore access in this file), its own fade sequence, and its
 * own error state, exactly like every other section above. A
 * failure here never touches any other section, and vice versa.
 * `hasPlan` (the Empty-state trigger) is decided entirely by the
 * controller, same as `started` is for Institution Health; this
 * loader only reads it, it never re-derives plan availability. No
 * listeners or timers are created by this section (the CTA
 * buttons are inert while `actions.moduleId` is null), so there's
 * nothing for destroyDashboard() to unbind for it.
 */
async function loadSubscriptionOverview(workspace) {

    const subscriptionWrap = workspace.querySelector("#ioSubscriptionWrap");

    if (!subscriptionWrap) return;

    try {

        const subscription = await fetchSubscriptionOverview();

        if (!document.body.contains(subscriptionWrap)) return;

        const skeletonEl = subscriptionWrap.querySelector(".io-sub-skeleton");

        await Animation.fadeOut(skeletonEl, { hideOnFinish: false });

        subscriptionWrap.innerHTML = subscription.hasPlan
            ? SubscriptionOverviewCard(subscription)
            : SubscriptionOverviewEmptyState();

        subscriptionWrap.removeAttribute("aria-busy");

        const cardEl = subscriptionWrap.querySelector(".io-sub-card");

        await Animation.fadeIn(cardEl);

    } catch (error) {

        console.error(
            "[CampusOne] Subscription Overview Error:",
            error
        );

        subscriptionWrap.innerHTML = SubscriptionOverviewErrorState();
        subscriptionWrap.removeAttribute("aria-busy");

    }

}

/**
 * Loads Section 8 — Resource Usage. Independently
 * renderable/destroyable: its own #ioResourceUsageWrap, its own
 * fetch (fetchResourceUsage() — controller-computed, no Firestore
 * access in this file), its own fade sequence, and its own error
 * state, exactly like every other section above. A failure here
 * never touches any other section, and vice versa. `hasSubscription`
 * (the Empty-state trigger) is decided entirely by the controller,
 * same as Section 7's `hasPlan`; this loader only reads it, it
 * never re-derives subscription availability, and it performs no
 * utilization math of its own. No listeners or timers are created
 * by this section, so there's nothing for destroyDashboard() to
 * unbind for it.
 */
async function loadResourceUsage(workspace) {

    const resourceWrap = workspace.querySelector("#ioResourceUsageWrap");

    if (!resourceWrap) return;

    try {

        const usage = await fetchResourceUsage();

        if (!document.body.contains(resourceWrap)) return;

        const skeletonEl = resourceWrap.querySelector(".io-resource-skeleton");

        await Animation.fadeOut(skeletonEl, { hideOnFinish: false });

        resourceWrap.innerHTML = usage.hasSubscription
            ? ResourceUsageCard(usage)
            : ResourceUsageEmptyState();

        resourceWrap.removeAttribute("aria-busy");

        const cardEl = resourceWrap.querySelector(".io-resource-card");

        await Animation.fadeIn(cardEl);

    } catch (error) {

        console.error(
            "[CampusOne] Resource Usage Error:",
            error
        );

        resourceWrap.innerHTML = ResourceUsageErrorState();
        resourceWrap.removeAttribute("aria-busy");

    }

}

/**
 * Loads Section 9 — Security Overview (FINAL dashboard widget).
 * Independently renderable/destroyable: its own #ioSecurityWrap,
 * its own fetch (fetchSecurityOverview() — controller-computed,
 * no Firestore access in this file), its own fade sequence, and
 * its own error state, exactly like every other section above. A
 * failure here never touches any other section, and vice versa.
 * `hasSecurityData` (the Empty-state trigger) is decided entirely
 * by the controller, same as Section 7's `hasPlan` and Section 8's
 * `hasSubscription`; this loader only reads it, it never
 * re-derives security availability, and it performs no security
 * math of its own. No listeners or timers are created by this
 * section, so there's nothing for destroyDashboard() to unbind
 * for it.
 */
async function loadSecurityOverview(workspace) {

    const securityWrap = workspace.querySelector("#ioSecurityWrap");

    if (!securityWrap) return;

    try {

        const security = await fetchSecurityOverview();

        if (!document.body.contains(securityWrap)) return;

        const skeletonEl = securityWrap.querySelector(".io-security-skeleton");

        await Animation.fadeOut(skeletonEl, { hideOnFinish: false });

        securityWrap.innerHTML = security.hasSecurityData
            ? SecurityOverviewCard(security)
            : SecurityOverviewEmptyState();

        securityWrap.removeAttribute("aria-busy");

        const cardEl = securityWrap.querySelector(".io-security-card");

        await Animation.fadeIn(cardEl);

    } catch (error) {

        console.error(
            "[CampusOne] Security Overview Error:",
            error
        );

        securityWrap.innerHTML = SecurityOverviewErrorState();
        securityWrap.removeAttribute("aria-busy");

    }

}

/**
 * One delegated listener on `.io-action-grid` rather than one
 * per card — cheaper, and there's exactly one place to unbind
 * from in destroyDashboard(). Always unbinds any prior listener
 * first so a second call (future re-render) never stacks.
 */
function bindQuickActionHandlers(actionsWrap) {

    unbindQuickActionHandlers();

    actionsGridEl = actionsWrap.querySelector(".io-action-grid");

    if (!actionsGridEl) return;

    actionsGridClickHandler = (event) => {

        const card = event.target.closest(".io-action-card");

        if (!card || card.disabled) return;

        handleQuickActionClick(card);

    };

    actionsGridEl.addEventListener("click", actionsGridClickHandler);

}

function unbindQuickActionHandlers() {

    if (actionsGridEl && actionsGridClickHandler) {

        actionsGridEl.removeEventListener("click", actionsGridClickHandler);

    }

    actionsGridEl = null;
    actionsGridClickHandler = null;

}

/**
 * Per-card loading state on click — disables the card (also
 * covers keyboard activation, since native <button> Enter/Space
 * fires the same click event) and shows the shared `.btn-spinner`
 * primitive (shared/components/button/button.css) tinted via
 * currentColor, rather than inventing a new spinner. Business
 * logic itself — what a Quick Action actually does — lives in
 * dashboard.controller.js's performQuickAction(), never here.
 *
 * Phase 3.7A: when performQuickAction() resolves
 * `{ status: "navigated" }` the Owner Router has already replaced
 * the workspace (Coming Soon / real module), so no toast is shown
 * — the page change itself is the feedback. The existing toast
 * path is untouched for the "not-implemented" fallback and for
 * errors.
 */
async function handleQuickActionClick(card) {

    const actionId = card.dataset.actionId;
    const label = card.querySelector(".io-action-title")?.textContent || "Action";

    card.disabled = true;
    card.setAttribute("aria-busy", "true");
    card.classList.add("io-action-card--loading");

    const spinner = document.createElement("span");
    spinner.className = "io-action-spinner";
    card.appendChild(spinner);

    try {

        const result = await performQuickAction(actionId);

        if (result?.status !== "navigated") {

            showToast({
                type: "info",
                title: label,
                message: result?.message || `${label} is coming soon.`
            });

        }

    } catch (error) {

        console.error(
            "[CampusOne] Quick Action Error:",
            error
        );

        showToast({
            type: "error",
            title: "Something went wrong",
            message: `Couldn't open ${label}. Please try again.`
        });

    } finally {

        card.disabled = false;
        card.removeAttribute("aria-busy");
        card.classList.remove("io-action-card--loading");
        card.querySelector(".io-action-spinner")?.remove();

    }

}

export async function render(workspace) {

    if (!workspace) {

        console.error(
            "[CampusOne] Institution Owner dashboard workspace not found."
        );

        return destroyDashboard;

    }

    /* ------------------------------------------------------
       Mount skeletons + rest of dashboard (Sections 3-4)
    ------------------------------------------------------ */

    workspace.innerHTML = DashboardPage();

    const contentEl = workspace.querySelector(".io-dashboard");

    if (contentEl) {

        Animation.fadeIn(contentEl);

    }

    /* ------------------------------------------------------
       Load Sections 1 & 2 concurrently — independent
       skeleton/fetch/fade/error per section (see the two
       loaders above).
    ------------------------------------------------------ */

    await Promise.all([
        loadWelcomeHeader(workspace),
        loadKpiGrid(workspace),
        loadQuickActions(workspace),
        loadActivityWidget(workspace),
        loadInstitutionHealth(workspace),
        loadPendingTasks(workspace),
        loadSubscriptionOverview(workspace),
        loadResourceUsage(workspace),
        loadSecurityOverview(workspace)
    ]);

    return destroyDashboard;

}

/* ==========================================================
   Destroy
   ----------------------------------------------------------
   Stops the live clock and unbinds the Quick Actions click
   listener (both this file's own concern — DOM-coupled, so
   neither belongs in dashboard.controller.js) and then defers
   to the controller's own destroyDashboard() for anything
   Section 2-4 ever needs to clean up.
========================================================== */

function destroyDashboard() {

    stopLiveClock();
    unbindQuickActionHandlers();

    destroyDashboardData();

}
