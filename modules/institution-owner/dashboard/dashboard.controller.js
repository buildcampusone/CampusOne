/**
 * ==========================================================
 * CampusOne
 * Institution Owner Dashboard Controller
 * ----------------------------------------------------------
 * Part 2.2 — Executive Dashboard Implementation
 * ----------------------------------------------------------
 * Same split Super Admin and Institution Admin's own dashboard
 * controllers already use:
 *
 *   dashboard.page.js       -> WHERE things render + HOW they look
 *   dashboard.controller.js -> WHAT the content is
 *
 * Foundation rules carried over unchanged from both existing
 * dashboards (per the Part 2.1 audit):
 *   - No Firebase, no services, no APIs.
 *   - No seeded/fake data — every KPI either shows an honest
 *     placeholder ("—" + "No data yet") or a value that's
 *     genuinely derivable from static, already-committed data
 *     (e.g. how many Owner modules are actually "ready" today
 *     comes straight from modules.registry.js, not a guess).
 *   - No router, no guard — render()/destroy() are exported so
 *     a future Owner module router can call them the same way
 *     router.super.js / router.institution.js already call
 *     their own dashboard modules, but nothing here wires that
 *     up yet.
 *
 * Quick Actions (Section 3, this pass) are now a dedicated,
 * Owner-specific config (QUICK_ACTIONS below) rather than
 * derived from modules.registry.js — the Sidebar's MODULES list
 * is a generic per-module nav source, but Quick Actions are
 * meant to surface the Owner's real day-to-day operational
 * shortcuts, which don't have a 1:1 mapping to Sidebar entries
 * (e.g. "Invite Team" and "Departments" aren't Sidebar modules
 * at all). Same Firestore-ready shape as fetchQuickStats():
 * `fetchQuickActions()` is async today for symmetry with the
 * loader pattern dashboard.page.js already uses for every
 * section, not because it reads anything yet.
 * ==========================================================
 */

import {
    MODULES
} from "../router/modules.registry.js";

/* ==========================================================
   Phase 3.2 — Dashboard Data Foundation Integration
   ----------------------------------------------------------
   The only new import this phase adds. `getDashboardData()` is
   synchronous and reads whatever session.store.js's single
   shared listener already has cached (guards.js starts it
   before this dashboard ever mounts) — calling it here costs
   zero additional Firestore reads and opens no new listener,
   same contract dashboard.data.js's own header documents.
   Every stub this phase rewires below reads through this one
   function; nothing in this file talks to Firestore directly.
========================================================== */
import {
    getDashboardData
} from "./dashboard.data.js";

/* ==========================================================
   Phase 3.5C — Recent Activity Integration
   ----------------------------------------------------------
   The only two new imports this phase adds — both reused as-is,
   nothing duplicated:

     - activity.service.js's getRecentActivity() (aliased below
       to avoid colliding with this file's OWN exported
       getRecentActivity(), which dashboard.page.js already
       imports by that exact name and must keep working
       unchanged — see the Recent Activity section further down
       for why the two can't just be the same function).
     - shared/constants/activity-types.js's ACTIVITY_TYPES, the
       canonical closed set of `type` strings activity.service.js
       validates against — aliased to ACTIVITY_TYPE_KEYS so it
       doesn't collide with this file's own ACTIVITY_TYPES export
       (the icon/label *display* registry dashboard.page.js
       reads). Reusing the canonical constants here instead of
       re-typing the raw strings is what keeps this file from
       silently drifting out of sync with activity.service.js.
========================================================== */
import {
    getRecentActivity as fetchRecentActivityLog
} from "../../../shared/services/activity.service.js";

import {
    ACTIVITY_TYPES as ACTIVITY_TYPE_KEYS
} from "../../../shared/constants/activity-types.js";

/* ==========================================================
   Phase 3.7A — Quick Actions Integration
   ----------------------------------------------------------
   The only new import this phase adds. Reuses the exact same
   navigateToModule() the Owner Sidebar already dispatches
   through (modules/institution-owner/components/sidebar/
   sidebar.controller.js's onRouteSelect()) — no new navigation
   helper, no duplicated router logic. A "soon"-status module id
   navigates just as it does from the Sidebar: the router renders
   its real "Coming soon" state.
========================================================== */
import {
    navigateToModule
} from "../router/router.institution-owner.js";

/* ==========================================================
   Welcome Header Data
   ----------------------------------------------------------
   Phase 5 / Section 1 — Welcome Header (V1.0, full spec)

   Full field contract required by the approved spec:
     greeting, ownerName, institutionName, institutionInitial,
     institutionCode, isVerified (+ verification label),
     academicSession, currentDate, currentTime, statusLabel.

   Firestore-ready architecture:
   ----------------------------------------------------------
   `fetchWelcomeBannerData()` is async and returns a Promise —
   today it resolves `buildWelcomeBannerData()` synchronously
   (no network, no Firebase import yet, per the foundation
   rules this module still follows), but the *call shape*
   already matches how Super Admin's own dashboard.page.js
   awaits `fetchDashboardData()` before it renders. When Owner
   gets a real session/institution read (Firestore `getDoc` via
   shared/services/institution.service.js), only this
   function's body changes — dashboard.page.js's render()
   already awaits it and already shows a skeleton while it's
   pending, so no caller-side changes will be needed then.

   Every field neither pulled from MODULES nor computed from
   the system clock is an honest "—" placeholder (no seeded/
   fake data) until that real source exists — same discipline
   `getQuickStats()` below already follows. `isVerified` in
   particular defaults to `false`: an institution is unverified
   until something real says otherwise, never shown as
   verified by default.
========================================================== */

export async function fetchWelcomeBannerData() {

    return Promise.resolve(buildWelcomeBannerData());

}

function buildWelcomeBannerData() {

    const data = getDashboardData();

    const institution = data.institution || {};
    const owner = data.owner || {};

    // Real institution name once the Data Foundation has one
    // cached; the same honest fallback the pre-integration
    // placeholder used whenever it genuinely doesn't (brand-new
    // session, institution doc not yet resolved).
    const institutionName = institution.name || "Your Institution";

    return {

        greeting: getGreeting(),

        // formatGreetingLine() in dashboard.page.js already treats
        // "—" as "no real name yet" and falls back to the bare
        // greeting — unchanged contract, now fed a real name when
        // one exists.
        ownerName: owner.fullName || "—",

        institutionName,

        institutionInitial: getInitial(institutionName),

        ownerRoleLabel: "Institution Owner",

        institutionCode: institution.code || "—",

        // No institution-verification field exists anywhere in the
        // Data Foundation's institution doc shape yet (profile /
        // contact / address / owner / branding / modules /
        // subscription only — see dashboard.data.js's own header).
        // Honestly `false` until a real verification source is
        // written; deliberately NOT inferred from the Owner's own
        // emailVerified flag, which is a different, already-
        // required condition (the auth guard won't let an
        // unverified Owner reach this dashboard at all) and would
        // misrepresent institution-level verification.
        isVerified: false,

        academicSession: formatAcademicSession(data.academicSession),

        currentDate: formatCurrentDate(),

        currentTime: formatCurrentTime(),

        statusLabel: "Owner Access"

    };

}

/**
 * dashboard.data.js's academicSession resolves to `null` today
 * (no collection/service writes it anywhere in the codebase —
 * see dashboard.data.js's buildCurrentAcademicSession() header).
 * Formats defensively for the day something real does: a plain
 * `{ label: "..." }` shape is rendered as-is; anything else
 * (including null) falls back to the same "—" placeholder the
 * hero pill already showed before this phase, so
 * dashboard.page.js's `Session: ${banner.academicSession}`
 * interpolation never prints "null" or "[object Object]".
 */
