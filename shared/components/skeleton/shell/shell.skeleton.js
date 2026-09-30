/**
 * ==========================================================
 * CampusOne
 * Super Admin Shell Skeleton
 * ----------------------------------------------------------
 * Phase 5.1 — Skeleton Loading Screen
 * ----------------------------------------------------------
 * Composition only — same rule as dashboard.skeleton.js:
 * every shape here comes from the existing Skeleton Engine
 * (BaseSkeleton / ListSkeleton / ButtonSkeleton /
 * DashboardSkeleton). No new loading mechanism, no new visual
 * primitive — this file just arranges the existing ones into
 * the shape of the Super Admin shell (sidebar, topbar,
 * content, activity panel, status bar) so all five regions
 * can be painted instantly, before Firebase has even answered
 * whether the user is authorized.
 *
 * Deliberately reuses the REAL layout classes each region's
 * own page.js already renders into (.sa-topbar-layout,
 * .sa-activity-layout, .sa-statusbar-layout, .sa-sidebar-inner,
 * .sa-sidebar-brand) instead of inventing new wrapper classes.
 * Those classes already carry the exact height/width/padding
 * rules from topbar.css / status-bar.css / activity-panel.css
 * / sidebar.css — so the skeleton occupies pixel-identical
 * space to the real component that replaces it. That's what
 * makes the swap "No Layout Shift" for free, with zero extra
 * sizing CSS.
 * ==========================================================
 */

import { BaseSkeleton } from "../base/base.skeleton.js";
import { ListSkeleton } from "../list/list.skeleton.js";
import { ButtonSkeleton } from "../button/button.skeleton.js";
import { DashboardSkeleton } from "../dashboard/dashboard.skeleton.js";

/* ==========================================================
   Sidebar
========================================================== */

export function ShellSidebarSkeleton() {

    return `
        <div class="sa-sidebar-inner">

            <div class="sa-sidebar-brand">

                ${BaseSkeleton.rounded(52, 52, "14px")}

                <div class="skel-shell-sidebar-brand-text">

                    ${BaseSkeleton.rectangle("120px", "16px")}

                    ${BaseSkeleton.rectangle("80px", "12px")}

                </div>

            </div>

            <div class="skel-shell-sidebar-nav">

                ${Array.from({ length: 3 }, () => `
                    <div class="skel-shell-sidebar-group">

                        ${BaseSkeleton.rectangle("64px", "11px")}

                        ${ListSkeleton({ items: 3, withAvatar: false })}

                    </div>
                `).join("")}

            </div>

        </div>
    `;

}

/* ==========================================================
   Topbar
========================================================== */

export function ShellTopbarSkeleton() {

    return `
        <div class="sa-topbar-layout">

            <div class="sa-topbar-left">

                ${BaseSkeleton.rounded(40, 40, "12px")}

                <div class="sa-page-title">

                    ${BaseSkeleton.rectangle("140px", "18px")}

                    ${BaseSkeleton.rectangle("190px", "12px")}

                </div>

            </div>

            <div class="sa-topbar-search">

                ${BaseSkeleton.rounded("100%", "40px", "var(--radius-md)")}

            </div>

            <div class="sa-topbar-right">

                ${BaseSkeleton.circle(40)}

                ${BaseSkeleton.circle(40)}

            </div>

        </div>
    `;

}

/* ==========================================================
   Content
   ----------------------------------------------------------
   Same composition dashboard.page.js uses for its own
   render() skeleton (Render Skeleton -> Fetch Data -> Fade
   Skeleton -> Render Real UI) — imported from there, not
   redefined, so the shell's pre-auth skeleton and the
   dashboard module's own loading skeleton are pixel- and
   markup-identical. That identity is what makes the handoff
   between "shell still verifying" and "dashboard module now
   fetching" invisible: the pixels never change, only which
   piece of code is technically responsible for them.
========================================================== */

export function ShellContentSkeleton() {

    return `
        <div class="sa-dashboard-skeleton-wrap">

            ${DashboardSkeleton({

                statCards: 4,

                tableRows: 5,

                tableColumns: 4

            })}

            <div class="skel-shell-quick-actions">

                ${Array.from(
                    { length: 4 },
                    () => ButtonSkeleton({ width: "100%", height: "64px" })
                ).join("")}

            </div>

        </div>
    `;

}

/* ==========================================================
   Activity Panel
========================================================== */

export function ShellActivityPanelSkeleton() {

    return `
        <div class="sa-activity-layout">

            <header class="sa-activity-header">

                ${BaseSkeleton.rectangle("70px", "16px")}

            </header>

            <section class="sa-activity-feed">

                ${ListSkeleton({ items: 6, withAvatar: true })}

            </section>

        </div>
    `;

}

/* ==========================================================
   Bottom Navigation (mobile only)
   ----------------------------------------------------------
   Reuses the real .bn-pill class from the shared
   shared/components/bottom-nav/bottom-nav.css for
   sizing/glass/position, same rule as every region above —
   this file only adds the internal per-item spacing
   (.skel-shell-bottomnav-item, in shell.skeleton.css).
========================================================== */

export function ShellBottomNavSkeleton() {

    return `
        <div class="bn-pill">

            ${Array.from({ length: 5 }, () => `
                <div class="skel-shell-bottomnav-item">

                    ${BaseSkeleton.circle(22)}

                </div>
            `).join("")}

        </div>
    `;

}

/* ==========================================================
   Status Bar
========================================================== */

export function ShellStatusBarSkeleton() {

    return `
        <div class="sa-statusbar-layout">

            <div class="sa-status-left">

                ${BaseSkeleton.rectangle("90px", "11px")}

            </div>

            <div class="sa-status-center">

                ${BaseSkeleton.rectangle("110px", "11px")}

            </div>

            <div class="sa-status-right">

                ${BaseSkeleton.rectangle("100px", "11px")}

            </div>

        </div>
    `;

}
