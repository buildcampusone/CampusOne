/**
 * ==========================================================
 * CampusOne
 * Institution Admin Activity Panel Controller
 * ----------------------------------------------------------
 * Part 4.3 — Activity Panel & Status Bar Reuse
 * Activity Panel Engine Extraction — this file is now a thin
 * wrapper over shared/components/activity-panel/
 * activity-panel.controller.js's createActivityPanel() factory
 * (itself over shared/core/activity/activity-panel.engine.js).
 * The generic mount/render logic that used to be copy-pasted
 * here (and in Super Admin's activity-panel.controller.js
 * before it) now lives in that shared engine. Exact same
 * output as before — no visual/UX change — this file just no
 * longer owns the `innerHTML` write itself.
 *
 * Placeholder-only, unchanged from before: no feed data, no
 * Firestore/API calls, no business logic — still renders one
 * static placeholder card into #activityFeed.
 * ==========================================================
 */

import { createActivityPanel } from "../../../shared/components/activity-panel/activity-panel.controller.js";

const activityPanel = createActivityPanel({

    cardClassName: "ia-activity-card"

});

export function initActivityPanel() {

    activityPanel.init();

    activityPanel.renderCards([

        {

            title: "System Ready",

            description: "CampusOne Institution Admin has been initialized successfully."

        }

    ]);

}
