/**
 * ==========================================================
 * CampusOne
 * Institution Owner Activity Panel Controller
 * ----------------------------------------------------------
 * Part 1.4 — Activity Panel / Shell Integration
 * Thin wrapper around the shared Activity Panel rendering
 * engine (via shared/components/activity-panel/
 * activity-panel.controller.js's createActivityPanel()) — the
 * same pattern Super Admin and Institution Admin's own
 * activity-panel.controller.js now use. No copy-pasted render
 * logic here; this file only supplies Institution Owner's card
 * class name and its own placeholder card data.
 *
 * Placeholder-only: no feed data, no Firestore/API calls, no
 * business logic — same discipline as SA/IA's own panels.
 * ==========================================================
 */

import { createActivityPanel } from "../../../shared/components/activity-panel/activity-panel.controller.js";

const activityPanel = createActivityPanel({

    cardClassName: "io-activity-card"

});

export function initActivityPanel() {

    activityPanel.init();

    activityPanel.renderCards([

        {

            title: "CampusOne Institution Owner",

            description: [

                "Institution Owner workspace initialized successfully.",

                "Executive activity and business insights will appear here as they become available."

            ]

        }

    ]);

}
