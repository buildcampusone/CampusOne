/**
 * ==========================================================
 * CampusOne
 * Super Admin Status Bar
 * ==========================================================
 */

export function StatusBarPage() {

    return /* html */ `

        <footer class="sa-statusbar-layout">

            <div class="sa-status-left">

                <span id="systemStatus">

                    System Ready

                </span>

            </div>

            <div class="sa-status-center">

                <span id="syncStatus">

                    Last Sync : --

                </span>

            </div>

            <div class="sa-status-right">

                <span>

                    CampusOne v1.0.0

                </span>

            </div>

        </footer>

    `;

}