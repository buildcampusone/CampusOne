/**
 * ==========================================================
 * CampusOne
 * Institution Owner Activity Panel
 * ----------------------------------------------------------
 * Part 1.4 — Activity Panel / Shell Integration
 * Mirrors modules/institution-admin/activity-panel/
 * activity-panel.page.js 1:1 — same markup structure (header +
 * feed outlet), io- classes instead of ia-.
 *
 * Placeholder only: no activity feed, no analytics, no
 * Firestore/API calls — activity-panel.controller.js renders
 * one static placeholder card, same pattern Super Admin and
 * Institution Admin's own panels use today.
 * ==========================================================
 */

export function ActivityPanelPage() {

    return /* html */ `

        <aside class="io-activity-layout">

            <header class="io-activity-header">

                <h2>

                    Activity

                </h2>

            </header>

            <section
                id="activityFeed"
                class="io-activity-feed"
            >

            </section>

        </aside>

    `;

}
