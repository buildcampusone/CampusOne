/**
 * ==========================================================
 * CampusOne
 * Super Admin Profile Controller
 * ==========================================================
 */

import {
    getProfile,
    updateProfile,
    uploadProfilePhoto,
    removeProfilePhoto,
    changePassword,
    getLoginHistory,
    getActiveSessions,
    revokeSession,
    revokeAllSessions,
    PROFILE_UPDATED_EVENT
} from "./profile.service.js";

import {
    validatePassword
} from "../../../shared/validation/password.js";

import {
    validateConfirmPassword
} from "../../../shared/validation/confirm-password.js";

import {
    getTheme,
    setTheme
} from "../../../shared/utils/theme.js";

import {
    SearchableSelect,
    initSearchableSelect
} from "../../../shared/components/searchable-select/searchable-select.js";

import { showToast } from "../../../shared/components/toast/toast.js";

import { setNavigationGuard } from "../router/router.super.js";

import { COUNTRIES } from "../../../shared/data/countries.js";
import { INDIA_STATES } from "../../../shared/data/india-states.js";

let initialized = false;
let isEditingProfile = false;
let currentProfile = null;
let isDirty = false;
let countrySelectCtrl = null;

const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];

const FIELD_DEFS = [
    { id: "fullName", label: "Full Name", type: "text" },
    { id: "displayName", label: "Display Name", type: "text" },
    { id: "dob", label: "Date of Birth", type: "date" },
    { id: "gender", label: "Gender", type: "select", options: GENDER_OPTIONS },
    { id: "country", label: "Country", type: "country" },
    { id: "state", label: "State", type: "state" },
    { id: "city", label: "City", type: "text" },
    { id: "address", label: "Address", type: "text" },
    { id: "timezone", label: "Time Zone", type: "select", options: ["Asia/Kolkata (IST, UTC+05:30)"] },
    { id: "language", label: "Language", type: "text" }
];

export function initProfile(initialTab) {

    if (initialTab) {

        // Already mounted (revisiting Profile while it's the
        // active module) — just switch tabs, don't re-run the
        // full init (would double-bind everything).
        if (initialized) {

            activateTab(initialTab);

            return;

        }

    } else if (initialized) {

        return;

    }

    initialized = true;

    bindTabs();
    bindThemeSwitch();

    loadOverview();
    bindEditToggle();

    loadSecurity();
    bindChangePasswordForm();
    bindLogoutAllSessions();

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);

    if (initialTab) {

        activateTab(initialTab);

    }

}

export function destroyProfile() {

    initialized = false;
    isEditingProfile = false;
    isDirty = false;
    currentProfile = null;
    countrySelectCtrl = null;

    window.removeEventListener("beforeunload", handleBeforeUnload);
    window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);

    setNavigationGuard(null);

}

/**
 * Fired by profile.service.js whenever the profile document
 * changes (Save Changes, photo upload/remove, or an update
 * from elsewhere in the app). Keeps this controller's cached
 * currentProfile — and the Overview card — in sync without a
 * page reload. Skipped while the edit form is open so we don't
 * clobber fields the user is actively typing into.
 */
function handleProfileUpdated(event) {

    currentProfile = event.detail;

    renderOverviewCard(currentProfile);

    if (!isEditingProfile) {
        renderPersonalInfoFields(currentProfile);
    }

}

/* ==========================================================
   Unsaved Changes Guard
========================================================== */

function handleBeforeUnload(event) {

    if (!isDirty) return;

    event.preventDefault();
    event.returnValue = "";

}

function confirmDiscardIfDirty() {

    if (!isDirty) return true;

    const leave = confirm(
        "You have unsaved changes. Are you sure you want to leave?"
    );

    if (leave) {
        isDirty = false;
    }

    return leave;

}

function markDirty() {

    isDirty = true;

}

/* ==========================================================
   Tabs
========================================================== */

