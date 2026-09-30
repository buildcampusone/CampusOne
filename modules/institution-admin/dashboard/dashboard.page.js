/**
 * ==========================================================
 * CampusOne
 * Institution Admin Dashboard
 * ----------------------------------------------------------
 * Phase 5.6.1 — Premium Information Widgets
 *
 * Scoped only to `WidgetCard()` below (Recent Activity /
 * Announcements / Upcoming Events) — KPI cards, Quick Actions,
 * and the hero are untouched:
 *   - New `WIDGET_ACCENTS` / `WIDGET_EMPTY_COPY` registries
 *     (mirror `KPI_ACCENTS` / `ACTION_ACCENTS`) — see each
 *     registry's own comment above for the mapping/rationale.
 *   - `.ia-dashboard-card--{accent}` modifier class added, and
 *     the header icon now renders through the shared
 *     `.ia-icon-badge` component instead of a bare `<span>`.
 *   - Empty state gets a large icon + title + description
 *     instead of one small muted line. dashboard.css does all
 *     the actual visual work — no routing, no Firebase, no
 *     controller changes, same id/icon/title/message data
 *     contract from getInformationWidgets().
 *
 * Phase 5.5.5.3 — Quick Actions Card Layout Alignment
 *
 * Layout-only. No markup change in this file — the DOM order
 * inside `QuickActions()` below (icon badge, then
 * `.ia-action-text`, then `.ia-action-arrow`) already reads
 * top-to-bottom the way the new vertical layout needs; only
 * dashboard.css's `.ia-action-card` flex-direction and spacing
 * change (row → column, sized/padded to match `.ia-kpi-card`).
 * See dashboard.css's own Phase 5.5.5.3 comment for the details.
 * No routing, Firebase, controller, or data-contract changes.
 *
 * Phase 5.5.5.2 — Premium Icons & Typography
 *
 * Scoped only to Quick Actions (`QuickActions()` below) — KPI
 * cards, the hero, and Information Widgets are untouched:
 *   - New `ACTION_ACCENTS` registry (mirrors `KPI_ACCENTS`)
 *     gives each action's icon tile a semantic per-action tint
 *     instead of one flat `--primary` chip for every action —
 *     see the registry's own comment above for the mapping.
 *   - `.ia-action-card--{accent}` modifier class added to the
 *     button, exactly like `.ia-kpi-card--{accent}` on the KPI
 *     cards. dashboard.css does the rest (icon tile size/tint,
 *     title/subtitle typography, truncation removal) — no new
 *     DOM nodes, same id/icon/label/subtitle data contract.
 *
 * Phase 5.5.2.4 — Quick Actions: Keyboard & Accessibility
 *
 * Scoped only to `QuickActions()` below — no other section's
 * markup changed:
 *   - `.ia-quick-actions` is now an `aria-labelledby` region
 *     pointing at the (now id'd) "Quick Actions" heading, so
 *     screen readers announce the group by name.
 *   - Each action button gets an explicit `aria-label`
 *     ("{label}: {subtitle}") so its accessible name reads as
 *     one clean phrase instead of the browser concatenating
 *     the title/subtitle spans into a run-on string.
 *   - The icon badge div is `aria-hidden="true"` — decorative,
 *     the label already carries the meaning; the chevron was
 *     already hidden from 5.5.1.2.
 *   - No new click handlers, no routes — `<button>` elements
 *     are natively keyboard-operable (Tab to focus, Enter/
 *     Space to activate) and already in natural DOM/tab order
 *     matching the visual grid, so nothing there needed
 *     changing. dashboard.css adds the visible focus-visible
 *     ring (kept keyboard-only, no mouse-click ring).
 *
 * Phase 5.4.1 — Hero Section 2.0
 *
 * Still the same four sections, entirely inside the
 * #iaContent outlet the Institution Admin Shell already owns:
 *
 *   Welcome Hero -> Quick Statistics -> Quick Actions ->
 *   Information Widgets (Recent Activity / Announcements /
 *   Upcoming Events)
 *
 * What changed vs. 5.3 (Hero only — no new sections, no new
 * data source, no business logic):
 *   - Monogram avatar (institution initial, from the same
 *     placeholder name already in the banner data) stands in
 *     for a logo until real institution branding exists.
 *   - Small live-status badge ("Active Session") with a
 *     pulsing dot — describes the session, not invented
 *     institution metrics.
 *   - True glass effect: pills/avatar/badge now use
 *     `backdrop-filter: blur()` on top of the existing
 *     translucent token background, not just translucency.
 *   - Decorative two-blob illustration layer behind the
 *     content, built from `--primary`/`--secondary` tokens
 *     with `filter: blur()` — no external image asset, so
 *     nothing to host or license.
 *
 * Foundation rules still apply:
 *   - No Firebase, no APIs, no charts, no analytics.
 *   - No seeded/fake data anywhere.
 *   - Only ever writes inside its own module folder —
 *     modules/super-admin/, shared/design-system/,
 *     shared/tokens/ and routing are untouched.
 *
 * router.institution.js's LOADERS.dashboard entry already
 * points at this exact path, so nothing in the router needed
 * to change for this pass either.
 * ==========================================================
 */