function formatAcademicSession(academicSession) {

    if (academicSession && typeof academicSession.label === "string" && academicSession.label) {
        return academicSession.label;
    }

    return "—";

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

/**
 * Live clock string ("10:42 AM"). Exported (not just internal)
 * so dashboard.page.js's live-clock interval can re-format the
 * current instant every tick without re-fetching the rest of
 * the banner data.
 */
export function formatCurrentTime() {

    return new Date().toLocaleTimeString("en-IN", {

        hour: "numeric",
        minute: "2-digit"

    });

}

/* ==========================================================
   Quick Statistics (KPI Cards)
   ----------------------------------------------------------
   Phase 5 / Section 2 — KPI Cards (V1.0)
   Phase 3.3 — KPI Cards Integration

   Same Firestore-ready shape Section 1 established:
   `fetchQuickStats()` is async and returns a Promise — today it
   resolves synchronously (`getDashboardData()` is a cache read,
   not a network call), but dashboard.page.js already awaits it
   and shows a skeleton while it's pending, so a real Firestore
   read replacing a cache read later needs no caller-side change.

   dashboard.page.js's QuickStatistics() (Section 2) interpolates
   `stat.value` / `stat.trend` directly into markup with no null
   check and no per-card empty state of its own — the grid's only
   "empty" affordance is exactly the "—" / "No data yet" pair
   already used here. So "return null" for a card without a real
   source (Phase 3.3 prompt's instruction) means "keep returning
   that same display-safe placeholder pair", not the literal JS
   value `null` — returning `null` would render the literal text
   "null" in the card, a UI regression, and dashboard.page.js is
   out of scope to fix that in. Same reasoning Phase 3.2 already
   applied to Subscription Overview's `renewalDate` and Resource
   Usage's `storage.value`.

   Active Modules (verified this phase, unchanged): a real count
   taken from MODULES (router/modules.registry.js), filtered on
   `status === "ready"` — not derived from the Data Foundation,
   because module readiness is static app configuration, not
   per-institution Firestore data. Confirmed correct as-is.
========================================================== */

export async function fetchQuickStats() {

    return Promise.resolve(buildQuickStats());

}

function buildQuickStats() {

    const data = getDashboardData();

    return [
        buildTotalUsersStat(),
        buildActiveModulesStat(),
        buildBillingStatusStat(data.subscription),
        buildSecurityStatusStat()
    ];

}

/**
 * Total Users — Phase 3.3: still no real source. The Data
 * Foundation's shape (dashboard.data.js's own header: institution
 * / owner / subscription / academicSession / stats / meta) never
 * queries a users collection or any per-role subcollection — the
 * exact same gap buildFoundationSignals() already documented for
 * institutionAdminCount/studentCount/facultyCount in Phase 3.2.
 * Counting just the signed-in Owner as "1" would be technically
 * true today but would misrepresent this card as a real aggregate
 * the moment a second real user (an admin, a teacher) exists with
 * no read backing it — so this stays the same honest "not
 * connected yet" placeholder until a real users-collection read
 * exists.
 */
function buildTotalUsersStat() {

    return {
        id: "ioStatUsers",
        icon: "users",
        label: "Total Users",
        value: "—",
        trend: "No data yet"
    };

}

/**
 * Active Modules — unchanged this phase (verification only, per
 * the Phase 3.3 prompt). Real count from the static module
 * registry, not the Data Foundation.
 */
function buildActiveModulesStat() {

    const readyModuleCount = MODULES.filter(
        (module) => module.status === "ready"
    ).length;

    return {
        id: "ioStatModules",
        icon: "modules",
        label: "Active Modules",
        value: String(readyModuleCount),
        trend: `${readyModuleCount} of ${MODULES.length} live`
    };

}

/**
 * Billing Status — Phase 3.3: wired to the real subscription
 * record on `getDashboardData().subscription` (same source Phase
 * 3.2 wired Subscription Overview to). Reuses the hoisted
 * SUBSCRIPTION_STATUS_LABELS / capitalizeWords() rather than a
 * second status-label map, so this card and Subscription Overview
 * can never disagree about what a given status string displays
 * as. `subscription` is `null` whenever no subscription document
 * exists yet (dashboard.data.js's buildCurrentSubscription()) —
 * that's the one branch that falls back to the honest placeholder,
 * same as every other "no record yet" case in this file.
 */
function buildBillingStatusStat(subscription) {

    if (!subscription?.status) {

        return {
            id: "ioStatBilling",
            icon: "billing",
            label: "Billing Status",
            value: "—",
            trend: "No data yet"
        };

    }

    const statusLabel = SUBSCRIPTION_STATUS_LABELS[subscription.status]
        || capitalizeWords(subscription.status);

    const planLabel = subscription.plan
        ? `${capitalizeWords(subscription.plan)} Plan`
        : "No plan on record";

    return {
        id: "ioStatBilling",
        icon: "billing",
        label: "Billing Status",
        value: statusLabel,
        trend: planLabel
    };

}

/**
 * Security Status — Phase 3.3: still no real source, for the
 * exact reason buildSecuritySignals() already documents (Security
 * Overview) — no auth/security field exists anywhere in the Data
 * Foundation (no auth.lastLogin, activeSessions, failedAttempts,
 * password, mfa, auditLogs). Stays the same honest "not connected
 * yet" placeholder; never a fabricated score.
 */
function buildSecurityStatusStat() {

    return {
        id: "ioStatSecurity",
        icon: "security",
        label: "Security Status",
        value: "—",
        trend: "No data yet"
    };

}

/* ==========================================================
   Quick Actions
   ----------------------------------------------------------
   Phase 5 / Section 3 — Quick Actions (V1.0)
   Phase 5.7 — Quick Action Dispatch Architecture (no "Coming
   Soon" toasts)

   Owner-specific operational shortcuts — deliberately NOT the
   generic SaaS set (Billing/Payments/Analytics/Security) and
   NOT a straight map over modules.registry.js (see file header).
   `icon` is a plain string key, same convention as
   fetchQuickStats() above — dashboard.page.js's ICONS registry
   resolves it to the actual shared icon component, so this data
   layer stays icon-library-agnostic.

   `moduleId` is the dispatch target: the Owner router module id
   this action opens once built, `null` until it exists. This is
   the single source of truth for availability — dashboard.page.js
   reads it to render an action `disabled` (with a "Not Available
   Yet" badge) instead of letting the click reach
   performQuickAction() at all, so there's no dead click and no
   placeholder toast for an action with nowhere to go. When a real
   module lands, flip its entry here; no other file needs to
   change for that action to go live.

   Same "—"/honest-placeholder discipline as the rest of this
   controller: no seeded data, no invented routes. Each action's
   `subtitle` is a short, real description of what that section
   will do once it exists — not a fake status.
========================================================== */

const QUICK_ACTIONS = [

    {
        id: "ioActionInstitutionProfile",
        actionId: "institution-profile",
        moduleId: "institution-profile",
        icon: "institution",
        label: "Institution Profile",
        subtitle: "Manage institution details and branding"
    },

    {
        id: "ioActionAdminManagement",
        actionId: "admin-management",
        // Reuses the Sidebar's own "users-roles" module id (see
        // router/modules.registry.js) rather than registering a
        // second id for the same destination — Phase 5.1.1's
        // Institution Admin Management page is reachable from
        // both the Dashboard card and Sidebar > Users & Roles.
        moduleId: "users-roles",
        icon: "admin",
        label: "Institution Admin Management",
        subtitle: "Add, remove, and manage institution admins"
    },

    {
        id: "ioActionDepartments",
        actionId: "departments",
        moduleId: null,
        icon: "departments",
        label: "Departments",
        subtitle: "Organize academic and operational departments"
    },

    {
        id: "ioActionInstitutionSettings",
        actionId: "institution-settings",
        moduleId: "settings",
        icon: "settings",
        label: "Institution Settings",
        subtitle: "Configure institution-wide preferences"
    },

    {
        id: "ioActionSubscriptionBilling",
        actionId: "subscription-billing",
        moduleId: "billing",
        icon: "billing",
        label: "Subscription & Billing",
        subtitle: "Review your plan, invoices, and payment history"
    },

    {
        id: "ioActionInviteTeam",
        actionId: "invite-team",
        moduleId: null,
        icon: "invite",
        label: "Invite Team",
        subtitle: "Invite institution admins and staff to CampusOne"
    }

];

/**
 * Firestore-ready, same shape as fetchQuickStats(): resolves
 * synchronously today (static QUICK_ACTIONS, no network), but
 * dashboard.page.js already awaits it behind its own skeleton,
 * so swapping in a real per-institution action set later (e.g.
 * hiding actions the Owner's plan doesn't include) needs no
 * caller-side change.
 */
export async function fetchQuickActions() {

    return Promise.resolve(QUICK_ACTIONS);

}

/**
 * Dispatch seam for a single Quick Action click. Phase 3.7A wires
 * real navigation for the 3 locked actions (Institution Profile,
 * Institution Settings, Subscription & Billing) — every business
 * decision about WHERE an action goes is still decided HERE, not
 * in dashboard.page.js, exactly per the Section 3 spec. The
 * widget only knows how to show a loading state and hand off the
 * actionId/result; navigation itself goes through the same
 * navigateToModule() the Sidebar already dispatches through, so a
 * "soon"-status target renders the router's real "Coming soon"
 * state — never an invented page.
 *
 * Only reachable for an action whose `moduleId` is set —
 * dashboard.page.js disables every other card before the click
 * ever gets here, so the "not-implemented" fallback below is
 * defense-in-depth, not a "Coming Soon" placeholder shown to
 * anyone in practice.
 */
export async function performQuickAction(actionId) {

    const action = QUICK_ACTIONS.find((entry) => entry.actionId === actionId);

    if (!action?.moduleId) {

        return Promise.resolve({

            status: "not-implemented",
            message: action
                ? `${action.label} is not available yet.`
                : "This action is not available yet."

        });

    }

    await navigateToModule(action.moduleId);

    return { status: "navigated" };

}

/* ==========================================================
   Information Widgets
   ----------------------------------------------------------
   Three Owner-specific snapshots the Part 2.1 audit called out
   as not mapping to either Super Admin's or Institution Admin's
   own widgets — Business (billing/plan), Security & Access, and
   a Recent Activity feed. Same honest-empty-state discipline as
   Institution Admin's getInformationWidgets(): a plain message
   string, no invented feed items.
========================================================== */

export function getInformationWidgets() {

    return [

        {
            id: "ioWidgetBusiness",
            icon: "billing",
            title: "Business Snapshot",
            message: "No billing data yet."
        },

        {
            id: "ioWidgetSecurity",
            icon: "security",
            title: "Security & Access",
            message: "No security events yet."
        },

        {
            id: "ioWidgetActivity",
            icon: "activity",
            title: "Recent Activity",
            message: "No recent activity yet."
        }

    ];

}

/* ==========================================================
   Recent Activity — Activity Type Registry
   ----------------------------------------------------------
   Phase 3.5C — Recent Activity Integration

   Display registry — maps every real ACTIVITY_TYPE_KEYS value
   (shared/constants/activity-types.js) to the icon key + label
   dashboard.page.js's ActivityEntry() renders. Icon keys are all
   ones dashboard.page.js's own ICONS registry already defines
   (institution, profileUpdated, billing, security, adminCreated,
   mfa, activity) — no new icon components, no page.js changes.

   `unknown` is not a real activity.service.js type — it's this
   registry's own fallback entry. dashboard.page.js's
   ActivityEntry() does `if (!ACTIVITY_TYPES[entry.type]) return ""`
   (silently drops the row) for anything missing from this map,
   which would violate "unknown types render with a generic
   icon/label rather than causing errors." mapActivityEntries()
   below always normalizes an unrecognized `type` to "unknown"
   before it ever reaches page.js, so that lookup always hits.
========================================================== */

export const ACTIVITY_TYPES = {

    [ACTIVITY_TYPE_KEYS.INSTITUTION_CREATED]: { icon: "institution", label: "Institution Registered" },
    [ACTIVITY_TYPE_KEYS.INSTITUTION_PROFILE_UPDATED]: { icon: "profileUpdated", label: "Profile Updated" },
    [ACTIVITY_TYPE_KEYS.SUBSCRIPTION_ACTIVATED]: { icon: "billing", label: "Subscription Activated" },
    [ACTIVITY_TYPE_KEYS.SUBSCRIPTION_STATUS_CHANGED]: { icon: "billing", label: "Subscription Status Changed" },
    [ACTIVITY_TYPE_KEYS.INSTITUTION_ADMIN_ADDED]: { icon: "adminCreated", label: "Admin Added" },
    [ACTIVITY_TYPE_KEYS.BILLING_COMPLETED]: { icon: "billing", label: "Billing Completed" },
    [ACTIVITY_TYPE_KEYS.SECURITY_EVENT]: { icon: "security", label: "Security Event" },
    [ACTIVITY_TYPE_KEYS.VERIFICATION_COMPLETED]: { icon: "mfa", label: "Verification Completed" },

    unknown: { icon: "activity", label: "Activity" }

};

/* ----------------------------------------------------------
   In-memory cache
   ------------------------------------------------------------
   getRecentActivity() is called SYNCHRONOUSLY by
   dashboard.page.js's WidgetCard() — Section 4's Information
   Widgets are built once, inline, inside DashboardPage()'s own
   template string, with no loadInformationWidgets() skeleton/
   fetch/swap step the way every other section (Welcome Header,
   KPI Grid, Institution Health, ...) already has. activity.
   service.js's real getRecentActivity() is a Firestore read and
   therefore async, so this file can't just forward the call —
   the two shapes don't match at that exact call site, and
   dashboard.page.js is out of this phase's file scope to change.

   This cache is the bridge: getRecentActivity() below keeps its
   existing synchronous signature (zero change needed for its
   other, already-synchronous callers in this file — Security
   Overview's buildRecentSecurityEvents() and Pending Tasks'
   firstNoticePublished() check) and always returns instantly
   from `entries`. The first call also kicks off exactly one
   background fetch — guarded by `status` so a second call (e.g.
   re-rendering this dashboard after navigating away and back,
   within the same page session) never issues a second read.

   Phase 3.8A (Activity Widget Reliability) closed the one gap
   this left: dashboard.page.js's Section 4 now gives the
   Activity widget its own skeleton -> fetch -> swap step, same
   as every other section, and awaits the new
   fetchActivityWidgetData() below instead of reading whatever
   this cache happened to hold synchronously at render time. Real
   activity now appears on the very first dashboard visit, not
   the next one. The cache itself, its `status` guard, and the
   "one bounded query only / no realtime listener / no duplicate
   reads" contract are unchanged — fetchActivityWidgetData() just
   awaits the same load this cache already tracks.
---------------------------------------------------------- */

const activityState = {

    status: "idle", // "idle" | "loading" | "loaded" | "error"
    entries: []

};

/* ----------------------------------------------------------
   Phase 3.8A — Activity Widget Reliability
   ------------------------------------------------------------
   `activityLoadPromise` is the one addition this phase makes to
   the cache above: a handle on the in-flight (or already-
   settled) load, so an async caller can `await` the exact same
   fetch the synchronous `getRecentActivity()` below may already
   have kicked off, instead of only ever reading whatever
   `entries` happens to hold at call time. No second fetch, no
   new cache, no realtime listener — `startActivityLoad()` is
   the single choke point both `getRecentActivity()` (sync) and
   `fetchActivityWidgetData()` (async, new below) go through, so
   there is still only ever one bounded read per page session.
---------------------------------------------------------- */
let activityLoadPromise = null;

function startActivityLoad() {

    if (activityState.status === "idle") {

        activityState.status = "loading";
        activityLoadPromise = loadRecentActivityIntoCache();

    }

    return activityLoadPromise;

}

const RECENT_ACTIVITY_LIMIT = 10;

function resolveInstitutionId() {

    return getDashboardData()?.institution?.id || null;

}

/**
 * Relative Time
 * ----------------------------------------------------------
 * No shared "relative time" utility exists anywhere in this
 * codebase today (checked shared/services/time.service.js and
 * shared/utils/utils.js), and adding one is out of this phase's
 * single-file scope, so this stays a private helper here.
 * Accepts a Firestore Timestamp (activity.service.js's
 * documented createdAt shape) and degrades to "" for anything
 * else, so ActivityEntry()'s own
 * `${entry.timestamp ? ... : ""}` guard just omits the time
 * instead of showing "Invalid Date".
 */
function formatRelativeTime(timestamp) {

    if (!timestamp || typeof timestamp.toDate !== "function") {
        return "";
    }

    const diffMs = Date.now() - timestamp.toDate().getTime();
    const diffSec = Math.max(0, Math.round(diffMs / 1000));

    if (diffSec < 60) return "Just now";

    const diffMin = Math.round(diffSec / 60);
    if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;

    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;

    const diffDay = Math.round(diffHr / 24);
    if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;

    const diffMonth = Math.round(diffDay / 30);
    if (diffMonth < 12) return `${diffMonth} month${diffMonth === 1 ? "" : "s"} ago`;

    const diffYear = Math.round(diffMonth / 12);
    return `${diffYear} year${diffYear === 1 ? "" : "s"} ago`;

}

/**
 * Folds the signed-in actor's name (activity.service.js's
 * `actor.name`) and whatever's useful in `metadata` into the one
 * description line ActivityEntry() has room for — no new UI
 * field, same card structure.
 */
function describeActivity(doc) {

    const actorName = doc.actor?.name || "Someone";
    const metadata = doc.metadata || {};

    switch (doc.type) {

        case ACTIVITY_TYPE_KEYS.INSTITUTION_CREATED:
            return `${metadata.institutionName || "Institution"} registered by ${actorName}`;

        case ACTIVITY_TYPE_KEYS.INSTITUTION_PROFILE_UPDATED: {

            // Phase 4.3 — Institution Description / Logo each write
            // through the same updateInstitutionProfile() path as
            // every other profile/branding edit (no new activity
            // type), but institution-profile.page.js sends them as
            // their own dedicated calls when — and only when — that
            // one field actually changed, so metadata.fields here is
            // exactly ["description"] or ["logoUrl"] for those saves
            // and never for a combined multi-field edit. That lets
            // this stay a plain metadata check instead of a new
            // ACTIVITY_TYPES entry.
            const fields = Array.isArray(metadata.fields) ? metadata.fields : [];

            if (metadata.section === "profile" && fields.length === 1 && fields[0] === "description") {
                return `Description updated by ${actorName}`;
            }

            if (metadata.section === "branding" && fields.length === 1 && fields[0] === "logoUrl") {
                return `Logo updated by ${actorName}`;
            }

            return `Profile updated by ${actorName}`;

        }

        case ACTIVITY_TYPE_KEYS.SUBSCRIPTION_ACTIVATED:
            return `Subscription activated by ${actorName}`;

        case ACTIVITY_TYPE_KEYS.SUBSCRIPTION_STATUS_CHANGED:
            return metadata.previousStatus && metadata.newStatus
                ? `Status changed from ${metadata.previousStatus} to ${metadata.newStatus} by ${actorName}`
                : `Subscription status changed by ${actorName}`;

        case ACTIVITY_TYPE_KEYS.INSTITUTION_ADMIN_ADDED:
            return metadata.adminName
                ? `${metadata.adminName} added${metadata.adminRole ? ` as ${metadata.adminRole}` : ""} by ${actorName}`
                : `Admin added by ${actorName}`;

        case ACTIVITY_TYPE_KEYS.BILLING_COMPLETED:
            return `Billing completed by ${actorName}`;

        case ACTIVITY_TYPE_KEYS.SECURITY_EVENT:
            return metadata.eventLabel
                ? `${metadata.eventLabel} by ${actorName}`
                : `Security event by ${actorName}`;

        case ACTIVITY_TYPE_KEYS.VERIFICATION_COMPLETED:
            return `Verification completed by ${actorName}`;

        default:
            return `Action by ${actorName}`;

    }

}

/**
 * Maps institutions/{id}/activity/{activityId} documents
 * (activity.service.js's documented { type, actor, metadata,
 * createdAt } schema) to the { type, description, timestamp }
 * shape dashboard.page.js's ActivityEntry() already expects.
 * Any `type` this registry doesn't recognize is normalized to
 * "unknown" rather than passed through raw, so page.js's
 * `ACTIVITY_TYPES[entry.type]` lookup always finds a generic
 * icon + label instead of silently dropping the row.
 */
function mapActivityEntries(rawEntries) {

    return rawEntries.map((doc) => ({

        type: Object.prototype.hasOwnProperty.call(ACTIVITY_TYPES, doc.type)
            ? doc.type
            : "unknown",

        description: describeActivity(doc),

        timestamp: formatRelativeTime(doc.createdAt)

    }));

}

/**
 * The one bounded Firestore read this phase adds — always
 * institutions/{institutionId}/activity, newest 10, through
 * activity.service.js's getRecentActivity() only (never a direct
 * Firestore import here). Runs at most once per page session;
 * see activityState's own header above.
 */
async function loadRecentActivityIntoCache() {

    const institutionId = resolveInstitutionId();

    if (!institutionId) {

        console.error(
            "[CampusOne] Recent Activity: no institutionId available from resolveInstitutionId() — getDashboardData():",
            getDashboardData()
        );

        activityState.status = "error";
        activityState.entries = [];

        return;

    }

    try {

        const { entries } = await fetchRecentActivityLog(institutionId, {
            limit: RECENT_ACTIVITY_LIMIT
        });

        // fetchRecentActivityLog() already queries
        // orderBy("createdAt", "desc") server-side — newest first
        // requires no re-sort here.
        activityState.entries = mapActivityEntries(entries);
        activityState.status = "loaded";

    } catch (error) {

        // Loading failure must never crash the dashboard or throw
        // out of this synchronous call chain — swallow it, log
        // for diagnostics, and fall back to the existing empty
        // state (this widget has no dedicated error markup of its
        // own; an empty `entries` array is exactly what already
        // renders "No recent activity yet.").
        console.error(
            "[CampusOne] Recent Activity failed to load (falling back to the existing empty state):",
            error
        );

        activityState.entries = [];
        activityState.status = "error";

    }

}

export function getRecentActivity() {

    startActivityLoad();

    return activityState.entries;

}

/**
 * Phase 3.8A — Activity Widget Reliability (Critical Issue 1 + 2)
 * ----------------------------------------------------------
 * The async counterpart to getRecentActivity() above, for the
 * one caller (dashboard.page.js's new Activity Widget loader)
 * that can actually wait for the fetch instead of only reading
 * whatever's cached at call time. Awaits the exact same
 * `activityLoadPromise` startActivityLoad() already tracks — no
 * second Firestore read, whether this is the first call of the
 * page session or one made after getRecentActivity() elsewhere
 * already kicked the load off. Resolves once the cache is
 * settled either way, and hands back `status` alongside
 * `entries` so the caller can render a dedicated error state
 * instead of quietly reusing the empty-state copy.
 */
export async function fetchActivityWidgetData() {

    const pending = startActivityLoad();

    if (pending) {
        await pending;
    }

    return {
        status: activityState.status,
        entries: activityState.entries
    };

}

/* ==========================================================
   Institution Health
   ----------------------------------------------------------
   Phase 5 / Section 5 — Institution Health (V1.0)
   Phase 3.2 — Dashboard Data Foundation Integration

   `fetchInstitutionHealth()` now resolves `buildFoundationSignals()`
   (below) through `calculateInstitutionHealth()` — the institution
   profile fields and subscription status it reads come straight
   from dashboard.data.js's `getDashboardData()`, not the empty
   stub. Institution-admin/department/student/faculty counts still
   have no Firestore source anywhere in this codebase (the Data
   Foundation doesn't read those collections either — see
   dashboard.data.js's own header), so those four signals stay an
   honest 0 for now, same discipline as before.

   Per the Section 5 spec, ALL calculation lives here, never in
   dashboard.page.js — the widget only renders whatever this
   function hands back. No completion percentage is ever
   hardcoded: `calculateInstitutionHealth()` derives every number
   from the raw signals passed in. `started` stays honestly
   `false` until at least one real signal exists, which is exactly
   the Empty-state trigger dashboard.page.js checks for.
========================================================== */

const HEALTH_PROFILE_FIELDS = [
    "name",
    "logo",
    "address",
    "contactEmail",
    "contactPhone",
    "website"
];

export async function fetchInstitutionHealth() {

    return Promise.resolve(
        calculateInstitutionHealth(buildFoundationSignals())
    );

}

/**
 * Real signal source, fed by the Phase 3.1 Data Foundation.
 * Consumed by Institution Health, Subscription Overview, and
 * Resource Usage (Phase 3.2 scope) — kept as ONE function so
 * those three widgets can never disagree about what's real
 * today, same reasoning the pre-integration stub below already
 * documented for itself.
 *
 * institutionAdminCount / departmentCount / studentCount /
 * facultyCount stay an honest `0`: no subcollection read for any
 * of these exists in dashboard.data.js (by design — see its own
 * header), so there is no real source to report yet. Nothing
 * here is invented; a genuine future read only changes this
 * function's body.
 */
function buildFoundationSignals() {

    const data = getDashboardData();

    const institution = data.institution || {};

    return {

        profile: {
            name: institution.name,
            logo: institution.logoUrl,
            address: institution.address,
            contactEmail: institution.email,
            contactPhone: institution.mobile,
            website: institution.website
        },

        // Same "not invented from a different real condition"
        // rule as the Welcome Header's isVerified above — no
        // institution-verification field exists in the Data
        // Foundation yet.
        isVerified: false,

        subscription: {
            status: data.subscription?.status ?? null
        },

        institutionAdminCount: 0,
        departmentCount: 0,
        studentCount: 0,
        facultyCount: 0

    };

}

/**
 * Pre-integration stub, unchanged. Retained ONLY for Pending
 * Tasks (its one remaining caller, buildTaskSignals() below) —
 * explicitly out of scope for Phase 3.2 (see Phase 3.2 prompt:
 * "Do NOT Wire Yet"). Every signal below is deliberately still
 * an honest "not set" so Pending Tasks' behavior doesn't shift as
 * a side effect of this phase's Institution Health / Subscription
 * / Resource Usage wiring. (Security Overview is unaffected
 * either way — it already reads its own separate
 * buildSecuritySignals(), never this function.) A future phase
 * that wires Pending Tasks should switch buildTaskSignals() over
 * to buildFoundationSignals() instead of touching this function.
 */
function buildLegacyEmptySignals() {

    return {

        profile: {
            name: null,
            logo: null,
            address: null,
            contactEmail: null,
            contactPhone: null,
            website: null
        },

        isVerified: false,

        subscription: {
            // "active" | "trial" | "expired" | null
            status: null
        },

        institutionAdminCount: 0,
        departmentCount: 0,
        studentCount: 0,
        facultyCount: 0

    };

}

/**
 * The single place completion percentages and the overall score
 * are computed. Every indicator's `value` is derived from the
 * signals argument — nothing here is a fixed number standing in
 * for a real one.
 */
function calculateInstitutionHealth(signals) {

    const profileFilledCount = HEALTH_PROFILE_FIELDS.filter(
        (field) => Boolean(signals.profile?.[field])
    ).length;

    const profileScore = Math.round(
        (profileFilledCount / HEALTH_PROFILE_FIELDS.length) * 100
    );

    const verificationScore = signals.isVerified ? 100 : 0;

    const subscriptionScore = signals.subscription?.status === "active"
        ? 100
        : signals.subscription?.status === "trial"
            ? 60
            : 0;

    const adminScore = signals.institutionAdminCount > 0 ? 100 : 0;
    const departmentScore = signals.departmentCount > 0 ? 100 : 0;
    const studentScore = signals.studentCount > 0 ? 100 : 0;
    const facultyScore = signals.facultyCount > 0 ? 100 : 0;

    const indicators = [

        {
            id: "profile",
            icon: "institution",
            label: "Institution Profile Completion",
            type: "progress",
            value: profileScore,
            detail: `${profileFilledCount} of ${HEALTH_PROFILE_FIELDS.length} fields complete`
        },

        {
            id: "verification",
            icon: "security",
            label: "Verification Status",
            type: "status",
            value: verificationScore,
            ok: signals.isVerified,
            detail: signals.isVerified ? "Institution is verified" : "Verification pending"
        },

        {
            id: "subscription",
            icon: "billing",
            label: "Subscription Status",
            type: "status",
            value: subscriptionScore,
            ok: signals.subscription?.status === "active",
            detail: subscriptionDetail(signals.subscription?.status)
        },

        {
            id: "admins",
            icon: "admin",
            label: "Institution Admin Setup",
            type: "status",
            value: adminScore,
            ok: signals.institutionAdminCount > 0,
            detail: signals.institutionAdminCount > 0
                ? `${signals.institutionAdminCount} admin(s) added`
                : "No institution admins added yet"
        },

        {
            id: "departments",
            icon: "departments",
            label: "Department Setup",
            type: "status",
            value: departmentScore,
            ok: signals.departmentCount > 0,
            detail: signals.departmentCount > 0
                ? `${signals.departmentCount} department(s) created`
                : "No departments created yet"
        },

        {
            id: "students",
            icon: "students",
            label: "Student Data Availability",
            type: "status",
            value: studentScore,
            ok: signals.studentCount > 0,
            detail: signals.studentCount > 0
                ? `${signals.studentCount} student record(s)`
                : "No student data imported yet"
        },

        {
            id: "faculty",
            icon: "facultyAdded",
            label: "Faculty Data Availability",
            type: "status",
            value: facultyScore,
            ok: signals.facultyCount > 0,
            detail: signals.facultyCount > 0
                ? `${signals.facultyCount} faculty record(s)`
                : "No faculty data added yet"
        }

    ];

    const overallScore = Math.round(
        indicators.reduce((sum, indicator) => sum + indicator.value, 0) / indicators.length
    );

    // Honestly "not started" until at least one real signal
    // exists — this is what tells dashboard.page.js to render the
    // onboarding-guidance Empty state instead of a 0% score card.
    const started = profileFilledCount > 0
        || signals.isVerified
        || Boolean(signals.subscription?.status)
        || signals.institutionAdminCount > 0
        || signals.departmentCount > 0
        || signals.studentCount > 0
        || signals.facultyCount > 0;

    return {
        started,
        score: overallScore,
        status: getReadinessStatus(overallScore),
        indicators
    };

}

/**
 * Phase 3.2: turns a raw enum-style value ("pending_payment",
 * "enterprise") into a display label ("Pending Payment",
 * "Enterprise") without a lookup table for every possible real
 * value. Pure string formatting, not a data source — same
 * "fixed classification/formatting logic is fine as code, only
 * data values must be real" discipline this file already applies
 * to RESOURCE_STATUS_THRESHOLDS / SECURITY_SCORE_THRESHOLDS.
 */
function capitalizeWords(value) {

    if (typeof value !== "string" || !value) return "—";

    return value
        .split("_")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

}

/**
 * Real subscription-status values this codebase actually writes
 * (registration.controller.js's subscription payload — see
 * computeSubscriptionOverview() below) mapped to a display label.
 * Hoisted to module scope in Phase 3.3 so the Billing Status KPI
 * card and Subscription Overview read the exact same map and can
 * never disagree about what a given status string displays as —
 * same "single source of truth, never re-declared" discipline
 * buildFoundationSignals() already established for Institution
 * Health / Subscription Overview / Resource Usage in Phase 3.2.
 * Any status this doesn't recognize still renders (via
 * capitalizeWords()'s fallback), it just won't match one of
 * dashboard.page.js's known badge-color keys.
 */
const SUBSCRIPTION_STATUS_LABELS = {
    active: "Active",
    trial: "Trial",
    expired: "Expired",
    pending_payment: "Pending Payment",
    cancelled: "Cancelled"
};

function subscriptionDetail(status) {

    if (status === "active") return "Plan is active";
    if (status === "trial") return "Trial in progress";
    if (status === "expired") return "Subscription expired";

    return "No active subscription";

}

/**
 * Score -> status band. Thresholds are classification logic
 * (not institution data), so — unlike the indicator values above
 * — these are fine as fixed constants; nothing here stands in
 * for a real per-institution number.
 */
function getReadinessStatus(score) {

    if (score >= 85) return { label: "Excellent", band: "excellent" };
    if (score >= 60) return { label: "Good", band: "good" };
    if (score >= 35) return { label: "Needs Attention", band: "attention" };

    return { label: "Critical", band: "critical" };

}

/* ==========================================================
   Pending Tasks
   ----------------------------------------------------------
   Phase 5 / Section 6 — Pending Tasks (V1.0)

   The Institution Owner's operational setup checklist — NOT a
   generic to-do list. Same Firestore-ready shape as every fetch*
   export above: `fetchPendingTasks()` is async and resolves
   `{ tasks, allCompleted }` — the task array is built from
   `buildLegacyEmptySignals()` (Section 5's pre-integration stub,
   deliberately still unwired — see that function's own header).
   Phase 3.2 wired Institution Health / Subscription Overview /
   Resource Usage to the real Data Foundation but explicitly left
   Pending Tasks for a later phase, so this still reads the same
   honest "not set" signals it always has; wiring it later means
   pointing `buildTaskSignals()` at `buildFoundationSignals()`
   instead, without touching this section's own computeTasks()
   logic.

   Per the Section 6 spec, ALL task-state computation lives here:
   `computeTasks()` decides each task's `status` and `completed`
   from the signals, and `fetchPendingTasks()` itself decides
   `allCompleted` from that result — dashboard.page.js never
   inspects institution data or the task list to make either
   decision, it only renders whatever this function resolves.
   Every task's `moduleId` is `null` today, same discipline as
   QUICK_ACTIONS above: none of these link to a real routed
   destination yet, so every CTA renders disabled rather than a
   dead click or a fake "Coming Soon".
========================================================== */

const TASK_PRIORITY_WEIGHT = {
    High: 0,
    Medium: 1,
    Low: 2
};

function buildTaskSignals() {

    // Deliberately still the pre-integration stub — Pending Tasks
    // is out of scope for Phase 3.2 (see "Do NOT Wire Yet").
    const baseSignals = buildLegacyEmptySignals();

    return {

        ...baseSignals,

        // No academic session source connected yet — same honest
        // "not set" discipline as every signal above.
        academicSessionConfigured: false,

        // Reuses getRecentActivity() (Section 4) rather than a
        // second "has a notice been published" source — a real
        // activity log entry of type "noticePublished" is what
        // marks this task complete once that feed is real.
        firstNoticePublished: getRecentActivity().some(
            (entry) => entry.type === "noticePublished"
        )

    };

}

/**
 * The single place task status/completion is decided. Every
 * `status`/`completed` value is derived from the signals argument
 * — never a fixed flag standing in for real institution data.
 */
function computeTasks(signals) {

    const profileFilledCount = HEALTH_PROFILE_FIELDS.filter(
        (field) => Boolean(signals.profile?.[field])
    ).length;

    const profileStatus = profileFilledCount === HEALTH_PROFILE_FIELDS.length
        ? "Completed"
        : profileFilledCount > 0
            ? "In Progress"
            : "Pending";

    const tasks = [

        {
            id: "complete-profile",
            icon: "institution",
            title: "Complete Institution Profile",
            description: "Add your institution's name, logo, address, and contact details.",
            priority: "High",
            moduleId: null,
            actionLabel: "Complete Profile",
            ...booleanTaskState(profileStatus !== "Pending", profileStatus)
        },

        {
            id: "verify-documents",
            icon: "security",
            title: "Verify Institution Documents",
            description: "Submit institution documents so CampusOne can verify your account.",
            priority: "High",
            moduleId: null,
            actionLabel: "Verify Now",
            ...booleanTaskState(signals.isVerified)
        },

        {
            id: "create-admin",
            icon: "admin",
            title: "Create First Institution Admin",
            description: "Add an institution admin so day-to-day management doesn't rely on you alone.",
            priority: "High",
            moduleId: null,
            actionLabel: "Add Admin",
            ...booleanTaskState(signals.institutionAdminCount > 0)
        },

        {
            id: "create-departments",
            icon: "departments",
            title: "Create Departments",
            description: "Set up the academic and operational departments your institution runs.",
            priority: "Medium",
            moduleId: null,
            actionLabel: "Create Departments",
            ...booleanTaskState(signals.departmentCount > 0)
        },

        {
            id: "add-faculty",
            icon: "facultyAdded",
            title: "Add Faculty Members",
            description: "Bring your teaching staff onto CampusOne.",
            priority: "Medium",
            moduleId: null,
            actionLabel: "Add Faculty",
            ...booleanTaskState(signals.facultyCount > 0)
        },

        {
            id: "import-students",
            icon: "studentImported",
            title: "Import Students",
            description: "Bring your student records into CampusOne.",
            priority: "Medium",
            moduleId: null,
            actionLabel: "Import Students",
            ...booleanTaskState(signals.studentCount > 0)
        },

        {
            id: "configure-session",
            icon: "settings",
            title: "Configure Academic Session",
            description: "Set the current academic year/term so dates across CampusOne line up.",
            priority: "Medium",
            moduleId: null,
            actionLabel: "Configure Session",
            ...booleanTaskState(signals.academicSessionConfigured)
        },

        {
            id: "publish-notice",
            icon: "noticePublished",
            title: "Publish First Notice",
            description: "Share your first announcement with the institution.",
            priority: "Low",
            moduleId: null,
            actionLabel: "Publish Notice",
            ...booleanTaskState(signals.firstNoticePublished)
        }

    ];

    return tasks
        .map((task) => ({
            ...task,
            available: Boolean(task.moduleId)
        }))
        .sort((a, b) => TASK_PRIORITY_WEIGHT[a.priority] - TASK_PRIORITY_WEIGHT[b.priority]);

}

/**
 * Shared completed -> { status, completed } mapping so every
 * task above states its condition once, in plain language,
 * rather than repeating the same ternary. `explicitStatus` lets
 * the one task with a real three-state signal (profile
 * completion) supply "In Progress" instead of the binary
 * Pending/Completed every other task uses.
 */
function booleanTaskState(isDone, explicitStatus) {

    const status = explicitStatus || (isDone ? "Completed" : "Pending");

    return {
        status,
        completed: status === "Completed"
    };

}

/**
 * Public shape: `{ tasks, allCompleted, completedTasks, totalTasks,
 * completionPercentage }` — not a bare array. `allCompleted` and
 * the three progress fields are all decided HERE, not in
 * dashboard.page.js, for the same reason fetchInstitutionHealth()
 * exposes `started` directly rather than making the widget infer
 * it from `indicators`: whether every task is done (and how far
 * along the rest are) is institution state, not a rendering
 * concern, so the widget should never need to run `.filter()`/
 * `.every()`/business logic over the list to find out.
 *
 * `completedTasks` / `totalTasks` / `completionPercentage` back
 * the "Institution Setup Progress" bar added to the widget header
 * (Phase 5 / Section 6 refinement) — page.js only interpolates
 * these, it never computes them.
 */
export async function fetchPendingTasks() {

    const tasks = computeTasks(buildTaskSignals());

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.completed).length;

    return Promise.resolve({
        tasks,
        allCompleted: totalTasks > 0 && completedTasks === totalTasks,
        completedTasks,
        totalTasks,
        completionPercentage: totalTasks > 0
            ? Math.round((completedTasks / totalTasks) * 100)
            : 0
    });

}