function bindTabs() {

    const tabs = document.querySelectorAll(".sa-profile-tab");

    tabs.forEach((tab) => {

        tab.addEventListener("click", () => {

            if (tab.dataset.tab === "overview" || !isEditingProfile) {

                activateTab(tab.dataset.tab);

                return;

            }

            if (!confirmDiscardIfDirty()) return;

            exitEditMode();

            activateTab(tab.dataset.tab);

        });

    });

}

/**
 * Activates a Profile tab by id — same effect as the user
 * clicking that tab button. Exported so other parts of the
 * app (e.g. Topbar's Account Settings / Security / Appearance
 * menu items) can deep-link straight into a specific tab
 * instead of always landing on Overview.
 */
export function activateTab(tabId) {

    const tabs = document.querySelectorAll(".sa-profile-tab");

    const targetTab = [...tabs].find((t) => t.dataset.tab === tabId);

    if (!targetTab) return;

    tabs.forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-current", "false");
    });

    targetTab.classList.add("active");
    targetTab.setAttribute("aria-current", "true");

    document.querySelectorAll(".sa-profile-tab-panel").forEach((panel) => {
        panel.classList.toggle("active", panel.dataset.panel === tabId);
    });

}

/* ==========================================================
   Overview
========================================================== */

async function loadOverview() {

    currentProfile = await getProfile();

    renderOverviewCard(currentProfile);
    renderPersonalInfoFields(currentProfile);
    bindPhotoUpload();

}

function renderOverviewCard(profile) {

    const card = document.getElementById("profileOverviewCard");

    if (!card) return;

    const initials = (profile.fullName || "?")
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    const hasPhoto = !!profile.photoURL;

    card.innerHTML = /* html */ `

        <div class="sa-profile-avatar-wrap">

            <div class="sa-profile-avatar-lg" id="profileAvatarPreview">

                ${hasPhoto ? `<img src="${profile.photoURL}" alt="${profile.fullName}">` : initials}

                <button
                    type="button"
                    class="sa-avatar-hover-btn"
                    id="avatarMenuBtn"
                    aria-haspopup="true"
                    aria-expanded="false"
                    aria-label="Change profile photo"
                >
                    ${cameraIcon()}
                    <span>Change Photo</span>
                </button>

            </div>

            <div class="sa-avatar-menu" id="avatarMenu" role="menu" hidden>

                <button type="button" data-action="upload" role="menuitem">
                    ${uploadIcon()} Upload Photo
                </button>

                ${hasPhoto ? /* html */ `
                    <button type="button" data-action="preview" role="menuitem">
                        ${eyeIcon()} Preview Photo
                    </button>

                    <button type="button" data-action="remove" role="menuitem" class="sa-avatar-menu-danger">
                        ${trashIcon()} Remove Photo
                    </button>
                ` : ""}

            </div>

        </div>

        <div class="sa-profile-identity">

            <div class="sa-profile-identity-row">
                <h3>${profile.fullName}</h3>
                <span class="sa-badge sa-badge-primary">${profile.role}</span>
                <span class="sa-badge sa-badge-success">${profile.status}</span>
            </div>

            <div class="sa-profile-meta-grid">

                <div class="sa-profile-meta-item">
                    <span class="sa-meta-label">Email</span>
                    <span class="sa-meta-value">${profile.email}</span>
                </div>

                <div class="sa-profile-meta-item">
                    <span class="sa-meta-label">Phone</span>
                    <span class="sa-meta-value">${profile.phone}</span>
                </div>

                <div class="sa-profile-meta-item">
                    <span class="sa-meta-label">Institution</span>
                    <span class="sa-meta-value">${profile.institution || "—"}</span>
                </div>

                <div class="sa-profile-meta-item">
                    <span class="sa-meta-label">Designation</span>
                    <span class="sa-meta-value">${profile.designation || "—"}</span>
                </div>

                <div class="sa-profile-meta-item">
                    <span class="sa-meta-label">Username</span>
                    <span class="sa-meta-value">@${profile.username}</span>
                </div>

                <div class="sa-profile-meta-item">
                    <span class="sa-meta-label">Admin ID</span>
                    <span class="sa-meta-value">${profile.adminId}</span>
                </div>

                <div class="sa-profile-meta-item">
                    <span class="sa-meta-label">Last Login</span>
                    <span class="sa-meta-value">${formatDateTime(profile.lastLogin)}</span>
                </div>

                <div class="sa-profile-meta-item">
                    <span class="sa-meta-label">Joined</span>
                    <span class="sa-meta-value">${formatDate(profile.joinedDate)}</span>
                </div>

            </div>

        </div>

    `;

}

