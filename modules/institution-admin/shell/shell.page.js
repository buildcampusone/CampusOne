/**
 * ==========================================================
 * CampusOne
 * Institution Admin Shell
 * ----------------------------------------------------------
 * Part 1 — Institution Admin Shell Foundation
 * Part 4.1 — Sidebar Reuse
 * Part 4.2 — Topbar Reuse
 * Part 4.3 — Activity Panel & Status Bar Reuse
 * Part 6.1 — Bottom Navigation Reuse
 * ----------------------------------------------------------
 * Pure layout scaffold. Mirrors modules/super-admin/shell/
 * shell.page.js's region breakdown (Sidebar / Topbar / Main
 * Content Outlet / Activity Panel / Status Bar / Bottom Nav)
 * so both shells share the same structural skeleton.
 *
 * #iaContent remains the one outlet router.institution.js
 * already targets (unchanged id) — Dashboard renders there
 * today, every future Institution Admin module renders there
 * next. Nothing about that contract changes in this pass.
 *
 * All four chrome regions — #iaSidebar (Part 4.1), #iaTopbar
 * (Part 4.2), #iaActivityPanel and #iaStatusBar (Part 4.3) —
 * are now real mount slots for their own components/*.page.js
 * + *.controller.js pairs, same pattern Super Admin's
 * shell.controller.js uses for its four regions. This shell
 * scaffold itself (the persistent frame around #iaContent)
 * does not change shape — only what each slot renders.
 * ==========================================================
 */

export function InstitutionAdminShellPage() {

    return /* html */ `

        <main class="ia-shell">

            <!-- ===============================
                 Sidebar
            ================================ -->

            <aside
                id="iaSidebar"
                class="ia-sidebar"
            ></aside>

            <!-- ===============================
                 Main Workspace
            ================================ -->

            <section class="ia-main">

                <!-- Topbar -->

                <header
                    id="iaTopbar"
                    class="ia-topbar"
                ></header>

                <!-- Main Content Outlet — router.institution.js target -->

                <main
                    id="iaContent"
                    class="ia-content"
                ></main>

                <!-- Status Bar -->

                <footer
                    id="iaStatusBar"
                    class="ia-statusbar"
                ></footer>

            </section>

            <!-- ===============================
                 Activity Panel
            ================================ -->

            <aside
                id="iaActivityPanel"
                class="ia-activity-panel"
            ></aside>

        </main>

        <!-- ===============================
             Mobile Bottom Navigation
             ----------------------------------
             Phase 7 — Unified shared Bottom Navigation.
             Sibling of .ia-shell (not nested inside it) so its
             position:fixed capsule is never clipped by
             .ia-shell's overflow:hidden. Hidden entirely above
             1024px via the shared bottom-nav.css
             (shared/components/bottom-nav/) — desktop's
             .ia-shell layout above is completely unaffected by
             this element existing. Same "bn-root" mount class
             super-admin/shell/shell.page.js's own #saBottomNav
             slot uses — only the id differs.
        ================================ -->

        <nav
            id="iaBottomNav"
            class="bn-root"
            aria-label="Primary mobile navigation"
        ></nav>

    `;

}