/* ==========================================================
   Subscription Overview
   ----------------------------------------------------------
   Phase 5 / Section 7 — Subscription Overview (V1.0)
   Business-rule correction — Case B (approved)

   NOT a billing widget — per the approved spec, this is the
   Institution Owner's subscription health and entitlement
   widget: what plan the institution is on, whether it's in
   good standing, when it renews, and how much of its real,
   already-derivable usage the institution has used.

   Firestore-ready, same shape as every fetch* export above:
   `fetchSubscriptionOverview()` is async and resolves the exact
   public data model the spec requires —
     { plan, status, renewalDate, daysRemaining, billingStatus,
       trial, usage, actions, hasPlan }
   — synchronously today (no Firebase import, no subscription
   collection exists yet), but dashboard.page.js already awaits
   it behind its own skeleton, so wiring a real Firestore-backed
   subscription doc later only changes buildSubscriptionSignals()'s
   body; every other function's shape stays the same.

   Per the Section 7 spec, ALL subscription math — days
   remaining, plan status, billing state — is decided HERE, never
   in dashboard.page.js: the widget only renders whatever this
   function resolves, exactly like Sections 5 and 6.

   BUSINESS RULE (approved Case B): no subscription document
   existing is NOT the same thing as an active Free plan. This
   controller must never assume an active subscription when no
   subscription record exists — same "not set" discipline as
   `signals.subscription.status` itself, which Section 5 already
   reads as `null` (not "active") until a real record exists.
   `hasPlan` is derived directly from that real signal
   (`Boolean(signals.subscription?.status)`), never hardcoded, and
   whenever it's `false`, `plan`/`status`/`renewalDate`/
   `daysRemaining` are honestly `null` — not a "Free"/"Active"
   convenience default. `billingStatus` stays `"N/A"` either way
   (nothing to bill without a real plan). No new status enum value
   is introduced: `status` is `null` (absence), not a new label
   alongside Active/Trial/Expired/Suspended.

   `hasPlan: false` is exactly the signal dashboard.page.js's
   loadSubscriptionOverview() already checks to render the
   existing SubscriptionOverviewEmptyState() instead of the card —
   same `started`/`allCompleted` pattern Sections 5 and 6 use, no
   page.js change required to activate it.

   `actions.moduleId` is `null` in both branches — same single-
   source-of-truth availability gate as QUICK_ACTIONS and every
   Pending Task above: until a real Subscription & Billing module
   exists, this is the one place that says so, and dashboard.page.js
   disables the CTA area from it rather than performing fake
   navigation or a "Coming Soon" toast, per the Section 7 spec's
   Module Availability rule.
========================================================== */

