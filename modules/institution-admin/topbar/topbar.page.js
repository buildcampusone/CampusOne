/**
 * ==========================================================
 * CampusOne
 * Institution Admin Topbar
 * ----------------------------------------------------------
 * Part 4.2 — Topbar Reuse
 * Mirrors modules/super-admin/topbar/topbar.page.js's markup
 * contract 1:1 — same regions (sidebar toggle / page title /
 * search / notifications / profile), same element structure,
 * same class names (ia- instead of sa-), same dropdown-panel
 * pattern and aria wiring.
 *
 * Placeholder-only per Part 4.2: no seeded notification data,
 * no fetched profile identity, no wired menu navigation. Every
 * control renders and opens/closes exactly like its Super
 * Admin counterpart — there is just nothing "real" behind it
 * yet, same as #iaContent's Dashboard stub.
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

        <header class="ia-topbar-layout">

            <!-- ==========================================
                 Left Section
            =========================================== -->

            <div class="ia-topbar-left">

                <button
                    id="sidebarToggle"
                    class="ia-icon-button"
                    aria-label="Toggle Sidebar"
                    aria-controls="iaSidebar"
                    aria-expanded="true"
                >

                    ${MenuIcon()}

                </button>

                <div class="ia-page-title">

                    <h1 id="topbarPageTitle">

                        Dashboard

                    </h1>

                    <span id="topbarPageSubtitle">

                        Welcome to CampusOne Institution Admin

                    </span>

                </div>

            </div>

            <!-- ==========================================
                 Center Section
            =========================================== -->

            <div class="ia-topbar-search">

                <span class="ia-search-icon">

                    ${SearchIcon()}

                </span>

                <input
                    id="globalSearch"
                    type="search"
                    placeholder="Search..."
                    autocomplete="off"
                >

            </div>

            <!-- ==========================================
                 Right Section
            =========================================== -->

            <div class="ia-topbar-right">

                <!-- ==========================================
                     Notifications (placeholder)
                =========================================== -->

                <div class="ia-notification-wrap" data-panel="notification">

                    <button
                        id="notificationButton"
                        class="ia-icon-button"
                        aria-label="Notifications"
                        aria-haspopup="true"
                        aria-expanded="false"
                        aria-controls="notificationPanel"
                    >

                        ${NotificationIcon()}

                        <span
                            id="notificationBadge"
                            class="ia-notification-badge"
                            hidden
                        >

                            0

                        </span>

                    </button>

                    <div
                        id="notificationPanel"
                        class="ia-dropdown-panel ia-notification-panel"
                        role="menu"
                        aria-label="Notifications"
                        hidden
                    >

                        <div class="ia-dropdown-header">

                            <h3>

                                Notifications

                            </h3>

                        </div>

                        <ul id="notificationList" class="ia-notification-list" hidden></ul>

                        <div id="notificationEmpty" class="ia-dropdown-empty">

                            <p>Nothing here yet</p>

                        </div>

                    </div>

                </div>

                <!-- ==========================================
                     Profile (placeholder)
                =========================================== -->

                <div class="ia-profile-wrap" data-panel="profile">

                    <button
                        id="profileButton"
                        class="ia-profile-button"
                        aria-haspopup="true"
                        aria-expanded="false"
                        aria-controls="profilePanel"
                    >

                        <span class="ia-profile-avatar" id="topbarAvatar">

                            ${UserIcon()}

                        </span>

                        <div class="ia-profile-info">

                            <strong id="topbarUserName">

                                Institution Admin

                            </strong>

                            <small id="topbarUserRole">

                                CampusOne

                            </small>

                        </div>

                    </button>

                    <div
                        id="profilePanel"
                        class="ia-dropdown-panel ia-profile-panel"
                        role="menu"
                        aria-label="Profile menu"
                        hidden
                    >

                        <div class="ia-profile-panel-header">

                            <span class="ia-profile-avatar" id="topbarPanelAvatar">

                                ${UserIcon()}

                            </span>

                            <div class="ia-profile-info">

                                <strong id="topbarPanelUserName">

                                    Institution Admin

                                </strong>

                                <small id="topbarPanelUserRole">

                                    Institution Admin

                                </small>

                            </div>

                        </div>

                        <div class="ia-dropdown-divider"></div>

                        <!-- Phase 8 — Account Menu: only "My Profile"
                             is wired (routes to the new Profile module).
                             "My Account" / "Switch Institution" / "Help
                             & Support" from the Phase 8 spec are left
                             out here on purpose, not forgotten — none
                             of those destinations exist yet, and
                             Chapter 7 ("no dead clicks") means a menu
                             item shouldn't be added before it has
                             somewhere real to go. Each becomes a
                             one-line addition here once its own
                             section/route lands in Phase 8.2. -->

                        <button
                            id="myProfileBtn"
                            type="button"
                            class="ia-profile-menu-item"
                            role="menuitem"
                        >

                            My Profile

                        </button>

                        <div class="ia-dropdown-divider"></div>

                        <button
                            id="logoutBtn"
                            type="button"
                            class="ia-profile-logout-item"
                        >

                            Logout

                        </button>

                    </div>

                </div>

            </div>

        </header>

    `;

}
