/**
 * ==========================================================
 * CampusOne
 * Activity Core — Public Entry Point
 * ----------------------------------------------------------
 * Activity Panel Engine Extraction. Generalizes Institution
 * Admin's (and originally Super Admin's) copy-pasted Activity
 * Panel render logic — mount + write cards into the feed
 * outlet — into a single parametrized engine, mirroring the
 * Sidebar/Topbar engine extractions in
 * shared/core/navigation/. Card content (title/description)
 * stays role-owned, passed in at render time — this engine
 * never fetches or interprets what a card means.
 *
 *   - activity-panel.engine.js -> createActivityPanelEngine()
 *
 * Any role's Activity Panel should import from this file
 * rather than reaching into activity-panel.engine.js directly.
 * ==========================================================
 */

export { createActivityPanelEngine } from "./activity-panel.engine.js";