function buildSubscriptionSignals() {

    // Phase 3.2: reuses buildFoundationSignals() for
    // studentCount/facultyCount so this widget and Institution
    // Health can never disagree about what's real today (Pending
    // Tasks intentionally stays on the old stub — out of scope
    // this phase). `subscription` itself is read straight off
    // getDashboardData() rather than buildFoundationSignals()'s
    // status-only shape, because this widget (unlike Institution
    // Health) needs the full record — plan and billingCycle, not
    // just status — and dashboard.data.js already carries all
    // three on the one object institutions/{id}.subscription
    // resolves to.
    const { studentCount, facultyCount } = buildFoundationSignals();

    return {
        subscription: getDashboardData().subscription,
        studentCount,
        facultyCount
    };

}

/**
 * The single place plan/status/billing/usage/actions/hasPlan are
 * decided. Every field is derived from the signals argument —
 * nothing here is a fixed value standing in for a real
 * institution's actual subscription record. `hasSubscriptionRecord`
 * is the one branch point: no subscription document existing must
 * never resolve to an active Free plan.
 */
function computeSubscriptionOverview(signals) {

    const hasSubscriptionRecord = Boolean(signals.subscription?.status);

    if (!hasSubscriptionRecord) {

        // No subscription document exists. Every plan/status/
        // renewal field is honestly `null` — not a "Free"/"Active"
        // convenience default — and `hasPlan: false` is exactly
        // what tells dashboard.page.js to render the Empty state.
        return {

            hasPlan: false,

            plan: null,
            status: null,
            renewalDate: null,
            daysRemaining: null,

            billingStatus: "N/A",

            trial: {
                active: false,
                daysRemaining: null
            },

            usage: {

                institutions: {
                    label: "Institutions",
                    value: null,
                    detail: "No subscription record yet"
                },

                students: {
                    label: "Students",
                    value: null,
                    detail: "No subscription record yet"
                },

                faculty: {
                    label: "Faculty",
                    value: null,
                    detail: "No subscription record yet"
                },

                storage: {
                    label: "Storage Used",
                    value: null,
                    detail: "No subscription record yet"
                }

            },

            actions: {
                canUpgrade: false,
                canManageSubscription: false,
                // No Subscription & Billing module exists yet — this
                // is the single source of truth dashboard.page.js
                // reads to disable the CTA area gracefully, instead
                // of a dead click. Moot today since the Empty state
                // doesn't render a CTA at all, but kept honest.
                moduleId: null
            }

        };

    }

    // A real subscription record exists (Phase 3.2: read from
    // dashboard.data.js). `signals.subscription.status` is
    // whatever registration.controller.js's
    // collectRegistrationPayload() actually wrote — today that's
    // "pending_payment" until a real billing flow exists (see
    // registration.controller.js's subscription payload), not
    // necessarily one of active/trial/expired. Genuine bug fix
    // from the pre-integration version: that version's `|| "Active"`
    // fallback would have mislabeled a real "pending_payment"
    // record as "Active" the moment this was ever wired to real
    // data — corrected here rather than carried forward, per the
    // "fix a genuine bug" allowance. Any status this doesn't
    // recognize still renders (capitalized), it just won't match
    // one of dashboard.page.js's known badge-color keys (falls
    // back to its existing neutral-badge default — no crash, no
    // page.js change needed).
    const status = SUBSCRIPTION_STATUS_LABELS[signals.subscription.status]
        || capitalizeWords(signals.subscription.status);

    // Plan id comes straight off the real record
    // (institutions/{id}.subscription.plan — written verbatim from
    // registration.controller.js's wizardState.selectedPlan, one
    // of the registration/config/plans.js ids: "basic" / "standard"
    // / "premium" / "enterprise"). Genuine bug fix: the
    // pre-integration version hardcoded this to the literal string
    // "Free", which isn't one of the actual plan ids and would have
    // shown "Free" for every real institution regardless of what
    // they actually bought. Capitalized here (not cross-referenced
    // against registration/config/plans.js's own display names, to
    // avoid a new cross-module import this pure-wiring phase isn't
    // meant to introduce) — still an honest, real value, just not
    // guaranteed to match dashboard.page.js's
    // SUBSCRIPTION_PLAN_BADGE_VARIANTS key set 1:1 (falls back to
    // its neutral badge otherwise, same as an unrecognized status).
    const plan = signals.subscription.plan
        ? capitalizeWords(signals.subscription.plan)
        : "—";

    // No billing/invoice source exists anywhere in this codebase
    // yet (no Firestore field for it on the subscription record) —
    // stays the same honest "N/A" the pre-integration version used.
    const billingStatus = "N/A";

    return {

        hasPlan: true,

        plan,
        status,
        renewalDate: "—",
        daysRemaining: null,

        billingStatus,

        trial: {
            active: false,
            daysRemaining: null
        },

        usage: {

            institutions: {
                label: "Institutions",
                value: 1,
                detail: "This institution"
            },

            students: {
                label: "Students",
                value: signals.studentCount,
                detail: signals.studentCount > 0
                    ? `${signals.studentCount} student record(s)`
                    : "No student data imported yet"
            },

            faculty: {
                label: "Faculty",
                value: signals.facultyCount,
                detail: signals.facultyCount > 0
                    ? `${signals.facultyCount} faculty record(s)`
                    : "No faculty data added yet"
            },

            storage: {
                label: "Storage Used",
                value: "—",
                detail: "Storage usage isn't tracked yet"
            }

        },

        actions: {
            canUpgrade: plan !== "Enterprise",
            canManageSubscription: false,
            moduleId: null
        }

    };

}

