/**
 * ==========================================================
 * CampusOne
 * Institution Admin Status Bar
 * ----------------------------------------------------------
 * Part 4.3 — Activity Panel & Status Bar Reuse
 * Mirrors modules/super-admin/status-bar/status-bar.page.js
 * 1:1 — same three-section layout (left / center / right).
 * Placeholder status text only — no live sync, no backend.
 * ==========================================================
 */

export function StatusBarPage() {

    return /* html */ `

        <footer class="ia-statusbar-layout">

            <div class="ia-status-left">

                <span id="systemStatus">

                    System Ready

                </span>

            </div>

            <div class="ia-status-center">

                <span id="syncStatus">

                    Last Sync : --

                </span>

            </div>

            <div class="ia-status-right">

                <span>

                    CampusOne v1.0.0

                </span>

            </div>

        </footer>

    `;

}
