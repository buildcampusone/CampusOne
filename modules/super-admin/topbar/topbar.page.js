/**
 * ==========================================================
 * CampusOne
 * Super Admin Topbar
 * ----------------------------------------------------------
 * Enterprise SaaS Top Navigation
 * ==========================================================
 */

import {

    MenuIcon,
    SearchIcon,
    NotificationIcon,
    UserIcon

} from "../../../shared/components/icons/index.js";

export function TopbarPage() {

    return /* html */ `

        <header class="sa-topbar-layout">

            <!-- ==========================================
                 Left Section
            =========================================== -->

            <div class="sa-topbar-left">

                <button
                    id="sidebarToggle"
                    class="sa-icon-button"
                    aria-label="Toggle Sidebar"
                    aria-controls="saSidebar"
                    aria-expanded="true"
                >

                    ${MenuIcon()}

                </button>

                <div class="sa-page-title">

                    <h1>

                        Dashboard

                    </h1>

                    <span>

                        Welcome to CampusOne Super Admin

                    </span>

                </div>

            </div>

            <!-- ==========================================
                 Center Section
            =========================================== -->

            <div class="sa-topbar-search">

                <span class="sa-search-icon">

                    ${SearchIcon()}

                </span>

                <input
                    id="globalSearch"
                    type="search"
                    placeholder="Search institutions, users, plans..."
                    autocomplete="off"
                >

            </div>

            <!-- ==========================================
                 Right Section
            =========================================== -->

            <div class="sa-topbar-right">

                <!-- ==========================================
                     Notifications
                =========================================== -->

                <div class="sa-notification-wrap" data-panel="notification">

                    <button
                        id="notificationButton"
                        class="sa-icon-button"
                        aria-label="Notifications"
                        aria-haspopup="true"
                        aria-expanded="false"
                        aria-controls="notificationPanel"
                    >

                        ${NotificationIcon()}

                        <span
                            id="notificationBadge"
                            class="sa-notification-badge"
                        >

                            4

                        </span>

                    </button>

                    <div
                        id="notificationPanel"
                        class="sa-dropdown-panel sa-notification-panel"
                        role="menu"
                        aria-label="Notifications"
                        hidden
                    >

                        <div class="sa-dropdown-header">

                            <h3>

                                Notifications

                            </h3>

                            <button
                                id="markAllReadBtn"
                                type="button"
                                class="sa-text-btn"
                            >

                                Mark all as read

                            </button>

                        </div>

                        <ul id="notificationList" class="sa-notification-list">

                            <li class="sa-notification-item is-unread">

                                <span class="sa-notification-dot"></span>

                                <div class="sa-notification-content">

                                    <p>New institution registered</p>

                                    <small>2 minutes ago</small>

                                </div>

                            </li>

                            <li class="sa-notification-item is-unread">

                                <span class="sa-notification-dot"></span>

                                <div class="sa-notification-content">

                                    <p>Subscription renewed</p>

                                    <small>1 hour ago</small>

                                </div>

                            </li>

                            <li class="sa-notification-item is-unread">

                                <span class="sa-notification-dot"></span>

                                <div class="sa-notification-content">

                                    <p>New support ticket</p>

                                    <small>3 hours ago</small>

                                </div>

                            </li>

                            <li class="sa-notification-item is-unread">

                                <span class="sa-notification-dot"></span>

                                <div class="sa-notification-content">

                                    <p>Audit completed</p>

                                    <small>Yesterday</small>

                                </div>

                            </li>

                        </ul>

                        <div id="notificationEmpty" class="sa-dropdown-empty" hidden>

                            <p>You're all caught up 🎉</p>

                        </div>

                        <div class="sa-dropdown-footer">

                            <button
                                id="viewAllNotificationsBtn"
                                type="button"
                                class="sa-text-btn"
                            >

                                View all

                            </button>

                        </div>

                    </div>

                </div>

                <!-- ==========================================
                     Profile
                =========================================== -->

                <div class="sa-profile-wrap" data-panel="profile">

                    <button
                        id="profileButton"
                        class="sa-profile-button"
                        aria-haspopup="true"
                        aria-expanded="false"
                        aria-controls="profilePanel"
                    >

                        <span class="sa-profile-avatar" id="topbarAvatar">

                            ${UserIcon()}

                        </span>

                        <div class="sa-profile-info">

                            <strong id="topbarUserName">

                                Super Admin

                            </strong>

                            <small id="topbarUserRole">

                                CampusOne

                            </small>

                        </div>

                    </button>

                    <div
                        id="profilePanel"
                        class="sa-dropdown-panel sa-profile-panel"
                        role="menu"
                        aria-label="Profile menu"
                        hidden
                    >

                        <div class="sa-profile-panel-header">

                            <span class="sa-profile-avatar" id="topbarPanelAvatar">

                                ${UserIcon()}

                            </span>

                            <div class="sa-profile-info">

                                <strong id="topbarPanelUserName">

                                    Super Admin

                                </strong>

                                <small id="topbarPanelUserRole">

                                    Super Admin

                                </small>

                            </div>

                        </div>

                        <div class="sa-dropdown-divider"></div>

                        <ul class="sa-profile-menu-list">

                            <li>

                                <button type="button" data-action="my-profile">

                                    My Profile

                                </button>

                            </li>

                            <li>

                                <button type="button" data-action="account-settings">

                                    Account Settings

                                </button>

                            </li>

                            <li>

                                <button type="button" data-action="security">

                                    Security

                                </button>

                            </li>

                            <li>

                                <button type="button" data-action="appearance">

                                    Appearance

                                </button>

                            </li>

                            <li>

                                <button type="button" data-action="help">

                                    Help

                                </button>

                            </li>

                        </ul>

                        <div class="sa-dropdown-divider"></div>

                        <button
                            id="logoutBtn"
                            type="button"
                            class="sa-profile-logout-item"
                        >

                            Logout

                        </button>

                    </div>

                </div>

            </div>

        </header>

    `;

}