/**
 * Public shape: exactly the Section 7 spec's data model, plus
 * `hasPlan` — decided HERE, same as Section 5's `started` and
 * Section 6's `allCompleted`, never inferred by the widget.
 * `hasPlan` is `Boolean(signals.subscription?.status)`'s result,
 * carried straight through from computeSubscriptionOverview() —
 * never overridden or hardcoded here.
 */
export async function fetchSubscriptionOverview() {

    return Promise.resolve(
        computeSubscriptionOverview(buildSubscriptionSignals())
    );

}

/* ==========================================================
   Resource Usage
   ----------------------------------------------------------
   Phase 5 / Section 8 — Resource Usage (V1.0)

   NOT a storage widget — a quick operational view of resource
   utilization against the institution's current subscription
   (Students / Faculty / Storage). Firestore-ready, same shape
   discipline as every fetch* export above: `fetchResourceUsage()`
   is async and resolves the exact public contract the spec
   requires — { hasSubscription, resources: [{ id, label, used,
   limit, utilization, status, detail }] } — synchronously today
   (no Firebase import, no subscription.limits source exists yet),
   but dashboard.page.js already awaits it behind its own
   skeleton, so wiring real Firestore reads later only changes
   buildResourceSignals()'s body; every other function's shape
   stays the same.

   Per the Section 8 spec, ALL utilization math — used, limit,
   utilization %, status, detail text — is decided HERE, never in
   dashboard.page.js: the widget only renders whatever this
   function resolves, exactly like Sections 5–7.

   Same approved Case B discipline as Section 7: no subscription
   document existing is NOT the same thing as a usable plan with
   limits. `hasSubscription` is derived from the same real signal
   Section 7 already uses (`Boolean(signals.subscription?.status)`),
   never hardcoded, and whenever it's `false`, `resources` is an
   honest empty array — never invented plan limits, never an
   assumed student/storage capacity, never a fake usage number.
   `hasSubscription: false` is exactly what tells
   dashboard.page.js's loadResourceUsage() to render the existing
   Empty state instead of the card — no new state, no page.js
   change required.

   `RESOURCE_STATUS_THRESHOLDS` below is a fixed classification
   rule (which utilization % band counts as Warning vs Critical),
   not a data value — the same "fixed constants for classification
   logic are fine" discipline Section 5's readiness scoring already
   uses. It never stands in for a real used/limit number.

   Institution Capacity is spec'd as optional and is intentionally
   left out for now — Students, Faculty, and Storage are the three
   resources with a real, already-derivable signal; adding a
   fourth row today would mean inventing an "institutions limit"
   with no real source, which the spec explicitly rules out.
========================================================== */

