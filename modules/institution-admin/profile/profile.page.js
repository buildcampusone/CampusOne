/**
 * ==========================================================
 * CampusOne
 * Institution Admin Profile Page
 * ----------------------------------------------------------
 * Phase 8.2
 *
 * This is NOT a Settings page — scoped to identity only:
 *   Profile Header -> Personal Information ->
 *   Professional Information -> Account & Security ->
 *   My Permissions -> My Activity -> Quick Statistics ->
 *   Help & Support -> Danger Zone (Logout)
 *
 * Built entirely from shared/components/profile/* +
 * shared/components/avatar + shared/components/badge, which
 * take plain data and render identical markup for any role —
 * Super Admin, Institution Owner, Institution Admin, Faculty,
 * Student, Parent will all mount the same components with
 * their own controller's data later, per the Phase 8
 * architecture requirement ("only the data should change").
 *
 * Logout reuses the exact same confirm() + session-clearing
 * pattern already used by the Sidebar and Topbar (see
 * session.service.js) so there's one logout behavior across
 * the whole app, not a second one invented here.
 *
 * Same render(workspace) -> destroy contract as every other
 * Institution Admin module (see dashboard.page.js).
 * ==========================================================
 */

import {
    getProfileHeaderData,
    getPersonalInfo,
    getProfessionalInfo,
    getQuickStatistics,
    getAccountSecurity,
    getPermissions,
    getRecentActivity,
    getSupportItems,
    destroyProfile
} from "./profile.controller.js";

import { Animation } from "../../../shared/core/animation/animation.service.js";
import { Counter } from "../../../shared/core/counter/index.js";
import { Button } from "../../../shared/components/button/button.js";

import { ProfileHeader } from "../../../shared/components/profile/profile-header.js";
import { InfoCard } from "../../../shared/components/profile/info-card.js";
import { AnalyticsCard } from "../../../shared/components/profile/analytics-card.js";
import { NavigationRow } from "../../../shared/components/profile/navigation-row.js";
import { PermissionRow } from "../../../shared/components/profile/permission-row.js";
import { ActivityItem } from "../../../shared/components/profile/activity-item.js";

import { showToast } from "../../../shared/components/toast/toast.js";

import { navigate } from "../../../router/router.js";
import { clearInstitutionAdminSession } from "../../../shared/services/session.service.js";

import {
    UserIcon,
    BriefcaseIcon,
    EditIcon,
    UsersIcon,
    BellIcon,
    ClockIcon,
    InstitutionIcon,
    LockIcon,
    ShieldCheckIcon,
    CheckIcon,
    SupportIcon,
    LogoutIcon
} from "../../../shared/components/icons/index.js";

/* ==========================================================
   Icon Registry
   ----------------------------------------------------------
   Same convention as dashboard.page.js's ICONS map — the
   controller hands back plain string keys, this page decides
   which shared icon component each key renders as.
========================================================== */

const STAT_ICONS = {

    students: UsersIcon,
    faculty: BriefcaseIcon,
    notices: BellIcon,
    lastLogin: ClockIcon

};

function renderStatIcon(key) {

    const Icon = STAT_ICONS[key];

    return Icon ? Icon() : "";

}

const NAV_ICONS = {

    lock: LockIcon,
    shield: ShieldCheckIcon,
    clock: ClockIcon,
    support: SupportIcon,
    check: CheckIcon

};

function renderNavIcon(key) {

    const Icon = NAV_ICONS[key];

    return Icon ? Icon() : "";

}

/* ==========================================================
   Section — Personal Information
========================================================== */

function PersonalInformationSection() {

    return InfoCard({

        id: "profilePersonalInfo",
        title: "Personal Information",
        icon: UserIcon(),
        items: getPersonalInfo(),
        action: Button({
            id: "editProfileBtn",
            text: "Edit Profile",
            variant: "secondary",
            icon: EditIcon()
        })

    });

}

/* ==========================================================
   Section — Professional Information
========================================================== */

function ProfessionalInformationSection() {

    return InfoCard({

        id: "profileProfessionalInfo",
        title: "Professional Information",
        icon: InstitutionIcon(),
        items: getProfessionalInfo()

    });

}

/* ==========================================================
   Section — Quick Statistics
========================================================== */