/* ==========================================================
   Avatar Menu — Upload / Remove / Preview
   ----------------------------------------------------------
   Bound once (delegated on the card container, which itself
   is never replaced — only its innerHTML is) so it keeps
   working across every renderOverviewCard() re-render.
========================================================== */

function bindPhotoUpload() {

    const card = document.getElementById("profileOverviewCard");
    const fileInput = document.getElementById("profilePhotoInput");

    if (!card || !fileInput) return;

    card.addEventListener("click", (event) => {

        const menuBtn = event.target.closest("#avatarMenuBtn");
        const actionBtn = event.target.closest(".sa-avatar-menu [data-action]");

        if (menuBtn) {

            toggleAvatarMenu();
            return;

        }

        if (actionBtn) {

            handleAvatarMenuAction(actionBtn.dataset.action, fileInput);
            return;

        }

    });

    document.addEventListener("click", (event) => {

        const menu = document.getElementById("avatarMenu");

        if (!menu || menu.hidden) return;

        if (!event.target.closest(".sa-profile-avatar-wrap")) {

            closeAvatarMenu();

        }

    });

    fileInput.addEventListener("change", async () => {

        const file = fileInput.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Please choose an image file.");
            return;
        }

        const reader = new FileReader();

        reader.onload = async () => {

            currentProfile = await uploadProfilePhoto(reader.result);

            renderOverviewCard(currentProfile);

            showToast({
                type: "success",
                title: "Photo Updated",
                message: "Your profile photo has been changed successfully."
            });

        };

        reader.readAsDataURL(file);

        // Allow re-selecting the same file later.
        fileInput.value = "";

    });

}

function toggleAvatarMenu() {

    const menu = document.getElementById("avatarMenu");
    const btn = document.getElementById("avatarMenuBtn");

    if (!menu || !btn) return;

    const willOpen = menu.hidden;

    menu.hidden = !willOpen;
    btn.setAttribute("aria-expanded", String(willOpen));

}

function closeAvatarMenu() {

    const menu = document.getElementById("avatarMenu");
    const btn = document.getElementById("avatarMenuBtn");

    if (menu) menu.hidden = true;
    if (btn) btn.setAttribute("aria-expanded", "false");

}

async function handleAvatarMenuAction(action, fileInput) {

    closeAvatarMenu();

    if (action === "upload") {

        fileInput.click();
        return;

    }

    if (action === "preview") {

        showAvatarPreview(currentProfile.photoURL, currentProfile.fullName);
        return;

    }

    if (action === "remove") {

        const confirmed = confirm("Remove your profile photo?");

        if (!confirmed) return;

        currentProfile = await removeProfilePhoto();

        renderOverviewCard(currentProfile);

        showToast({
            type: "success",
            title: "Photo Removed",
            message: "Your profile photo has been removed."
        });

    }

}

function showAvatarPreview(url, name) {

    if (!url) return;

    let lightbox = document.getElementById("avatarLightbox");

    if (!lightbox) {

        lightbox = document.createElement("div");
        lightbox.id = "avatarLightbox";
        lightbox.className = "sa-avatar-lightbox";
        document.body.appendChild(lightbox);

    }

    lightbox.innerHTML = /* html */ `

        <div class="sa-avatar-lightbox-backdrop" id="avatarLightboxBackdrop"></div>

        <div class="sa-avatar-lightbox-content">

            <button type="button" class="sa-avatar-lightbox-close" id="avatarLightboxClose" aria-label="Close preview">
                ${closeIcon()}
            </button>

            <img src="${url}" alt="${name || "Profile photo"}">

        </div>

    `;

    lightbox.hidden = false;

    const close = () => { lightbox.hidden = true; };

    document.getElementById("avatarLightboxBackdrop")?.addEventListener("click", close);
    document.getElementById("avatarLightboxClose")?.addEventListener("click", close);

}

