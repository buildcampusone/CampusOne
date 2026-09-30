/**
 * ==========================================================
 * CampusOne
 * Institution Admin Activity Panel
 * ----------------------------------------------------------
 * Part 4.3 — Activity Panel & Status Bar Reuse
 * Mirrors modules/super-admin/activity-panel/
 * activity-panel.page.js 1:1 — same markup structure
 * (header + feed outlet), ia- classes instead of sa-.
 *
 * Placeholder only: no activity feed, no notifications, no
 * analytics, no Firestore/API calls — activity-panel.controller.js
 * renders one static placeholder card, same as Super Admin's
 * own "System Ready" card renders today.
 * ==========================================================
 */

export function ActivityPanelPage() {

    return /* html */ `

        <aside class="ia-activity-layout">

            <header class="ia-activity-header">

                <h2>

                    Activity

                </h2>

            </header>

            <section
                id="activityFeed"
                class="ia-activity-feed"
            >

            </section>

        </aside>

    `;

}
