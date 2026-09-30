/**
 * ==========================================================
 * CampusOne
 * Status Bar Controller
 * ==========================================================
 */

export function initStatusBar() {

    updateStatus();

}

function updateStatus() {

    const syncStatus =
        document.getElementById("syncStatus");

    if (!syncStatus) return;

    const now = new Date();

    syncStatus.textContent =
        "Last Sync : " +
        now.toLocaleTimeString();

}