// Fixed utilization-% classification boundaries, not usage data.
const RESOURCE_STATUS_THRESHOLDS = {
    critical: 90,
    warning: 75,
    healthy: 50
};

function classifyUtilization(utilization) {

    if (utilization === null) return "Excellent";

    if (utilization >= RESOURCE_STATUS_THRESHOLDS.critical) return "Critical";
    if (utilization >= RESOURCE_STATUS_THRESHOLDS.warning) return "Warning";
    if (utilization >= RESOURCE_STATUS_THRESHOLDS.healthy) return "Healthy";

    return "Excellent";

}

function buildResourceSignals() {

    // Phase 3.2: same real source as buildSubscriptionSignals()
    // above, for the same reason — computeResourceUsage() below
    // reads `signals.subscription.limits`, so this needs the full
    // record, not just status. `limits` itself still resolves to
    // `undefined` (no such field exists on institutions/{id}.
    // subscription today), so computeResourceUsage()'s existing
    // `limits.students`/`limits.faculty`/`limits.storageUsed` all
    // stay honestly `undefined` → each resource row's `used`/
    // `limit` renders `null` and its own "limit not available yet"
    // detail, exactly the behavior this widget already had —
    // Phase 3.2 only changes whether `hasSubscription` itself is
    // real.
    const { studentCount, facultyCount } = buildFoundationSignals();

    return {
        subscription: getDashboardData().subscription,
        studentCount,
        facultyCount
    };

}

