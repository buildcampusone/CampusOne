/**
 * ==========================================================
 * CampusOne
 * Institution Owner Shell
 * ----------------------------------------------------------
 * Part 1.1  — Owner Dashboard Shell Configuration
 * Part 1.4B — Sidebar / Topbar / Activity Panel / Bottom Nav
 *             reuse (see shell.controller.js)
 * Phase 2A  — Status Bar reuse; stale comments corrected
 * ----------------------------------------------------------
 * Pure layout scaffold. Mirrors modules/institution-admin/
 * shell/shell.page.js and modules/super-admin/shell/
 * shell.page.js's region breakdown (Sidebar / Topbar / Main
 * Content Outlet / Activity Panel / Status Bar / Bottom Nav)
 * so all three shells share the same structural skeleton —
 * Constitution Ch.10 ("no duplicated dashboards, maximum
 * reuse across roles") is satisfied by re-using the shape,
 * not by re-deriving it.
 *
 * This file only ever defines the frame itself (#ioSidebar /
 * #ioTopbar / #ioContent / #ioActivityPanel / #ioStatusBar /
 * #ioBottomNav mount slots), styled by shell.css. Every one of
 * those slots is now a real mount point: shell.controller.js
 * renders each region's own *Page() + init*() into it (Sidebar/
 * Topbar/Activity Panel/Bottom Nav since Part 1.4B–2.3, Status
 * Bar since Phase 2A) — this file itself doesn't change shape
 * as a result, only what ends up inside each slot at runtime.
 * No router, no guard, no Firebase in this file — see
 * shell.controller.js.
 *
 * "io" prefix distinguishes this shell's regions from
 * Institution Admin's "ia" and Super Admin's "sa" ones, so
 * all three can one day mount in the same document without id
 * collisions.
 * ==========================================================
 */

export function InstitutionOwnerShellPage() {

    return /* html */ `

        <main class="io-shell">

            <!-- ===============================
                 Sidebar
            ================================ -->

            <aside
                id="ioSidebar"
                class="io-sidebar"
            ></aside>

            <!-- ===============================
                 Main Workspace
            ================================ -->

            <section class="io-main">

                <!-- Topbar -->

                <header
                    id="ioTopbar"
                    class="io-topbar"
                ></header>

                <!-- Main Content Outlet — future Owner module router target -->

                <main
                    id="ioContent"
                    class="io-content"
                ></main>

                <!-- Status Bar -->

                <footer
                    id="ioStatusBar"
                    class="io-statusbar"
                ></footer>

            </section>

            <!-- ===============================
                 Activity Panel
            ================================ -->

            <aside
                id="ioActivityPanel"
                class="io-activity-panel"
            ></aside>

        </main>

        <!-- ===============================
             Premium Mobile Bottom Navigation
             ----------------------------------
             Institution Owner's own bespoke full-width Primary
             Blue bar (modules/institution-owner/components/
             bottom-nav/) — "io-bottomnav-root" rather than the
             shared floating-pill "bn-root" Super Admin's
             #saBottomNav and Institution Admin's #iaBottomNav
             use, per this module's own design brief. Sibling of
             .io-shell (not nested inside it) so its
             position:fixed bar is never clipped by .io-shell's
             overflow:hidden. Hidden entirely above 1024px via
             bottom-nav.css; desktop's .io-shell layout above is
             completely unaffected by this element existing.
        ================================ -->

        <nav
            id="ioBottomNav"
            class="io-bottomnav-root"
            aria-label="Primary mobile navigation"
        ></nav>

    `;

}
