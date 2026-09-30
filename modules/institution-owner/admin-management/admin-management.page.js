/**
 * ==========================================================
 * CampusOne
 * Institution Owner — Institution Admin Management Page
 * ----------------------------------------------------------
 * Phase 5.1.1 — Institution Admin Management Foundation
 * Phase 5.1.2 (Part 1) — Create Institution Administrator
 * (UI & Validation Foundation)
 * Phase 5.1.2-B — Create Administrator modal → full-screen page
 *
 * Sidebar-facing page reached two ways, both dispatching through
 * the same registered module id ("users-roles" in
 * modules.registry.js — reused rather than adding a second id
 * for the same destination, per the constitution's One Source of
 * Truth rule):
 *
 *   Dashboard  -> "Institution Admin Management" Quick Action
 *   Sidebar    -> Users & Roles
 *
 * Renders the page shell — header (now with a "Create
 * Administrator" action), four summary cards, a Search input, a
 * Filter Bar, and the Admin Directory container — plus, as of
 * Phase 5.1.2 Part 1, both entry points into the Create
 * Institution Administrator flow (create-admin.page.js /
 * .controller.js): the header button and the Empty State's
 * "Create First Administrator" button, previously disabled.
 *
 * The Directory itself still always shows its Empty State
 * (admin-management.controller.js's fetchAdminDirectory() always
 * resolves empty this phase) — creating an admin through the
 * Create Administrator page prepares a payload but never
 * persists or reads it back, per Part 1's UI-only scope. No
 * edit/suspend/delete UI, no Firebase, no seeded data.
 *
 * ----------------------------------------------------------
 * Phase 5.1.2-B — Directory and Create are one module, two views
 * ----------------------------------------------------------
 * router.institution-owner.js still only ever mounts *this*
 * file for the "users-roles" module id — unchanged, no top-level
 * routing change. What used to be a single Directory render() is
 * now a small internal router below (render() / handleHashChange()
 * / mountView()) that decides, from the current hash, whether to
 * show the Directory (renderDirectoryView(), the exact Part 1
 * logic — see it a few lines down, unmodified) or the Create
 * Administrator page (create-admin.controller.js's
 * renderCreateAdminPage()):
 *
 *   #/institution-owner/users-roles         -> Directory view
 *   #/institution-owner/users-roles/create  -> Create view
 *
 * This matters for two things the top-level router can't give us
 * on its own, since parseHashRoute() only ever captures the first
 * path segment ("users-roles") and the top router no-ops on a
 * hashchange that doesn't change that segment:
 *   - Reload straight into /create: render() below inspects
 *     window.location.hash itself on first mount rather than only
 *     reacting to later hashchange events.
 *   - Browser/Android Back while on /create: this file's own
 *     `hashchange` listener (added on mount, removed on destroy)
 *     is what notices the sub-route changed back to the Directory
 *     — see setCreateExitGuard()'s doc comment below for how a
 *     dirty Create form gets a chance to block that.
 *
 * Visual language and lifecycle are reused, not reinvented:
 *   - Summary cards compose the exact `.io-kpi-grid`/`.io-kpi-card`
 *     classes dashboard.css already established (same skeleton
 *     -> fetch -> fade sequence dashboard.page.js's loadKpiGrid()
 *     uses) — no new grid/card CSS.
 *   - Directory loading uses the shared ListSkeleton component
 *     (shared/components/skeleton/list/) rather than a bespoke
 *     skeleton.
 *   - Only the header, toolbar, and the directory's own (larger,
 *     illustrated) Empty State are genuinely new markup —
 *     iam-namespaced, own admin-management.css file. The Create
 *     Administrator page's own markup/styles are `ca-`
 *     namespaced in their own create-admin.css sibling file.
 * ==========================================================
 */

import {
    fetchAdminSummary,
    fetchAdminDirectory,
    updateQueryState,
    getStatusFilterOptions,
    getDepartmentFilterOptions,
    getSortOptions,
    destroyAdminManagement as destroyAdminManagementData
} from "./admin-management.controller.js";

import { AdministratorCard } from "./admin-management.card.js";

import { bindDirectoryActions, destroyDirectoryActions } from "./admin-management.actions.js";