/**
 * Builds one resource row. `used`/`limit` stay `null` — never 0,
 * never an invented number — whenever a real source for either
 * isn't wired in yet; `utilization` only computes when both are
 * real numbers, and `classifyUtilization(null)` reads that as the
 * lowest-alarm band rather than fabricating a percentage.
 */
function buildResourceRow(id, label, used, limit) {

    const hasRealUsage = typeof used === "number" && typeof limit === "number" && limit > 0;
    const utilization = hasRealUsage ? Math.round((used / limit) * 100) : null;
    const status = classifyUtilization(utilization);

    const detail = hasRealUsage
        ? `${used} of ${limit} used`
        : `${label} limit not available yet`;

    return {
        id,
        label,
        used: typeof used === "number" ? used : null,
        limit: typeof limit === "number" ? limit : null,
        utilization,
        status,
        detail
    };

}

/**
 * The single place used/limit/utilization/status/detail are
 * decided for every resource row.
 */
function computeResourceUsage(signals) {

    const hasSubscription = Boolean(signals.subscription?.status);

    if (!hasSubscription) {

        // No subscription document exists — no plan, so no real
        // limits to measure usage against. An empty resources
        // array, never invented capacity numbers.
        return {
            hasSubscription: false,
            resources: []
        };

    }

    // A real subscription record exists. Not reachable today (no
    // Firestore `subscription.limits` / `storage.usedBytes` source
    // is wired into buildResourceSignals() yet), kept so wiring
    // one in later only changes these inputs, not the shape:
    //   subscription.plan, subscription.limits,
    //   institution.studentCount, institution.facultyCount,
    //   storage.usedBytes
    const limits = signals.subscription.limits || {};

    return {

        hasSubscription: true,

        resources: [

            buildResourceRow(
                "students",
                "Students",
                signals.studentCount,
                limits.students
            ),

            buildResourceRow(
                "faculty",
                "Faculty",
                signals.facultyCount,
                limits.faculty
            ),

            buildResourceRow(
                "storage",
                "Storage",
                limits.storageUsed,
                limits.storageLimit
            )

        ]

    };

}

/**
 * Public shape: exactly the Section 8 spec's contract —
 * { hasSubscription, resources }. Mirrors fetchSubscriptionOverview()'s
 * async signature and Firestore-readiness for consistency.
 */
export async function fetchResourceUsage() {

    return Promise.resolve(
        computeResourceUsage(buildResourceSignals())
    );

}