import {
    getWelcomeBannerData,
    getQuickStats,
    getQuickActions,
    getInformationWidgets,
    destroyDashboard
} from "./dashboard.controller.js";

import { Animation } from "../../../shared/core/animation/animation.service.js";

import {
    SparklesIcon,
    InstitutionIcon,
    UsersIcon,
    BriefcaseIcon,
    LayersIcon,
    ClockIcon,
    UserIcon,
    FileTextIcon,
    ClipboardIcon,
    BarChartIcon,
    InboxIcon,
    BellIcon,
    CalendarIcon,
    ChevronDownIcon
} from "../../../shared/components/icons/index.js";

/* ==========================================================
   Icon Registry
   ----------------------------------------------------------
   Maps the plain string keys dashboard.controller.js hands
   back (data layer shouldn't need to know the icon library's
   import names) to the actual shared icon components.
========================================================== */

const ICONS = {

    students: UsersIcon,
    faculty: BriefcaseIcon,
    classes: LayersIcon,
    attendance: ClockIcon,

    addStudent: UserIcon,
    addFaculty: BriefcaseIcon,
    createNotice: FileTextIcon,
    takeAttendance: ClipboardIcon,
    manageClasses: LayersIcon,
    viewReports: BarChartIcon,

    activity: InboxIcon,
    announcements: BellIcon,
    events: CalendarIcon

};

function renderIcon(key) {

    const Icon = ICONS[key];

    return Icon ? Icon() : "";

}

/* ==========================================================
   KPI Accent Registry
   ----------------------------------------------------------
   Phase 5.4.2.2 — Premium KPI Card Design

   Purely presentational: maps each KPI's existing icon key to
   one of the shared brand/status tokens so every card's icon
   container gets its own tint (`.ia-kpi-card--{accent}` sets
   `--kpi-accent` in dashboard.css). Data layer stays untouched —
   getQuickStats() still only returns id/icon/label/value/trend.
========================================================== */

const KPI_ACCENTS = {

    students: "primary",
    faculty: "secondary",
    classes: "info",
    attendance: "success"

};

/* ==========================================================
   Quick Action Accent Registry
   ----------------------------------------------------------
   Phase 5.5.5.2 — Premium Icons & Typography

   Same pattern as KPI_ACCENTS above, so Quick Actions' icon
   tiles pick up a semantic per-action tint instead of one flat
   `--primary` chip for every action (`.ia-action-card--{accent}`
   sets `--action-accent` in dashboard.css, mirroring how
   `.ia-kpi-card--{accent}` sets `--kpi-accent`). Reuses the
   same four tokens the KPI grid already uses for the actions
   that share a domain with a KPI (student/faculty/class/
   attendance), plus `warning` for the one action — Create
   Notice — that doesn't map to an existing KPI. `danger` is
   deliberately left out: it's already the sidebar/topbar's
   reserved color for destructive actions (logout, delete)
   elsewhere in this module, so reusing it here for a routine
   action would send the wrong signal. Purely presentational —
   getQuickActions() still only returns id/icon/label/subtitle.
========================================================== */

const ACTION_ACCENTS = {

    addStudent: "primary",
    addFaculty: "secondary",
    createNotice: "warning",
    takeAttendance: "success",
    manageClasses: "info",
    viewReports: "primary"

};

/* ==========================================================
   Widget Accent Registry
   ----------------------------------------------------------
   Phase 5.6.1 — Premium Information Widgets

   Same pattern as KPI_ACCENTS / ACTION_ACCENTS above: maps each
   widget's existing icon key to one of the shared brand/status
   tokens so its header icon tile gets its own tint instead of
   the old flat muted-glyph treatment (`.ia-dashboard-card--
   {accent}` sets `--widget-accent` in dashboard.css, mirroring
   `--kpi-accent` / `--action-accent`). `info` for Recent
   Activity (data/updates feed — same family as the Classes KPI/
   Manage Classes action), `warning` for Announcements (matches
   Create Notice's accent — same domain), `secondary` for
   Upcoming Events (purple reads as "calendar/schedule" and
   isn't already used by a widget). Purely presentational —
   getInformationWidgets() still only returns id/icon/title/
   message.
========================================================== */

