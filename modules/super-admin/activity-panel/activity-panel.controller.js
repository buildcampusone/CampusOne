/**
 * ==========================================================
 * CampusOne
 * Activity Panel Controller
 * ----------------------------------------------------------
 * Activity Panel Engine Extraction — this file is now a thin
 * wrapper over shared/components/activity-panel/
 * activity-panel.controller.js's createActivityPanel() factory
 * (itself over shared/core/activity/activity-panel.engine.js).
 * The generic mount/render logic that used to be copy-pasted
 * here (and duplicated again in Institution Admin's own
 * activity-panel.controller.js) now lives in that shared
 * engine. Exact same output as before — no visual/UX change —
 * this file just no longer owns the `innerHTML` write itself.
 * ==========================================================
 */

import { createActivityPanel } from "../../../shared/components/activity-panel/activity-panel.controller.js";

const activityPanel = createActivityPanel({

    cardClassName: "sa-activity-card"

});

export function initActivityPanel() {

    activityPanel.init();

    activityPanel.renderCards([

        {

            title: "System Ready",

            description: "CampusOne Super Admin has been initialized successfully."

        }

    ]);

}