/* ==========================================================
   Security Overview
   ----------------------------------------------------------
   Phase 5 / Section 9 — Security Overview (V1.0, FINAL widget)

   NOT a Security Center — a quick operational security summary
   only. Firestore-ready, same shape discipline as every fetch*
   export above: `fetchSecurityOverview()` is async and resolves
   the exact public contract the spec requires — { hasSecurityData,
   overallScore, overallStatus, lastSuccessfulLogin, activeSessions,
   failedLoginAttempts, passwordStatus, mfa, recentEvents } —
   synchronously today (no Firebase import, no auth/security
   collection exists yet), but dashboard.page.js already awaits it
   behind its own skeleton, so wiring real Firestore reads later
   only changes buildSecuritySignals()'s body; every other
   function's shape stays the same.

   Per the Section 9 spec, ALL security math — overallScore,
   overallStatus, password strength, security classifications —
   is decided HERE, never in dashboard.page.js: the widget only
   renders whatever this function resolves, exactly like
   Sections 5, 7 and 8.

   Phase 3.6A — Security Signals Integration wires two real,
   already-cached signals into this section: auth.lastLogin and
   auth.emailVerified (both read off getDashboardData().owner —
   zero extra Firestore reads, same discipline every other section
   here follows). auth.activeSessions, auth.failedAttempts,
   security.password, security.mfa and security.auditLogs still
   have no backend source anywhere in this codebase, so they stay
   an honest `null`/empty — never an invented session count,
   failed-attempt count, password/MFA state. `hasSecurityData` is
   now true whenever lastLogin OR emailVerified is present (locked
   Phase 3.6A policy), which tells dashboard.page.js's
   loadSecurityOverview() to render the card instead of the Empty
   state — but the card itself must never claim more confidence
   than two auth signals justify. See computeSecurityOverview()'s
   "Basic Security" branch below for how that's enforced.

   `SECURITY_SCORE_THRESHOLDS` below is a fixed classification
   rule (which score band counts as Warning vs Critical), not a
   data value — the same discipline Section 5's readiness scoring
   and Section 8's utilization banding already use. It only feeds
   the future full-signal branch (real password/MFA/session data);
   the Basic Security branch has its own fixed, capped scoring so
   it can never cross into Excellent/Healthy territory off two
   auth signals alone.
========================================================== */

// Fixed overallScore classification boundaries, not security data.
// Only used once real password/MFA/session signals exist (see the
// full-signal branch of computeSecurityOverview() below).
const SECURITY_SCORE_THRESHOLDS = {
    excellent: 90,
    healthy: 75,
    warning: 50
};

function classifySecurityScore(score) {

    if (score === null) return null;

    if (score >= SECURITY_SCORE_THRESHOLDS.excellent) return "Excellent";
    if (score >= SECURITY_SCORE_THRESHOLDS.healthy) return "Healthy";
    if (score >= SECURITY_SCORE_THRESHOLDS.warning) return "Warning";

    return "Critical";

}

// Fixed, capped scoring for the Basic Security branch — locked
// Phase 3.6A policy. lastLogin and emailVerified are each worth a
// modest, equal share of a deliberately low ceiling (well under
// SECURITY_SCORE_THRESHOLDS.warning) so the ring/score can never
// imply "Excellent"/"Healthy" confidence off two auth signals
// alone, regardless of how many of the two are present.
const BASIC_SECURITY_SCORE_CAP = 40;

function computeBasicSecurityScore(signals) {

    const signalCount = [signals.auth.lastLogin, signals.auth.emailVerified]
        .filter(Boolean).length;

    return Math.round((signalCount / 2) * BASIC_SECURITY_SCORE_CAP);

}

function buildSecuritySignals() {

    // lastLogin + emailVerified: real, already-cached signals
    // (Phase 3.6A) — read off getDashboardData().owner, the same
    // zero-extra-read snapshot every other section here uses.
    // activeSessions/failedAttempts/password/mfa/auditLogs still
    // have no backend source anywhere in this codebase, so they
    // stay an honest "not set", mirroring
    // buildLegacyEmptySignals()'s subscription: { status: null }
    // discipline. Once a real password/MFA/session read exists,
    // only this function's return value changes.
    const owner = getDashboardData()?.owner || {};

    return {

        auth: {
            lastLogin: owner.lastLogin ?? null,
            emailVerified: owner.emailVerified ?? false,
            activeSessions: null,
            failedAttempts: null
        },

        security: {
            password: null,
            mfa: null,
            auditLogs: null
        }

    };

}

/**
 * Latest Security Event(s) for the Security Overview card —
 * reuses Section 4/Phase 3.5C's already-loaded activity cache
 * (getRecentActivity()) instead of issuing a second Firestore
 * query, exactly per the Phase 3.6 audit's recommendation. Filters
 * the cache's already-mapped { type, description, timestamp }
 * entries down to SECURITY_EVENT ones, then adapts description ->
 * title so the shape matches what dashboard.page.js's
 * SecurityEventEntry() expects (it renders nothing without
 * `.title`). No `severity` is available from the activity cache,
 * so events render with the default accent — a known, accepted
 * trade-off (see the Phase 3.6 audit's Section 8 risk notes) until
 * a real security_event writer sets severity explicitly.
 */
function buildRecentSecurityEvents() {

    return getRecentActivity()
        .filter((entry) => entry.type === ACTIVITY_TYPE_KEYS.SECURITY_EVENT)
        .map((entry) => ({
            title: entry.description,
            timestamp: entry.timestamp
        }));

}

/**
 * The single place overallScore/overallStatus/password
 * strength/MFA state/recentEvents are decided.
 */
function computeSecurityOverview(signals) {

    // Locked Phase 3.6A policy: real data exists once EITHER auth
    // signal is present — lastLogin OR emailVerified — not just
    // password (which no backend source writes yet).
    const hasSecurityData = Boolean(signals.auth?.lastLogin || signals.auth?.emailVerified);

    if (!hasSecurityData) {

        // No security record exists. Every field is honestly
        // null/empty — never an invented login, session count,
        // failed-attempt count, MFA state, or event.
        return {

            hasSecurityData: false,

            overallScore: null,
            overallStatus: null,

            lastSuccessfulLogin: null,
            activeSessions: null,
            failedLoginAttempts: null,

            passwordStatus: {
                configured: false,
                strength: null,
                lastChanged: null
            },

            mfa: {
                available: false,
                enabled: false
            },

            recentEvents: []

        };

    }

    if (!signals.security.password && !signals.security.mfa) {

        // Basic Security branch (locked Phase 3.6A policy): only
        // lastLogin/emailVerified are real today. No password,
        // MFA, session, or failed-attempt infrastructure exists
        // yet, so those fields stay an honest null/false — never
        // given positive score weight, per the locked policy.
        // overallStatus is fixed to "Basic Security" here (not
        // derived from classifySecurityScore()'s Excellent/
        // Healthy/Warning/Critical bands) so two auth signals can
        // never be displayed as more than "basic" confidence.
        return {

            hasSecurityData: true,

            overallScore: computeBasicSecurityScore(signals),
            overallStatus: "Basic Security",

            lastSuccessfulLogin: formatRelativeTime(signals.auth.lastLogin),
            activeSessions: null,
            failedLoginAttempts: null,

            passwordStatus: {
                configured: false,
                strength: null,
                lastChanged: null
            },

            mfa: {
                available: false,
                enabled: false
            },

            recentEvents: buildRecentSecurityEvents()

        };

    }

    // A real password/MFA security record exists. Not reachable
    // today (no Firestore password/MFA source is wired into
    // buildSecuritySignals() yet), kept so wiring one in later
    // only changes these inputs, not the shape:
    //   auth.lastLogin, auth.activeSessions, auth.failedAttempts,
    //   security.password, security.mfa, security.auditLogs
    //
    // overallScore is derived from the real signals below —
    // never a literal placeholder number, even in this
    // currently-unreachable branch. Weights are a fixed business
    // rule (same discipline as SECURITY_SCORE_THRESHOLDS above),
    // not data.
    const passwordStrengthPoints = {
        Strong: 40,
        Medium: 25,
        Weak: 10
    };

    let score = passwordStrengthPoints[signals.security.password?.strength] || 0;

    if (signals.security.mfa?.enabled) score += 40;

    const failedAttempts = signals.auth.failedAttempts || 0;

    score += Math.max(0, 20 - (failedAttempts * 5));

    const overallScore = Math.min(100, Math.max(0, Math.round(score)));
    const overallStatus = classifySecurityScore(overallScore);

    return {

        hasSecurityData: true,

        overallScore,
        overallStatus,

        lastSuccessfulLogin: signals.auth.lastLogin,
        activeSessions: signals.auth.activeSessions,
        failedLoginAttempts: signals.auth.failedAttempts,

        passwordStatus: signals.security.password || {
            configured: false,
            strength: null,
            lastChanged: null
        },

        mfa: signals.security.mfa || {
            available: false,
            enabled: false
        },

        recentEvents: buildRecentSecurityEvents()

    };

}

/**
 * Public shape: exactly the Section 9 spec's contract —
 * { hasSecurityData, overallScore, overallStatus,
 *   lastSuccessfulLogin, activeSessions, failedLoginAttempts,
 *   passwordStatus, mfa, recentEvents }.
 */
export async function fetchSecurityOverview() {

    return Promise.resolve(
        computeSecurityOverview(buildSecuritySignals())
    );

}

/* ==========================================================
   Destroy
   ----------------------------------------------------------
   Nothing to tear down yet (no listeners, no timers, no
   realtime subscriptions) — kept as a named export so this
   module matches the render()/destroy() contract Super Admin
   and Institution Admin's own dashboard modules already follow.
========================================================== */

export function destroyDashboard() {

    // Future: unsubscribe any realtime listeners here.

}
