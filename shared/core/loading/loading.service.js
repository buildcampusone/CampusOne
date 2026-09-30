/**
 * ==========================================================
 * CampusOne
 * Loading Service
 * ----------------------------------------------------------
 * Public seam for the Loading Engine. Pages/components import
 * `Loading` from here — never loading.manager.js directly —
 * same rule as every other *.service.js in this codebase
 * (profile.service.js, session.service.js, etc.): the manager
 * is an implementation detail that's free to change shape as
 * long as this surface stays stable.
 *
 * Usage:
 *   import { Loading } from "shared/core/loading/loading.service.js";
 *   import { LoadingType } from "shared/core/loading/loading.types.js";
 *
 *   Loading.show(LoadingType.DASHBOARD);
 *   await fetchStats();
 *   Loading.hide(LoadingType.DASHBOARD);
 *
 * A UI component that wants to render a spinner subscribes
 * instead of polling:
 *   Loading.onChange(({ type, isLoading }) => { ... });
 * ==========================================================
 */

import { loadingManager } from "./loading.manager.js";
import { LOADING_CHANGE_EVENT } from "./loading.types.js";

export const Loading = {

    register(type, meta) {
        return loadingManager.register(type, meta);
    },

    show(type, meta) {
        return loadingManager.show(type, meta);
    },

    hide(type) {
        return loadingManager.hide(type);
    },

    replace(oldType, newType, meta) {
        return loadingManager.replace(oldType, newType, meta);
    },

    destroy(type) {
        return loadingManager.destroy(type);
    },

    isLoading(type) {
        return loadingManager.isLoading(type);
    },

    getActive() {
        return loadingManager.getActive();
    },

    clear() {
        return loadingManager.clear();
    },

    /**
     * Subscribe to every loading state change. Returns an
     * unsubscribe function — call it on component destroy so
     * the listener doesn't leak, same pattern as
     * base-component.js's listen()/emit().
     */
    onChange(handler) {

        const listener = (event) => handler(event.detail);

        window.addEventListener(LOADING_CHANGE_EVENT, listener);

        return () => window.removeEventListener(LOADING_CHANGE_EVENT, listener);

    }

};