function QuickStatisticsSection() {

    const stats = getQuickStatistics();

    return /* html */ `

        <section class="co-section" aria-labelledby="profileStatsHeading">

            <h3 id="profileStatsHeading" class="co-profile-section-title">Quick Statistics</h3>

            <div class="co-analytics-grid">

                ${stats.map((stat) => AnalyticsCard({

                    id: stat.id,
                    icon: renderStatIcon(stat.icon),
                    label: stat.label,
                    value: stat.value

                })).join("")}

            </div>

        </section>

    `;

}

/* ==========================================================
   Section — Account & Security
========================================================== */

function AccountSecuritySection() {

    const items = getAccountSecurity();

    return /* html */ `

        <section class="co-card co-info-card" aria-labelledby="headingAccountSecurity">

            <div class="co-info-card-header">

                <div class="co-info-card-heading">

                    <span class="co-info-card-icon" aria-hidden="true">${LockIcon()}</span>

                    <h3 id="headingAccountSecurity" class="co-info-card-title">Account &amp; Security</h3>

                </div>

            </div>

            <div class="co-nav-list">

                ${items.map((item) => NavigationRow({

                    id: item.id,
                    icon: renderNavIcon(item.icon),
                    label: item.label,
                    sublabel: item.sublabel

                })).join("")}

            </div>

        </section>

    `;

}

/* ==========================================================
   Section — My Permissions
========================================================== */

function PermissionsSection() {

    const items = getPermissions();

    return /* html */ `

        <section class="co-card co-info-card" aria-labelledby="headingPermissions">

            <div class="co-info-card-header">

                <div class="co-info-card-heading">

                    <span class="co-info-card-icon" aria-hidden="true">${ShieldCheckIcon()}</span>

                    <h3 id="headingPermissions" class="co-info-card-title">My Permissions</h3>

                </div>

            </div>

            <div class="co-permission-list">

                ${items.map((item) => PermissionRow({

                    icon: CheckIcon(),
                    label: item.label,
                    status: item.status

                })).join("")}

            </div>

        </section>

    `;

}

/* ==========================================================
   Section — My Activity
========================================================== */

function ActivitySection() {

    const items = getRecentActivity();

    return /* html */ `

        <section class="co-card co-info-card" aria-labelledby="headingActivity">

            <div class="co-info-card-header">

                <div class="co-info-card-heading">

                    <span class="co-info-card-icon" aria-hidden="true">${ClockIcon()}</span>

                    <h3 id="headingActivity" class="co-info-card-title">My Activity</h3>

                </div>

            </div>

            ${
                items.length
                    ? `
                        <div class="co-activity-list">

                            ${items.map((item) => ActivityItem({

                                icon: ClockIcon(),
                                text: item.text,
                                timestamp: item.timestamp

                            })).join("")}

                        </div>
                    `
                    : `<p class="co-empty-hint">No recent activity yet.</p>`
            }

        </section>

    `;

}

/* ==========================================================
   Section — Help & Support
========================================================== */

function SupportSection() {

    const items = getSupportItems();

    return /* html */ `

        <section class="co-card co-info-card" aria-labelledby="headingSupport">

            <div class="co-info-card-header">

                <div class="co-info-card-heading">

                    <span class="co-info-card-icon" aria-hidden="true">${SupportIcon()}</span>

                    <h3 id="headingSupport" class="co-info-card-title">Help &amp; Support</h3>

                </div>

            </div>

            <div class="co-nav-list">

                ${items.map((item) => NavigationRow({

                    id: item.id,
                    icon: renderNavIcon(item.icon),
                    label: item.label,
                    sublabel: item.sublabel

                })).join("")}

            </div>

        </section>

    `;

}

/* ==========================================================
   Section — Danger Zone (Logout)
========================================================== */

function DangerZoneSection() {

    return /* html */ `

        <section class="co-card co-info-card co-danger-card" aria-labelledby="headingDanger">

            <div class="co-info-card-header">

                <div class="co-info-card-heading">

                    <span class="co-info-card-icon" aria-hidden="true">${LogoutIcon()}</span>

                    <h3 id="headingDanger" class="co-info-card-title">Danger Zone</h3>

                </div>

            </div>

            <div class="co-danger-row">

                <div class="co-danger-copy">

                    <span class="co-danger-title">Log out of CampusOne</span>

                    <span class="co-danger-desc">You'll need to sign in again to access your dashboard.</span>

                </div>

                ${Button({ id: "profileLogoutBtn", text: "Logout", variant: "danger", icon: LogoutIcon() })}

            </div>

        </section>

    `;

}