import {
    initCreateAdminEntryPoints,
    destroyCreateAdminEntryPoints,
    renderCreateAdminPage
} from "./create-admin.controller.js";

import { Animation } from "../../../shared/core/animation/animation.service.js";

import { BaseSkeleton } from "../../../shared/components/skeleton/base/base.skeleton.js";

import { ListSkeleton } from "../../../shared/components/skeleton/list/list.skeleton.js";

import { Button } from "../../../shared/components/button/button.js";

import { Select } from "../../../shared/components/select/select.js";

import {
    UsersIcon,
    CheckIcon,
    LockIcon,
    MailIcon,
    SearchIcon,
    PlusIcon
} from "../../../shared/components/icons/index.js";

/* ==========================================================
   Summary Card Registry
   ----------------------------------------------------------
   Same "controller hands back plain data, page.js maps a key to
   a live icon component + accent" convention dashboard.page.js's
   ICONS/KPI_ACCENTS registries already established — kept local
   to this file, not shared cross-module. Accents reuse three of
   the six `.io-kpi-card--{accent}` variants dashboard.css already
   defines (primary/success/warning/info) — no new CSS variant
   added for this page.
========================================================== */

const SUMMARY_CARDS = [
    { key: "total", label: "Total Administrators", icon: UsersIcon, accent: "primary", detail: "Institution administrators" },
    { key: "active", label: "Active", icon: CheckIcon, accent: "success", detail: "Currently active" },
    { key: "suspended", label: "Suspended", icon: LockIcon, accent: "warning", detail: "Currently suspended" },
    { key: "pending", label: "Pending Invitations", icon: MailIcon, accent: "info", detail: "Awaiting response" }
];

/* ==========================================================
   Page Template
========================================================== */

function AdminManagementPage() {

    return /* html */ `

        <section class="iam-page">

            <header class="iam-header">

                <div class="iam-header-text">

                    <h1 class="iam-title">Institution Admin Management</h1>

                    <p class="iam-subtitle">Manage administrators responsible for operating your institution.</p>

                </div>

                <div class="iam-header-actions">

                    <span id="iamCreateAdminWrap" hidden>

                        ${Button({
                            id: "iamCreateAdmin",
                            text: "Create Administrator",
                            variant: "primary",
                            icon: PlusIcon()
                        })}

                    </span>

                </div>

            </header>

            <div id="iamSummaryWrap" aria-busy="true">

                ${SummarySkeleton()}

            </div>

            ${Toolbar()}

            <div id="iamDirectoryWrap" aria-busy="true">

                ${DirectorySkeleton()}

            </div>

        </section>

    `;

}

/* ==========================================================
   Summary Cards
   ----------------------------------------------------------
   Reuses `.io-kpi-grid`/`.io-kpi-card` verbatim (dashboard.css,
   already loaded globally for Institution Owner) — same markup
   shape dashboard.page.js's QuickStatistics() renders, just a
   different data source. "Current values may be zero" per spec:
   0 is an honest count here (no admins exist yet), not a
   "no data source" placeholder, so real numbers render — no
   "—" dash convention borrowed from the Dashboard's KPI cards.
========================================================== */

function SummarySection(summary) {

    return /* html */ `

        <section class="io-kpi-grid" role="region" aria-label="Administrator summary">

            ${SUMMARY_CARDS.map((card) => /* html */ `

                <div class="co-card io-kpi-card io-kpi-card--${card.accent}" id="iamSummary-${card.key}">

                    <div class="io-icon-badge io-icon-badge-kpi">

                        ${card.icon()}

                    </div>

                    <div class="io-kpi-body">

                        <span class="io-kpi-label">${card.label}</span>

                        <h3 class="io-kpi-value">${summary[card.key] ?? 0}</h3>

                        <span class="io-kpi-trend">${card.detail}</span>

                    </div>

                </div>

            `).join("")}

        </section>

    `;

}

