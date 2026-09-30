/**
 * ==========================================================
 * CampusOne
 * Super Admin Shell
 * ----------------------------------------------------------
 * Enterprise SaaS Dashboard Layout
 * ----------------------------------------------------------
 * Responsibility:
 * Only renders the dashboard shell layout.
 * All logic is handled by shell.controller.js
 * ==========================================================
 */

export function SuperAdminShellPage() {

    return /* html */ `

        <main class="sa-shell">

            <!-- ===============================
                 Sidebar
            ================================ -->

            <aside
                id="saSidebar"
                class="sa-sidebar"
            ></aside>

            <!-- ===============================
                 Main Workspace
            ================================ -->

            <section class="sa-main">

                <!-- Topbar -->

                <header
                    id="saTopbar"
                    class="sa-topbar"
                ></header>

                <!-- Dynamic Content -->

                <main
                    id="saContent"
                    class="sa-content"
                >

                </main>

                <!-- Status Bar -->

                <footer
                    id="saStatusBar"
                    class="sa-statusbar"
                ></footer>

            </section>

            <!-- ===============================
                 Activity Panel
            ================================ -->

            <aside
                id="saActivityPanel"
                class="sa-activity-panel"
            ></aside>

        </main>

        <!-- ===============================
             Mobile Bottom Navigation
             ----------------------------------
             Sibling of .sa-shell (not nested inside it) so its
             position:fixed pill is never clipped by .sa-shell's
             overflow:hidden. Hidden entirely above 1024px via the
             shared bottom-nav.css (shared/components/bottom-nav/)
             — desktop's .sa-shell layout above is completely
             unaffected by this element existing. Phase 7: this is
             now the same shared "bn-root" mount every role's shell
             uses (see modules/institution-admin/shell/shell.page.js's
             #iaBottomNav) — only the id differs, so shell.controller.js
             can find its own region.
        ================================ -->

        <nav
            id="saBottomNav"
            class="bn-root"
            aria-label="Primary mobile navigation"
        ></nav>

    `;

}