const WIDGET_ACCENTS = {

    activity: "info",
    announcements: "warning",
    events: "secondary"

};

/* ==========================================================
   Widget Empty-State Copy
   ----------------------------------------------------------
   Phase 5.6.1 — Premium Information Widgets

   getInformationWidgets() only returns one line (`message`, e.g.
   "No recent activity yet.") which the premium empty state below
   still shows verbatim as its title. This registry supplies the
   second, explanatory line the new empty-state layout needs
   underneath it — purely presentational copy, keyed off the same
   `icon` field the data already carries, same pattern as the
   accent registries above. Falls back to a generic line for any
   widget icon not in the map, so a new widget with no matching
   entry here still renders a complete empty state instead of a
   blank gap.
========================================================== */

const WIDGET_EMPTY_COPY = {

    activity: "Student, faculty, and class updates will show up here as they happen.",
    announcements: "Notices you publish will appear here for staff and students to see.",
    events: "Exams, holidays, and meetings you schedule will be listed here."

};

const WIDGET_EMPTY_COPY_DEFAULT = "Updates will show up here once there's something to display.";

/* ==========================================================
   Dashboard Template
========================================================== */

function DashboardPage() {

    const banner = getWelcomeBannerData();

    return /* html */ `

        <section class="ia-dashboard">

            ${WelcomeHero(banner)}

            ${QuickStatistics()}

            ${QuickActions()}

            <section class="ia-dashboard-grid">

                ${getInformationWidgets().map(WidgetCard).join("")}

            </section>

        </section>

    `;

}

/* ==========================================================
   Section 1 — Welcome Hero
========================================================== */

function WelcomeHero(banner) {

    return /* html */ `

        <section class="ia-hero-card">

            <div class="ia-hero-decor" aria-hidden="true">
                <span class="ia-hero-blob ia-hero-blob-a"></span>
                <span class="ia-hero-blob ia-hero-blob-b"></span>
            </div>

            <div class="ia-hero-main">

                <div class="ia-hero-avatar">

                    <span class="ia-hero-avatar-initial">${banner.institutionInitial}</span>

                    <span class="ia-hero-avatar-badge" aria-hidden="true">
                        ${InstitutionIcon()}
                    </span>

                </div>

                <div class="ia-hero-content">

                    <div class="ia-hero-top">

                        <h2 class="ia-hero-greeting">${banner.greeting}</h2>

                        <span class="ia-hero-status">
                            <span class="ia-hero-status-dot"></span>
                            ${banner.statusLabel}
                        </span>

                    </div>

                    <p class="ia-hero-institution">${banner.institutionName}</p>

                    <div class="ia-hero-meta">

                        <span class="ia-hero-pill">${banner.academicSession}</span>

                        <span class="ia-hero-pill">${banner.currentDate}</span>

                    </div>

                </div>

            </div>

            <div class="ia-hero-icon" aria-hidden="true">

                ${SparklesIcon()}

            </div>

        </section>

    `;

}

/* ==========================================================
   Section 2 — KPI Grid
   ----------------------------------------------------------
   Phase 5.4.2.1 — responsive KPI grid (4 cols desktop, 2x2
   tablet, 2x2 mobile). Data still comes from getQuickStats()
   untouched.

   Phase 5.4.2.2 — Premium KPI Card Design
   Same data, same DOM contract (id/icon/label/value/trend) —
   only the card's visual language changes:
     - `.ia-kpi-card--{accent}` adds a per-KPI tint (see
       KPI_ACCENTS above) that the icon container in
       dashboard.css picks up via a `--kpi-accent` custom
       property; falls back to the default badge look for any
       icon key not in the registry.
     - Icon container, large value, small title, secondary
       (trend) text, premium shadow/radius/spacing all live in
       dashboard.css — no new markup nodes, no emoji, icons
       stay 100% shared SVGs from shared/components/icons.
========================================================== */