/* ==========================================================
   Personal Info — Edit Form
========================================================== */

function renderPersonalInfoFields(profile) {

    const container = document.getElementById("personalInfoFields");

    if (!container) return;

    if (!isEditingProfile) {

        container.innerHTML = FIELD_DEFS.map((field) => readonlyFieldHTML(field, profile)).join("");
        return;

    }

    container.innerHTML = FIELD_DEFS.map((field) => editableFieldHTML(field, profile)).join("");

    bindSpecialFieldBehavior(profile);
    bindDirtyTracking(container);

}

function readonlyFieldHTML(field, profile) {

    return /* html */ `

        <div class="input-group">

            <label class="input-label" for="pf-${field.id}">${field.label}</label>

            <div class="input-wrapper">
                <input
                    id="pf-${field.id}"
                    type="text"
                    class="input"
                    value="${escapeAttr(profile[field.id] || "")}"
                    readonly
                >
            </div>

        </div>

    `;

}

function editableFieldHTML(field, profile) {

    if (field.type === "select") {

        return /* html */ `

            <div class="input-group">

                <label class="input-label" for="pf-${field.id}">${field.label}</label>

                <div class="input-wrapper">
                    <select id="pf-${field.id}" class="input select">
                        <option value="" disabled ${!profile[field.id] ? "selected" : ""}>Select ${field.label}</option>
                        ${field.options.map((opt) => /* html */ `
                            <option value="${opt}" ${profile[field.id] === opt ? "selected" : ""}>${opt}</option>
                        `).join("")}
                    </select>
                </div>

            </div>

        `;

    }

    if (field.type === "country") {

        return SearchableSelect({
            id: "pf-country",
            label: "Country",
            placeholder: "Search country..."
        });

    }

    if (field.type === "state") {

        // Filled in by renderStateField() once the country
        // value is known — depends on which country is
        // currently selected.
        return `<div class="input-group" id="pf-state-group"></div>`;

    }

    return /* html */ `

        <div class="input-group">

            <label class="input-label" for="pf-${field.id}">${field.label}</label>

            <div class="input-wrapper">
                <input
                    id="pf-${field.id}"
                    type="${field.type}"
                    class="input"
                    value="${escapeAttr(profile[field.id] || "")}"
                >
            </div>

        </div>

    `;

}

function bindSpecialFieldBehavior(profile) {

    countrySelectCtrl = initSearchableSelect("pf-country", COUNTRIES, {
        value: profile.country || "",
        onChange(value) {

            renderStateField(value, "");
            markDirty();

        }
    });

    renderStateField(profile.country || "", profile.state || "");

}

function renderStateField(country, currentState) {

    const group = document.getElementById("pf-state-group");

    if (!group) return;

    if (country === "India") {

        group.innerHTML = /* html */ `

            <label class="input-label" for="pf-state">State</label>

            <div class="input-wrapper">
                <select id="pf-state" class="input select">
                    <option value="" disabled ${!currentState ? "selected" : ""}>Select State / UT</option>
                    ${INDIA_STATES.map((state) => /* html */ `
                        <option value="${state}" ${state === currentState ? "selected" : ""}>${state}</option>
                    `).join("")}
                </select>
            </div>

        `;

        document.getElementById("pf-state")?.addEventListener("change", markDirty);

    } else {

        group.innerHTML = /* html */ `

            <label class="input-label" for="pf-state">State / Province</label>

            <div class="input-wrapper">
                <input
                    id="pf-state"
                    type="text"
                    class="input"
                    value="${escapeAttr(currentState || "")}"
                    placeholder="Enter state or province"
                >
            </div>

        `;

        document.getElementById("pf-state")?.addEventListener("input", markDirty);

    }

}

