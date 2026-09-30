/**
 * ==========================================================
 * CampusOne
 * Super Admin Profile
 * ----------------------------------------------------------
 * Phase 1: Overview, Security, Appearance are fully wired.
 * Account / Notifications / API Keys / Activity /
 * Preferences / Danger Zone are stubbed as "coming soon"
 * so the full tab structure is visible from day one.
 * ==========================================================
 */

import { initProfile, destroyProfile } from "./profile.controller.js";
import { EmptyState } from "../components/empty-state/empty-state.js";

const TABS = [
    { id: "overview", label: "Overview" },
    { id: "security", label: "Security" },
    { id: "appearance", label: "Appearance" },
    { id: "account", label: "Account" },
    { id: "notifications", label: "Notifications" },
    { id: "api", label: "API Keys" },
    { id: "activity", label: "Activity" },
    { id: "preferences", label: "Preferences" },
    { id: "danger", label: "Danger Zone" }
];

const BUILT_TABS = ["overview", "security", "appearance"];

export function ProfilePage() {

    return /* html */ `

        <section class="sa-profile">

            <header class="sa-profile-header">

                <h2>Profile</h2>

                <p>Manage your account, security, and preferences.</p>

            </header>

            <div class="sa-profile-layout">

                <nav class="sa-profile-tabs" aria-label="Profile sections">

                    ${TABS.map((tab, index) => /* html */ `

                        <button
                            type="button"
                            class="sa-profile-tab ${index === 0 ? "active" : ""}"
                            data-tab="${tab.id}"
                            aria-current="${index === 0 ? "true" : "false"}"
                        >
                            ${tab.label}
                        </button>

                    `).join("")}

                </nav>

                <div class="sa-profile-content">

                    <div class="sa-profile-tab-panel active" data-panel="overview">
                        ${overviewPanel()}
                    </div>

                    <div class="sa-profile-tab-panel" data-panel="security">
                        ${securityPanel()}
                    </div>

                    <div class="sa-profile-tab-panel" data-panel="appearance">
                        ${appearancePanel()}
                    </div>

                    ${TABS
                        .filter((tab) => !BUILT_TABS.includes(tab.id))
                        .map((tab) => /* html */ `
                            <div class="sa-profile-tab-panel" data-panel="${tab.id}">
                                ${EmptyState({
                                    title: `${tab.label} is coming soon`,
                                    message: "This section is on the Phase 2 build roadmap."
                                })}
                            </div>
                        `).join("")}

                </div>

            </div>

        </section>

    `;

}

/* ==========================================================
   Overview Panel
========================================================== */

function overviewPanel() {

    return /* html */ `

        <div class="sa-profile-card" id="profileOverviewCard">
            <!-- filled by controller: photo, name, role, email,
                 phone, username, admin id, status, last login,
                 joined date -->
        </div>

        <input
            type="file"
            id="profilePhotoInput"
            accept="image/*"
            hidden
        >

        <div class="sa-profile-section">

            <div class="sa-profile-section-header">

                <h3>Personal Information</h3>

                <button type="button" class="btn btn-secondary" id="editProfileToggle">
                    Edit Profile
                </button>

            </div>

            <form id="personalInfoForm" class="sa-profile-form" novalidate>

                <div class="sa-form-grid" id="personalInfoFields">
                    <!-- filled by controller -->
                </div>

                <div class="sa-profile-form-actions" id="personalInfoActions" hidden>

                    <button type="button" class="btn btn-ghost" id="cancelProfileEdit">
                        Cancel
                    </button>

                    <button type="submit" class="btn btn-primary" id="saveProfileEdit">
                        Save Changes
                    </button>

                </div>

            </form>

        </div>

    `;

}

/* ==========================================================
   Security Panel
========================================================== */

function securityPanel() {

    return /* html */ `

        <div class="sa-profile-section">

            <h3>Change Password</h3>

            <form id="changePasswordForm" class="sa-profile-form" novalidate>

                <div class="sa-form-grid">

                    <div class="input-group">
                        <label class="input-label" for="currentPassword">Current Password</label>
                        <div class="input-wrapper">
                            <input id="currentPassword" type="password" class="input" placeholder="Enter current password">
                        </div>
                        <p class="sa-field-error" id="currentPasswordError"></p>
                    </div>

                    <div class="input-group">
                        <label class="input-label" for="newPassword">New Password</label>
                        <div class="input-wrapper">
                            <input id="newPassword" type="password" class="input" placeholder="At least 8 characters">
                        </div>
                        <p class="sa-field-error" id="newPasswordError"></p>
                    </div>

                    <div class="input-group">
                        <label class="input-label" for="confirmNewPassword">Confirm New Password</label>
                        <div class="input-wrapper">
                            <input id="confirmNewPassword" type="password" class="input" placeholder="Re-enter new password">
                        </div>
                        <p class="sa-field-error" id="confirmNewPasswordError"></p>
                    </div>

                </div>

                <p class="sa-form-status" id="changePasswordStatus"></p>

                <div class="sa-profile-form-actions">
                    <button type="submit" class="btn btn-primary" id="changePasswordSubmit">
                        Update Password
                    </button>
                </div>

            </form>

        </div>

        <div class="sa-profile-section">

            <h3>Login History</h3>

            <div class="sa-table-wrap">
                <table class="sa-table" id="loginHistoryTable">
                    <thead>
                        <tr>
                            <th>Device</th>
                            <th>Location</th>
                            <th>IP</th>
                            <th>Time</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>

        </div>

        <div class="sa-profile-section">

            <div class="sa-profile-section-header">
                <h3>Active Sessions</h3>
                <button type="button" class="btn btn-danger-outline" id="logoutAllSessions">
                    Logout from All Devices
                </button>
            </div>

            <div class="sa-session-list" id="activeSessionsList"></div>

        </div>

    `;

}

/* ==========================================================
   Appearance Panel
========================================================== */

function appearancePanel() {

    return /* html */ `

        <div class="sa-profile-section">

            <h3>Theme</h3>

            <p class="sa-section-hint">Choose how CampusOne looks on this device.</p>

            <div class="sa-theme-switch" id="themeSwitch" role="radiogroup" aria-label="Theme">

                <button type="button" class="sa-theme-option" data-theme-option="light" role="radio">
                    <span class="sa-theme-swatch sa-theme-swatch-light"></span>
                    Light
                </button>

                <button type="button" class="sa-theme-option" data-theme-option="dark" role="radio">
                    <span class="sa-theme-swatch sa-theme-swatch-dark"></span>
                    Dark
                </button>

            </div>

        </div>

    `;

}

/* ==========================================================
   Router Renderer
========================================================== */

export function render(workspace, params = {}) {

    if (!workspace) {

        console.error("[CampusOne] Profile workspace not found.");

        return;

    }

    workspace.innerHTML = ProfilePage();

    initProfile(params.tab);

    return () => destroyProfile();

}