function QuickStatistics() {

    const stats = getQuickStats();

    return /* html */ `

        <section class="ia-kpi-grid">

            ${stats.map((stat) => /* html */ `

                <div class="co-card ia-kpi-card ia-kpi-card--${KPI_ACCENTS[stat.icon] || "default"}" id="${stat.id}">

                    <div class="ia-icon-badge ia-icon-badge-kpi">

                        ${renderIcon(stat.icon)}

                    </div>

                    <div class="ia-kpi-body">

                        <span class="ia-kpi-label">${stat.label}</span>

                        <h3 class="ia-kpi-value">${stat.value}</h3>

                        <span class="ia-kpi-trend">${stat.trend}</span>

                    </div>

                </div>

            `).join("")}

        </section>

    `;

}

/* ==========================================================
   Section 3 — Quick Actions
========================================================== */

function QuickActions() {

    const actions = getQuickActions();

    return /* html */ `

        <section class="ia-quick-actions" role="region" aria-labelledby="iaQuickActionsHeading">

            <h3 class="ia-section-title" id="iaQuickActionsHeading">Quick Actions</h3>

            <div class="ia-action-grid">

                ${actions.map((action) => /* html */ `

                    <button
                        type="button"
                        class="co-card ia-action-card ia-action-card--${ACTION_ACCENTS[action.icon] || "default"}"
                        id="${action.id}"
                        aria-label="${action.label}: ${action.subtitle}"
                    >

                        <div class="ia-icon-badge ia-icon-badge-action" aria-hidden="true">

                            ${renderIcon(action.icon)}

                        </div>

                        <div class="ia-action-text">

                            <span class="ia-action-title">${action.label}</span>

                            <span class="ia-action-subtitle">${action.subtitle}</span>

                        </div>

                        <span class="ia-action-arrow" aria-hidden="true">

                            ${ChevronDownIcon()}

                        </span>

                    </button>

                `).join("")}

            </div>

        </section>

    `;

}

/* ==========================================================
   Section 4 — Information Widgets
   ----------------------------------------------------------
   Phase 5.6.1 — Premium Information Widgets

   Visual-only rework, same data contract as before
   (id/icon/title/message from getInformationWidgets(),
   untouched): 
     - `.ia-dashboard-card--{accent}` modifier added, exactly
       like `.ia-kpi-card--{accent}` / `.ia-action-card--
       {accent}` — see WIDGET_ACCENTS above for the mapping.
     - Header icon goes from a small muted 14px glyph to the
       same premium accent-tinted tile the KPI/Action cards use
       (`.ia-icon-badge` + `.ia-icon-badge-widget`, sized to
       match in dashboard.css) — same shared icon-badge
       component, third context.
     - Empty state gains a large centered icon (reuses the same
       widget icon, just bigger) plus a title (the existing
       `message` string, unchanged) and a new description line
       from WIDGET_EMPTY_COPY above — was previously just one
       small muted `<p>`.
   No new DOM roots, no new data fetched, no routing/Firebase.
========================================================== */

function WidgetCard(widget) {

    const accent = WIDGET_ACCENTS[widget.icon] || "default";

    const description = WIDGET_EMPTY_COPY[widget.icon] || WIDGET_EMPTY_COPY_DEFAULT;

    return /* html */ `

        <div class="co-card ia-dashboard-card ia-dashboard-card--${accent}" id="${widget.id}">

            <div class="ia-widget-header">

                <div class="ia-icon-badge ia-icon-badge-widget" aria-hidden="true">

                    ${renderIcon(widget.icon)}

                </div>

                <h3 class="ia-section-title">${widget.title}</h3>

            </div>

            <div class="ia-dash-empty">

                <div class="ia-dash-empty-icon" aria-hidden="true">

                    ${renderIcon(widget.icon)}

                </div>

                <p class="ia-dash-empty-title">${widget.message}</p>

                <p class="ia-dash-empty-description">${description}</p>

            </div>

        </div>

    `;

}

/* ==========================================================
   Router Renderer
   ----------------------------------------------------------
   No backend, no fetch — the whole section tree is static
   placeholder markup, so unlike Super Admin's dashboard
   there's nothing to await and no skeleton-swap sequence
   needed. Still reuses the shared Animation Engine for a
   single fade-in on mount, matching the rest of the design
   language.
========================================================== */

export function render(workspace) {

    if (!workspace) {

        console.error(
            "[CampusOne] Institution Admin dashboard workspace not found."
        );

        return destroyDashboard;

    }

    workspace.innerHTML = DashboardPage();

    const contentEl = workspace.querySelector(".ia-dashboard");

    if (contentEl) {

        Animation.fadeIn(contentEl);

    }

    return destroyDashboard;

}
