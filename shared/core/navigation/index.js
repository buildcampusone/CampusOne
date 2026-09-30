/**
 * ==========================================================
 * CampusOne
 * Navigation Core — Public Entry Point
 * ----------------------------------------------------------
 * Part 1: Bottom Navigation Engine Foundation.
 *
 *   - navigation-state.manager.js -> getNavigationState()
 *   - active-route.detector.js    -> parseHashRoute(), isRouteItemActive()
 *   - bottom-nav.engine.js        -> createBottomNavEngine()
 *
 * Sidebar Engine Extraction. Generalizes Institution Admin's
 * (and originally Super Admin's) copy-pasted sidebar state
 * machine — collapse, mobile drawer, keyboard/focus trap,
 * active-item reflection, breakpoint handling — into a single
 * parametrized engine every role's Sidebar wraps, the same way
 * Bottom Nav already does above.
 *
 *   - sidebar.engine.js -> createSidebarEngine()
 *
 * Topbar Panel Engine Extraction. Generalizes Institution
 * Admin's (and originally Super Admin's) copy-pasted Topbar
 * interaction chrome — sidebar-toggle sync + dropdown-panel
 * state machine — into a single parametrized engine, mirroring
 * the Sidebar Engine Extraction above. Notification content and
 * profile menu items stay role-owned, not part of this engine.
 *
 *   - topbar-panel.engine.js -> createTopbarPanelEngine()
 *
 * Part 2.1: Active Navigation State Foundation. Generalizes
 * "active" beyond Part 1's route-only concept so it can
 * eventually cover action tabs (Alerts, Activity) too, without
 * touching Part 1's existing behaviour.
 *
 *   - tab-registry.js       -> BOTTOM_NAV_TABS, isKnownTabId(), getTabKind()
 *   - active-tab.state.js   -> getActiveTabState()
 *   - active-tab.detector.js -> detectActiveTab()
 *   - active-tab.painter.js -> paintActiveTab()
 *   - active-tab.manager.js -> createActiveTabManager() (composed, opt-in)
 *
 * Sub-Phase 1.3: Bottom Nav Feature Parity Pass. Institution
 * Owner's premium bottom nav has two behaviours no other role
 * could opt into because they lived only in Institution Owner's
 * own module: press/ripple/wave tap feedback, and scroll-based
 * auto-hide. Both are now generic, parametrized engines here,
 * matching this file's existing "engine lives in shared/core,
 * each role's controller just configures it" pattern. Institution
 * Owner's own files are untouched and still run their private
 * copies; these exports are consumed only by
 * shared/components/bottom-nav/bottom-nav.controller.js, and only
 * when a caller opts in.
 *
 *   - bottom-nav-press.engine.js    -> createBottomNavPressEffects()
 *   - bottom-nav-autohide.engine.js -> createBottomNavAutoHide()
 *
 * Any shell (Super Admin today, Institution Admin / Coaching
 * Admin tomorrow) should import from this file rather than
 * reaching into the individual modules directly.
 * ==========================================================
 */

/**
 * Sub-Phase 1.3C: Namespace-Aware Active Tab Manager. Removes the
 * single-hardcoded-list limitation Sub-Phase 1.3B's Feature Activation
 * Report flagged as blocking Super Admin and Institution Admin from
 * safely adopting Active Tab Manager. tab-registry.js now keys its tab
 * list per namespace (role) instead of one global fixed list.
 * Institution Owner's own namespace is pre-seeded with the exact same
 * 5 frozen objects BOTTOM_NAV_TABS always exported, so its behaviour is
 * unchanged. A role opts in either by calling registerNamespaceTabs()
 * directly, or by passing `tabs` to createActiveTabManager() (or the
 * `activeTabManager` option on the shared bottom-nav controller).
 */

export { getNavigationState, destroyNavigationState } from "./navigation-state.manager.js";

export {
    parseHashRoute,
    isRouteItemActive,
    readRouteItemFromDataset
} from "./active-route.detector.js";

export { createBottomNavEngine } from "./bottom-nav.engine.js";

export { createSidebarEngine } from "./sidebar.engine.js";

export { createTopbarPanelEngine } from "./topbar-panel.engine.js";

export {
    BOTTOM_NAV_TABS,
    isKnownTabId,
    getTabKind,
    registerNamespaceTabs,
    getNamespaceTabs
} from "./tab-registry.js";

export { getActiveTabState, destroyActiveTabState } from "./active-tab.state.js";

export { detectActiveTab } from "./active-tab.detector.js";

export { paintActiveTab } from "./active-tab.painter.js";

export {
    createActiveTabManager,
    destroyActiveTabManagerNamespace
} from "./active-tab.manager.js";

export { createBottomNavPressEffects } from "./bottom-nav-press.engine.js";

export { createBottomNavAutoHide } from "./bottom-nav-autohide.engine.js";
