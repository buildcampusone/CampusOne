/**
 * ==========================================================
 * CampusOne
 * Institution Owner Status Bar
 * ----------------------------------------------------------
 * Phase 2A — Owner Shell Unblock
 * Mirrors modules/institution-admin/status-bar/status-bar.page.js
 * 1:1 — same three-section layout (left / center / right).
 * Placeholder status text only — no live sync, no backend.
 * ==========================================================
 */

export function StatusBarPage() {

    return /* html */ `

        <footer class="io-statusbar-layout">

            <div class="io-status-left">

                <span id="systemStatus">

                    System Ready

                </span>

            </div>

            <div class="io-status-center">

                <span id="syncStatus">

                    Last Sync : --

                </span>

            </div>

            <div class="io-status-right">

                <span>

                    CampusOne v1.0.0

                </span>

            </div>

        </footer>

    `;

}