function bindDirtyTracking(container) {

    container.querySelectorAll("input, select").forEach((el) => {

        // The Country combobox's visible text input already
        // triggers markDirty() via its onChange callback in
        // bindSpecialFieldBehavior — skip it here to avoid
        // marking dirty on every keystroke while just typing
        // a search query that hasn't been selected yet.
        if (el.id === "pf-countryInput") return;

        const eventName = el.tagName === "SELECT" ? "change" : "input";

        el.addEventListener(eventName, markDirty);

    });

}

function bindEditToggle() {

    const toggleBtn = document.getElementById("editProfileToggle");
    const cancelBtn = document.getElementById("cancelProfileEdit");
    const actions = document.getElementById("personalInfoActions");
    const form = document.getElementById("personalInfoForm");

    if (!toggleBtn || !form) return;

    toggleBtn.addEventListener("click", () => {

        isEditingProfile = true;
        isDirty = false;

        renderPersonalInfoFields(currentProfile);

        actions.hidden = false;
        toggleBtn.hidden = true;

        setNavigationGuard(confirmDiscardIfDirty);

    });

    cancelBtn?.addEventListener("click", () => {

        if (!confirmDiscardIfDirty()) return;

        exitEditMode();

    });

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalLabel = submitBtn?.textContent;

        const updates = {};

        FIELD_DEFS.forEach((field) => {

            if (field.type === "country") {

                updates.country = countrySelectCtrl
                    ? countrySelectCtrl.getValue()
                    : (document.getElementById("pf-countryValue")?.value || "");

                return;

            }

            if (field.type === "state") {

                updates.state = document.getElementById("pf-state")?.value.trim() || "";

                return;

            }

            if (field.type === "select") {

                updates[field.id] = document.getElementById(`pf-${field.id}`)?.value || "";

                return;

            }

            updates[field.id] = document.getElementById(`pf-${field.id}`)?.value.trim() || "";

        });

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Saving...";
        }

        try {

            currentProfile = await updateProfile(updates);

            isDirty = false;

            exitEditMode();

            renderOverviewCard(currentProfile);

            showToast({
                type: "success",
                title: "Changes Saved Successfully",
                message: "Your profile has been updated successfully."
            });

        } catch (error) {

            showToast({
                type: "error",
                title: "Save Failed",
                message: error.message || "Unable to update your profile. Please try again."
            });

        } finally {

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalLabel;
            }

        }

    });

}

function exitEditMode() {

    isEditingProfile = false;
    isDirty = false;

    setNavigationGuard(null);

    renderPersonalInfoFields(currentProfile);

    const actions = document.getElementById("personalInfoActions");
    const toggleBtn = document.getElementById("editProfileToggle");

    if (actions) actions.hidden = true;
    if (toggleBtn) toggleBtn.hidden = false;

}

/* ==========================================================
   Security
========================================================== */

async function loadSecurity() {

    const [history, sessions] = await Promise.all([
        getLoginHistory(),
        getActiveSessions()
    ]);

    renderLoginHistory(history);
    renderActiveSessions(sessions);

}

function renderLoginHistory(history) {

    const tbody = document.querySelector("#loginHistoryTable tbody");

    if (!tbody) return;

    tbody.innerHTML = history.map((entry) => /* html */ `

        <tr>
            <td>${entry.device}</td>
            <td>${entry.location}</td>
            <td>${entry.ip}</td>
            <td>${formatDateTime(entry.time)}</td>
            <td>
                <span class="sa-badge ${entry.status === "Success" ? "sa-badge-success" : "sa-badge-danger"}">
                    ${entry.status}
                </span>
            </td>
        </tr>

    `).join("");

}

function renderActiveSessions(sessions) {

    const list = document.getElementById("activeSessionsList");

    if (!list) return;

    list.innerHTML = sessions.map((session) => /* html */ `

        <div class="sa-session-item" data-session-id="${session.id}">

            <div>
                <p class="sa-session-device">
                    ${session.device}
                    ${session.current ? '<span class="sa-badge sa-badge-primary">This device</span>' : ""}
                </p>
                <p class="sa-session-meta">${session.location} · Active ${formatDateTime(session.lastActive)}</p>
            </div>

            ${
                session.current
                    ? ""
                    : `<button type="button" class="btn btn-ghost sa-session-logout" data-session-id="${session.id}">Logout</button>`
            }

        </div>

    `).join("");

    list.querySelectorAll(".sa-session-logout").forEach((btn) => {

        btn.addEventListener("click", async () => {

            await revokeSession(btn.dataset.sessionId);

            const sessions = await getActiveSessions();

            renderActiveSessions(sessions);

        });

    });

}