/* ==========================================================
   Page Shell
========================================================== */

function ProfilePage() {

    const header = getProfileHeaderData();

    return /* html */ `

        <div class="ia-profile-page">

            ${ProfileHeader(header)}

            <div class="co-section">
                ${PersonalInformationSection()}
            </div>

            <div class="co-section">
                ${ProfessionalInformationSection()}
            </div>

            <div class="co-section">
                ${AccountSecuritySection()}
            </div>

            <div class="co-section">
                ${PermissionsSection()}
            </div>

            <div class="co-section">
                ${ActivitySection()}
            </div>

            ${QuickStatisticsSection()}

            <div class="co-section">
                ${SupportSection()}
            </div>

            <div class="co-section">
                ${DangerZoneSection()}
            </div>

        </div>

    `;

}

/* ==========================================================
   Interactions
   ----------------------------------------------------------
   Edit Profile has no form yet (Phase 8.2) — per Chapter 7
   ("no dead clicks"), the button still gives feedback instead
   of doing nothing.
========================================================== */

const COMING_SOON_IDS = [
    "navChangePassword",
    "navActiveSessions",
    "navLoginHistory",
    "navHelpCenter",
    "navContactSupport"
];

function bindInteractions(workspace) {

    const editBtn = workspace.querySelector("#editProfileBtn");

    const onEditClick = () => {

        showToast({
            type: "info",
            title: "Edit Profile",
            message: "Editable fields are coming in the next Profile update."
        });

    };

    editBtn?.addEventListener("click", onEditClick);

    // No dead clicks: every not-yet-wired nav row still gives
    // feedback instead of doing nothing, same as Edit Profile.
    const comingSoonHandlers = COMING_SOON_IDS.map((id) => {

        const el = workspace.querySelector(`#${id}`);

        if (!el) return null;

        const label = el.querySelector(".co-nav-row-label")?.textContent?.trim() || "This section";

        const onClick = () => {

            showToast({
                type: "info",
                title: label,
                message: "This is coming in a future Profile update."
            });

        };

        el.addEventListener("click", onClick);

        return { el, onClick };

    }).filter(Boolean);

    const logoutBtn = workspace.querySelector("#profileLogoutBtn");

    const onLogoutClick = async () => {

        const confirmed = confirm("Are you sure you want to logout?");

        if (!confirmed) return;

        await clearInstitutionAdminSession();
        navigate("login");

    };

    logoutBtn?.addEventListener("click", onLogoutClick);

    return () => {

        editBtn?.removeEventListener("click", onEditClick);
        comingSoonHandlers.forEach(({ el, onClick }) => el.removeEventListener("click", onClick));
        logoutBtn?.removeEventListener("click", onLogoutClick);

    };

}

/* ==========================================================
   Stat Counters
   ----------------------------------------------------------
   Only elements the controller handed a real number (never
   the "—" placeholder) carry a data-numeric attribute — see
   analytics-card.js. Nothing animates today since every stat
   is still "not connected", but the wiring is honest and
   ready the moment real numbers land. Uses the public Counter
   seam (counter.service.js), never the engine directly.
========================================== */

function wireStatCounters(workspace) {

    const elements = Array.from(workspace.querySelectorAll(".co-analytics-value[data-numeric]"));

    elements.forEach((el) => {

        const to = Number(el.dataset.numeric);

        if (!Number.isNaN(to)) Counter.observe(el, to);

    });

    return () => {

        elements.forEach((el) => Counter.disconnect(el));

    };

}

/* ==========================================================
   Router Renderer
========================================================== */

export function render(workspace) {

    if (!workspace) {

        console.error(
            "[CampusOne] Institution Admin profile workspace not found."
        );

        return destroyProfile;

    }

    workspace.innerHTML = ProfilePage();

    const contentEl = workspace.querySelector(".ia-profile-page");

    if (contentEl) {
        Animation.fadeIn(contentEl);
    }

    const unbindInteractions = bindInteractions(workspace);
    const unbindCounters = wireStatCounters(workspace);

    return () => {

        unbindInteractions();
        unbindCounters();
        destroyProfile();

    };

}