function SummarySkeleton() {

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

function SummaryErrorState() {

    return /* html */ `

        <div class="iam-error" role="alert">

            Failed to load administrator summary.

        </div>

    `;

}

/* ==========================================================
   Toolbar — Search + Filter Bar
   ----------------------------------------------------------
   Static, synchronous markup — per Chapter 6's Skeleton
   exception clause (no network round-trip, nothing to await),
   this section needs no skeleton. Search is hand-rolled from the
   shared `.input-wrapper`/`.input-icon`/`.input` classes
   (shared/components/input/input.css) rather than the full
   Input() wrapper, so no empty `.input-label` renders above it —
   an aria-label on the field itself covers accessibility
   instead. Filter Bar reuses Select() as-is for Status/Sort;
   Department renders through the same component with an empty
   options list, since it has no data model yet (see
   getDepartmentFilterOptions()'s own doc comment) — "Future
   Ready" is its placeholder text, not a special component.

   No backend search or filter logic, per spec — every control
   here is a real, focusable, typeable form element with nothing
   wired behind it yet.
========================================================== */

function Toolbar() {

    return /* html */ `

        <section class="iam-toolbar" role="region" aria-label="Search and filter administrators">

            <div class="iam-search">

                <div class="input-wrapper">

                    <span class="input-icon">${SearchIcon()}</span>

                    <input
                        id="iamSearchInput"
                        type="search"
                        class="input"
                        placeholder="Search administrators..."
                        aria-label="Search administrators"
                        autocomplete="off"
                    >

                </div>

            </div>

            <div class="iam-filters">

                ${Select({
                    id: "iamFilterStatus",
                    label: "Status",
                    placeholder: "All Statuses",
                    options: getStatusFilterOptions()
                })}

                ${Select({
                    id: "iamFilterDepartment",
                    label: "Department",
                    placeholder: "Future Ready",
                    options: getDepartmentFilterOptions()
                })}

                ${Select({
                    id: "iamFilterSort",
                    label: "Sort",
                    placeholder: "Sort By",
                    options: getSortOptions()
                })}

            </div>

        </section>

    `;

}

/* ==========================================================
   Admin Directory
   ----------------------------------------------------------
   Always reaches its Empty State this phase —
   fetchAdminDirectory() always resolves `[]` (no admin can exist
   yet). "Do NOT implement cards yet" per spec: there is no
   directory-row renderer here at all, only the container and its
   Empty State.
========================================================== */

function DirectorySkeleton() {

    return /* html */ `

        <div class="co-card iam-directory iam-directory-skeleton" aria-hidden="true">

            ${ListSkeleton({ items: 4, withAvatar: true })}

        </div>

    `;

}

function DirectoryEmptyState() {

    return /* html */ `

        <div class="co-card iam-directory" role="region" aria-label="Institution Administrators">

            <div class="iam-empty-state">

                <div class="iam-empty-icon" aria-hidden="true">

                    ${UsersIcon()}

                </div>

                <h3 class="iam-empty-title">No Institution Administrators Yet</h3>

                <p class="iam-empty-description">Create your first administrator to begin managing students, faculty and parents.</p>

                ${Button({
                    id: "iamCreateFirstAdmin",
                    text: "Create First Administrator",
                    variant: "primary",
                    icon: PlusIcon()
                })}

            </div>

        </div>

    `;

}

function DirectoryErrorState() {

    return /* html */ `

        <div class="iam-error" role="alert">

            Failed to load the Admin Directory.

        </div>

    `;

}

/**
 * Non-empty Directory — one AdministratorCard() per admin row.
 * Pure composition only; the card's own markup/logic lives
 * entirely in admin-management.card.js (Step 4), unmodified here.
 *
 * @param {Array<object>} admins
 * @returns {string} HTML
 */
function DirectoryList(admins) {

    return /* html */ `

        <div class="co-card iam-directory" role="list" aria-label="Institution Administrators">

            ${admins.map((admin) => AdministratorCard(admin)).join("")}

        </div>

    `;

}

/**
 * Search/Filter-empty state — distinct from DirectoryEmptyState()
 * per spec: shown when at least one administrator exists but the
 * current search/filter combination matches none of them. No
 * "Create First Administrator" CTA here (that action doesn't
 * solve "nothing matched" — clearing the search/filters does).
 */
function SearchEmptyState() {

    return /* html */ `

        <div class="co-card iam-directory" role="region" aria-label="Institution Administrators">

            <div class="iam-empty-state">

                <div class="iam-empty-icon" aria-hidden="true">

                    ${SearchIcon()}

                </div>

                <h3 class="iam-empty-title">No Matching Administrators</h3>

                <p class="iam-empty-description">Try adjusting your search or filters to find who you're looking for.</p>

            </div>

        </div>

    `;

}

/* ==========================================================
   Section Loaders
   ----------------------------------------------------------
   Same independent skeleton -> fetch -> fade -> success/error
   pattern dashboard.page.js's loadKpiGrid()/loadPendingTasks()
   etc. already establish — reused verbatim, not reinvented. A
   failure in one section never touches the other.
========================================================== */

async function loadSummary(workspace) {

    const summaryWrap = workspace.querySelector("#iamSummaryWrap");

    if (!summaryWrap) return;

    try {

        const summary = await fetchAdminSummary();

        if (!document.body.contains(summaryWrap)) return;

        const skeletonEl = summaryWrap.querySelector(".io-kpi-skeleton");

        await Animation.fadeOut(skeletonEl, { hideOnFinish: false });

        summaryWrap.innerHTML = SummarySection(summary);
        summaryWrap.removeAttribute("aria-busy");

        const gridEl = summaryWrap.querySelector(".io-kpi-grid");

        await Animation.fadeIn(gridEl);

        // C1 fix — there must never be two primary CTAs for the same
        // action: the header button only appears once we know at
        // least one administrator exists. While summary.total stays
        // at 0 (the only reachable value this phase), it stays
        // hidden and the directory's Empty State CTA is the sole
        // "create an administrator" entry point.
        const headerButtonWrap = workspace.querySelector("#iamCreateAdminWrap");

        if (headerButtonWrap) {

            headerButtonWrap.hidden = (summary.total ?? 0) === 0;

        }

    } catch (error) {

        console.error(
            "[CampusOne] Institution Admin Management — Summary Error:",
            error
        );

        summaryWrap.innerHTML = SummaryErrorState();
        summaryWrap.removeAttribute("aria-busy");

    }

}

/**
 * Shared Directory render routine — the single place that turns
 * fetchAdminDirectory()'s resolved `{ admins, hasAnyAdmins,
 * hasResults }` into the right one of three states (empty
 * directory / empty search / card list). Used both for the
 * initial mount (`isRefresh: false`, skeleton already sits in
 * the DOM from AdminManagementPage()'s own template) and for
 * every later Search/Filter/Sort change (`isRefresh: true`, so
 * this swaps whatever is currently shown back to a skeleton
 * first) — one function, no duplicated fetch/branch logic
 * between the two call sites.
 *
 * Never touches #iamSummaryWrap and never re-renders the page
 * shell — only #iamDirectoryWrap's own contents change.
 *
 * @param {HTMLElement} workspace
 * @param {{isRefresh?: boolean}} [options]
 */
async function renderDirectoryContent(workspace, { isRefresh = false } = {}) {

    const directoryWrap = workspace.querySelector("#iamDirectoryWrap");

    if (!directoryWrap) return;

    try {

        if (isRefresh) {

            directoryWrap.setAttribute("aria-busy", "true");

            const currentEl = directoryWrap.firstElementChild;

            if (currentEl) {
                await Animation.fadeOut(currentEl, { hideOnFinish: false });
            }

            if (!document.body.contains(directoryWrap)) return;

            directoryWrap.innerHTML = DirectorySkeleton();

        }

        const { admins, hasAnyAdmins, hasResults } = await fetchAdminDirectory();

        if (!document.body.contains(directoryWrap)) return;

        const skeletonEl = directoryWrap.querySelector(".iam-directory-skeleton");

        await Animation.fadeOut(skeletonEl, { hideOnFinish: false });

        directoryWrap.innerHTML = !hasAnyAdmins
            ? DirectoryEmptyState()
            : hasResults
                ? DirectoryList(admins)
                : SearchEmptyState();

        directoryWrap.removeAttribute("aria-busy");

        const contentEl = directoryWrap.querySelector(".iam-directory");

        await Animation.fadeIn(contentEl);

        // Re-checked after every render, not just the first mount:
        // DirectoryEmptyState()'s own "Create First Administrator"
        // button is a fresh DOM node each time it (re)appears (e.g.
        // clearing a search/filter combination back down to zero
        // real admins), and initCreateAdminEntryPoints() no-ops
        // safely on the header button, which is already bound.
        initCreateAdminEntryPoints(workspace);

    } catch (error) {

        console.error(
            "[CampusOne] Institution Admin Management — Directory Error:",
            error
        );

        directoryWrap.innerHTML = DirectoryErrorState();
        directoryWrap.removeAttribute("aria-busy");

    }

}

function loadDirectory(workspace) {

    return renderDirectoryContent(workspace, { isRefresh: false });

}

function refreshDirectory(workspace) {

    return renderDirectoryContent(workspace, { isRefresh: true });

}

/* ==========================================================
   Toolbar Wiring
   ----------------------------------------------------------
   Binds the Search input (debounced) and the three Select
   controls, each writing its own slice into the controller's
   queryState via updateQueryState() and then asking only the
   Directory section to refresh — never the Summary section,
   never the page shell. No shared debounce utility exists in
   this codebase yet (checked shared/utils/utils.js), so this is
   a tiny local one scoped to this file only, per the phase spec.

   Bound once per Directory-view mount, guarded by a
   dataset.bound flag on the toolbar element itself — same
   double-bind guard convention initCreateAdminEntryPoints()
   already uses for its own buttons.
========================================================== */

function debounce(fn, delay) {

    let timerId = null;

    const debounced = (...args) => {

        clearTimeout(timerId);
        timerId = setTimeout(() => fn(...args), delay);

    };

    debounced.cancel = () => clearTimeout(timerId);

    return debounced;

}

let debouncedSearchHandler = null;

function bindToolbar(workspace) {

    const toolbarEl = workspace.querySelector(".iam-toolbar");

    if (!toolbarEl || toolbarEl.dataset.bound === "true") return;

    toolbarEl.dataset.bound = "true";

    const searchInput = toolbarEl.querySelector("#iamSearchInput");
    const statusSelect = toolbarEl.querySelector("#iamFilterStatus");
    const departmentSelect = toolbarEl.querySelector("#iamFilterDepartment");
    const sortSelect = toolbarEl.querySelector("#iamFilterSort");

    debouncedSearchHandler = debounce((value) => {

        updateQueryState({ search: value });
        refreshDirectory(workspace);

    }, 300);

    if (searchInput) {

        searchInput.addEventListener("input", (event) => {
            debouncedSearchHandler(event.target.value);
        });

    }

    if (statusSelect) {

        statusSelect.addEventListener("change", (event) => {

            updateQueryState({ status: event.target.value });
            refreshDirectory(workspace);

        });

    }

    if (departmentSelect) {

        departmentSelect.addEventListener("change", (event) => {

            updateQueryState({ department: event.target.value });
            refreshDirectory(workspace);

        });

    }

    if (sortSelect) {

        sortSelect.addEventListener("change", (event) => {

            updateQueryState({ sort: event.target.value });
            refreshDirectory(workspace);

        });

    }

}

/* ==========================================================
   Directory View Renderer
   ----------------------------------------------------------
   Unmodified Part 1 logic — the exact render()/destroy pair this
   file exported on its own before Phase 5.1.2-B, just renamed
   (and no longer the file's default export) so the small router
   below it can also mount the Create Administrator view into the
   same workspace.
========================================================== */

async function renderDirectoryView(workspace) {

    workspace.innerHTML = AdminManagementPage();

    const pageEl = workspace.querySelector(".iam-page");

    if (pageEl) {

        Animation.fadeIn(pageEl);

    }

    await Promise.all([
        loadSummary(workspace),
        loadDirectory(workspace)
    ]);

    // Bound after both sections load — the header button exists
    // immediately, but #iamCreateFirstAdmin only exists once
    // loadDirectory() has replaced the skeleton with
    // DirectoryEmptyState(). initCreateAdminEntryPoints() binds
    // whichever of the two are present, each guarded against
    // double-binding on its own dataset.bound flag.
    initCreateAdminEntryPoints(workspace);

    // Toolbar controls exist synchronously (Toolbar() is part of
    // AdminManagementPage()'s own template), so this doesn't need
    // to wait on either section load — done here rather than
    // earlier only so it reads as "page is fully live" in one place.
    bindToolbar(workspace);

    bindDirectoryActions(workspace, {
        onActionComplete: () => refreshDirectory(workspace)
    });

    return destroyDirectoryView;

}

function destroyDirectoryView() {

    destroyCreateAdminEntryPoints();

    destroyDirectoryActions();

    if (debouncedSearchHandler) {
        debouncedSearchHandler.cancel();
        debouncedSearchHandler = null;
    }

    destroyAdminManagementData();

}

/* ==========================================================
   Internal Router — Directory <-> Create
   ----------------------------------------------------------
   Phase 5.1.2-B. See this file's header doc comment for why
   this lives here rather than in router.institution-owner.js.
========================================================== */

const CREATE_ROUTE_PATTERN = /^#\/institution-owner\/users-roles\/create(?:[/?].*)?$/i;

function isCreateRoute() {

    return CREATE_ROUTE_PATTERN.test(window.location.hash);

}

let workspaceEl = null;
let activeView = null; // "directory" | "create"
let activeViewDestroy = null;

/**
 * Registered by create-admin.controller.js (renderCreateAdminPage)
 * while the Create view is mounted, cleared on its own destroy.
 * Asked by handleHashChange() below before swapping *away* from
 * the Create view for a reason that wasn't already a direct
 * Back/Cancel click inside that page (i.e. a real Browser/
 * Android Back press — by the time `hashchange` fires the hash
 * has already reverted to the Directory route, so this is the
 * only remaining chance to ask "is that OK?"). Returning false
 * keeps the Create view mounted; the guard function itself is
 * responsible for surfacing whatever confirmation UI it needs.
 *
 * Same "current view can register a gatekeeper, cleared on its
 * own teardown" shape router.institution-owner.js's own
 * setNavigationGuard() already establishes for cross-module
 * navigation — this is that same pattern, one level down, for
 * navigation between this module's own two views.
 */
let exitGuard = null;

export function setCreateExitGuard(fn) {

    exitGuard = typeof fn === "function" ? fn : null;

}

function teardownActiveView() {

    if (typeof activeViewDestroy === "function") {

        try {

            activeViewDestroy();

        } catch (error) {

            console.error("[CampusOne] Users & Roles view cleanup failed:", error);

        }

    }

    activeViewDestroy = null;
    exitGuard = null;

}

async function mountView(view) {

    teardownActiveView();

    activeView = view;

    if (view === "create") {

        activeViewDestroy = renderCreateAdminPage(workspaceEl);

    } else {

        activeViewDestroy = await renderDirectoryView(workspaceEl);

    }

}

function handleHashChange() {

    const wantsCreate = isCreateRoute();

    if (wantsCreate === (activeView === "create")) return; // hash noise irrelevant to this module

    if (activeView === "create" && !wantsCreate) {

        const allowed = exitGuard ? exitGuard() : true;

        if (!allowed) {

            // Put the address bar back in sync with what's still
            // on screen — mirrors router.institution-owner.js's
            // own navigationGuard revert for the exact same
            // "blocked, but the hash already moved" situation.
            if (!isCreateRoute()) {
                window.location.hash = "#/institution-owner/users-roles/create";
            }

            return;

        }

    }

    mountView(wantsCreate ? "create" : "directory");

}

/* ==========================================================
   Router Renderer
   ----------------------------------------------------------
   Still the sole export router.institution-owner.js's LOADERS
   registers for "users-roles" — no change needed there. What was
   a single Directory render() through Part 1 is now this small
   dispatcher: it decides Directory vs. Create from the current
   hash (covering a hard reload straight into /create, not just
   later navigation) and keeps them in sync afterward.
========================================================== */

export async function render(workspace) {

    if (!workspace) {

        console.error(
            "[CampusOne] Institution Admin Management workspace not found."
        );

        return destroyAdminManagement;

    }

    workspaceEl = workspace;

    window.addEventListener("hashchange", handleHashChange);

    await mountView(isCreateRoute() ? "create" : "directory");

    return destroyAdminManagement;

}

function destroyAdminManagement() {

    window.removeEventListener("hashchange", handleHashChange);

    teardownActiveView();

    workspaceEl = null;
    activeView = null;

}
