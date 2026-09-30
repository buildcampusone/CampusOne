/**
 * ==========================================================
 * CampusOne
 * Institution Owner Topbar
 * ----------------------------------------------------------
 * Part 1.3 — Owner Topbar V1 (scaffold)
 * Same region shape and dropdown-panel pattern as Institution
 * Admin's topbar.page.js (io- instead of ia- namespace), but
 * deliberately thinner: Owner's Dashboard is still in Shell
 * phase, so there is no Search, no notification data, and no
 * profile identity source yet — see file header of this
 * module's topbar.controller.js for the full scope note.
 *
 * Avatar reuse (audit Section 3 follow-up): unlike Super Admin
 * and Institution Admin's Topbars, which each hand-roll their
 * own avatar markup, this one uses the shared, role-agnostic
 * shared/components/avatar/avatar.js Avatar() component from
 * the start — no fallback-initials logic duplicated here.
 * ==========================================================
 */

import {

    MenuIcon,
    NotificationIcon

} from "../../../shared/components/icons/index.js";

import { Avatar } from "../../../shared/components/avatar/avatar.js";

export function TopbarPage() {

    return /* html */ `

        <header class="io-topbar-layout">

            <!-- ==========================================
                 Left Section
            =========================================== -->

            <div class="io-topbar-left">

                <button
                    id="sidebarToggle"
                    class="io-icon-button"
                    aria-label="Toggle Sidebar"
                    aria-controls="ioSidebar"
                    aria-expanded="true"
                >

                    ${MenuIcon()}

                </button>

                <div class="io-page-title">

                    <h1 id="topbarPageTitle">

                        Dashboard

                    </h1>

                    <span id="topbarPageSubtitle">

                        Welcome to CampusOne Institution Owner

                    </span>

                </div>

            </div>

            <!-- ==========================================
                 Right Section
            =========================================== -->

            <div class="io-topbar-right">

                <!-- ==========================================
                     Notifications (UI only — no data source yet)
                =========================================== -->

                <div class="io-notification-wrap" data-panel="notification">

                    <button
                        id="notificationButton"
                        class="io-icon-button"
                        aria-label="Notifications"
                        aria-haspopup="true"
                        aria-expanded="false"
                        aria-controls="notificationPanel"
                    >

                        ${NotificationIcon()}

                    </button>

                    <div
                        id="notificationPanel"
                        class="io-dropdown-panel io-notification-panel"
                        role="menu"
                        aria-label="Notifications"
                        hidden
                    >

                        <div class="io-dropdown-header">

                            <h3>

                                Notifications

                            </h3>

                        </div>

                        <div class="io-dropdown-empty">

                            <p>Nothing here yet</p>

                        </div>

                    </div>

                </div>

                <!-- ==========================================
                     Profile (UI only — no identity source yet)
                =========================================== -->

                <div class="io-profile-wrap" data-panel="profile">

                    <button
                        id="profileButton"
                        class="io-profile-button"
                        aria-haspopup="true"
                        aria-expanded="false"
                        aria-controls="profilePanel"
                    >

                        ${Avatar({ name: "Institution Owner", size: "sm", id: "topbarAvatar" })}

                        <div class="io-profile-info">

                            <strong id="topbarUserName">

                                Institution Owner

                            </strong>

                            <small id="topbarUserRole">

                                CampusOne

                            </small>

                        </div>

                    </button>

                    <div
                        id="profilePanel"
                        class="io-dropdown-panel io-profile-panel"
                        role="menu"
                        aria-label="Profile menu"
                        hidden
                    >

                        <div class="io-profile-panel-header">

                            ${Avatar({ name: "Institution Owner", size: "md", id: "topbarPanelAvatar" })}

                            <div class="io-profile-info">

                                <strong id="topbarPanelUserName">

                                    Institution Owner

                                </strong>

                                <small id="topbarPanelUserRole">

                                    Institution Owner

                                </small>

                            </div>

                        </div>

                        <div class="io-dropdown-divider"></div>

                        <!-- Placeholder only — no Owner router or
                             profile module exists yet, so this
                             intentionally goes nowhere (see
                             topbar.controller.js). Mirrors the same
                             stub discipline the Owner Sidebar's own
                             onRouteSelect/onLogout already use. -->

                        <button
                            id="myProfileBtn"
                            type="button"
                            class="io-profile-menu-item"
                            role="menuitem"
                        >

                            My Profile

                        </button>

                        <div class="io-dropdown-divider"></div>

                        <button
                            id="logoutBtn"
                            type="button"
                            class="io-profile-logout-item"
                        >

                            Logout

                        </button>

                    </div>

                </div>

            </div>

        </header>

    `;

}