function bindChangePasswordForm() {

    const form = document.getElementById("changePasswordForm");

    if (!form) return;

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        const current = document.getElementById("currentPassword").value;
        const next = document.getElementById("newPassword").value;
        const confirm = document.getElementById("confirmNewPassword").value;

        const status = document.getElementById("changePasswordStatus");

        clearFieldError("currentPasswordError");
        clearFieldError("newPasswordError");
        clearFieldError("confirmNewPasswordError");
        status.textContent = "";

        if (!current) {
            setFieldError("currentPasswordError", "Current password is required.");
            return;
        }

        const passwordCheck = validatePassword(next);

        if (!passwordCheck.valid) {
            setFieldError("newPasswordError", passwordCheck.message);
            return;
        }

        const confirmCheck = validateConfirmPassword(next, confirm);

        if (!confirmCheck.valid) {
            setFieldError("confirmNewPasswordError", confirmCheck.message);
            return;
        }

        try {

            await changePassword(current, next);

            status.textContent = "Password updated successfully.";
            status.classList.remove("sa-form-status-error");
            status.classList.add("sa-form-status-success");

            form.reset();

            showToast({
                type: "success",
                title: "Password Updated",
                message: "Your password has been changed successfully."
            });

        } catch (error) {

            status.textContent = error.message || "Unable to update password.";
            status.classList.remove("sa-form-status-success");
            status.classList.add("sa-form-status-error");

        }

    });

}

function bindLogoutAllSessions() {

    const btn = document.getElementById("logoutAllSessions");

    if (!btn) return;

    btn.addEventListener("click", async () => {

        const confirmed = confirm("Logout from all devices except this one?");

        if (!confirmed) return;

        await revokeAllSessions();

        const sessions = await getActiveSessions();

        renderActiveSessions(sessions);

    });

}

/* ==========================================================
   Appearance — Theme Switch
========================================================== */

function bindThemeSwitch() {

    const wrap = document.getElementById("themeSwitch");

    if (!wrap) return;

    const options = wrap.querySelectorAll(".sa-theme-option");

    const syncActive = () => {

        const active = getTheme();

        options.forEach((opt) => {
            const isActive = opt.dataset.themeOption === active;
            opt.classList.toggle("active", isActive);
            opt.setAttribute("aria-checked", String(isActive));
        });

    };

    options.forEach((opt) => {

        opt.addEventListener("click", () => {

            setTheme(opt.dataset.themeOption);

            syncActive();

        });

    });

    syncActive();

}

/* ==========================================================
   Icons (small, self-contained — avoids widening the shared
   icon library just for one-off menu glyphs)
========================================================== */

function cameraIcon() {

    return /* html */ `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 8h3l2-2h6l2 2h3v11H4z"/>
            <circle cx="12" cy="13.5" r="3.5"/>
        </svg>
    `;

}

function uploadIcon() {

    return /* html */ `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 16V4M7 9l5-5 5 5"/>
            <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>
        </svg>
    `;

}

function eyeIcon() {

    return /* html */ `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>
    `;

}

function trashIcon() {

    return /* html */ `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>
        </svg>
    `;

}

function closeIcon() {

    return /* html */ `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
    `;

}

/* ==========================================================
   Helpers
========================================================== */

function formatDateTime(isoString) {

    if (!isoString) return "—";

    return new Date(isoString).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

}

function formatDate(isoString) {

    if (!isoString) return "—";

    return new Date(isoString).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

}

function setFieldError(id, message) {

    const el = document.getElementById(id);

    if (el) el.textContent = message;

}

function clearFieldError(id) {

    setFieldError(id, "");

}

function escapeAttr(value) {

    return String(value).replace(/"/g, "&quot;");

}
