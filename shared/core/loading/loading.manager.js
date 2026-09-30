/**
 * ==========================================================
 * CampusOne
 * Loading Manager
 * ----------------------------------------------------------
 * Headless engine that owns the state of every loader in the
 * app. It never touches the DOM — it just tracks *who* is
 * loading *what*, and broadcasts LOADING_CHANGE_EVENT so any
 * UI (spinner, overlay, skeleton, disabled button) can react.
 *
 * Why refcounted, not a plain on/off flag:
 * ----------------------------------------------------------
 * Two independent callers can legitimately ask for the same
 * loader at once — e.g. the Dashboard page calls
 * show(DASHBOARD) while it fetches stats, and a widget on the
 * same page also calls show(DASHBOARD) while it fetches its
 * own data. If hide() just set a flag to false, the first
 * caller to finish would kill the spinner while the second
 * caller is still working — "multiple loaders conflict on one
 * page", exactly what Phase 3 is meant to prevent.
 *
 * Instead, each type keeps a count. show() increments it,
 * hide() decrements it, and the loader is only actually
 * inactive once the count returns to 0. Every call is still
 * safe to make independently — nobody needs to know how many
 * other callers also asked for the same loader.
 * ==========================================================
 */

import { LoadingType, LOADING_CHANGE_EVENT } from "./loading.types.js";

class LoadingManager {

    constructor() {

        // type -> { count, meta }
        // count = how many active show() calls haven't been
        // matched by a hide() yet. meta = free-form info a
        // caller attached via register()/show() (label, target
        // element id, etc.) — the manager never reads it, it
        // just carries it through to listeners.
        this._registry = new Map();

        // Activation-order queue of currently-active types.
        // A type appears here at most once, for as long as its
        // count stays above 0. Doubles as the "is ANYTHING
        // loading right now" source of truth for isLoading()
        // with no argument.
        this._queue = [];

    }

    /* ==========================================================
       register()
       ----------------------------------------------------------
       Declares a loader type before it's shown, optionally with
       metadata (label, target element, priority, etc.). Not
       required — show() auto-registers — but useful when a page
       wants to attach info up front (mirrors registerPanel() in
       the Topbar's panel engine).

       Duplicate Protection: registering the same type twice never
       throws and never resets an in-flight count. The second call
       just merges its meta into the existing entry.
    ========================================================== */
    register(type = LoadingType.APP, meta = {}) {

        const existing = this._registry.get(type);

        if (existing) {

            existing.meta = { ...existing.meta, ...meta };

            console.log(`[Loading] register() → "${type}" already registered, merged meta`);

            return existing;

        }

        const entry = { count: 0, meta };

        this._registry.set(type, entry);

        console.log(`[Loading] register() → "${type}"`);

        return entry;

    }

    /* ==========================================================
       show()
       ----------------------------------------------------------
       Marks one more caller as waiting on `type`. Auto-registers
       the type if nobody called register() for it yet.

       Duplicate Protection: if `type` is already active (count > 0),
       this is a duplicate request from another caller — the count
       still goes up (so the matching hide() is required later),
       but no redundant LOADING_CHANGE_EVENT fires since the type
       was already showing.
    ========================================================== */
    show(type = LoadingType.APP, meta) {

        const entry = this._registry.get(type) || this.register(type, meta || {});

        if (meta) {
            entry.meta = { ...entry.meta, ...meta };
        }

        entry.count += 1;

        console.log(`[Loading] SHOW → ${type} (refs: ${entry.count})`);

        if (entry.count === 1) {

            // Real 0 -> 1 transition: this type wasn't active a
            // moment ago, so it now joins the queue and listeners
            // need to know.
            this._queue.push(type);

            this._emit(type, true, "show");

        }

        return entry.count;

    }

    /* ==========================================================
       hide()
       ----------------------------------------------------------
       Un-marks one caller's wait on `type`. Only actually
       deactivates the loader once every matching show() has been
       balanced by a hide().

       Duplicate Protection: calling hide() on a type that isn't
       registered, or that's already at 0, is a harmless no-op —
       logged, not thrown — so an out-of-order or extra hide()
       call can never push the count negative or fire a spurious
       event.
    ========================================================== */
    hide(type = LoadingType.APP) {

        const entry = this._registry.get(type);

        if (!entry || entry.count === 0) {

            console.log(`[Loading] hide() → "${type}" was not active, ignored`);

            return 0;

        }

        entry.count -= 1;

        console.log(`[Loading] HIDE → ${type} (refs: ${entry.count})`);

        if (entry.count === 0) {

            this._dequeue(type);

            this._emit(type, false, "hide");

        }

        return entry.count;

    }

    /* ==========================================================
       replace()
       ----------------------------------------------------------
       Swaps one active loader for another in a single call — e.g.
       Splash finishes and Login's own loader should take over
       immediately, with no gap where nothing is shown and no
       lingering Splash entry left counting against future
       isLoading(SPLASH) checks.

       Unlike hide(), replace() force-clears `oldType` regardless
       of how many outstanding show() calls it has — the old
       screen is gone, so nothing is still waiting on it.
    ========================================================== */
    replace(oldType, newType, meta) {

        console.log(`[Loading] REPLACE → ${oldType} → ${newType}`);

        const oldEntry = this._registry.get(oldType);

        if (oldEntry && oldEntry.count > 0) {

            oldEntry.count = 0;

            this._dequeue(oldType);

            this._emit(oldType, false, "replace");

        }

        const newEntry = this._registry.get(newType) || this.register(newType, meta || {});

        if (meta) {
            newEntry.meta = { ...newEntry.meta, ...meta };
        }

        newEntry.count += 1;

        if (newEntry.count === 1) {

            this._queue.push(newType);

            this._emit(newType, true, "replace");

        }

        return newEntry.count;

    }

    /* ==========================================================
       destroy()
       ----------------------------------------------------------
       Completely forgets a loader type — registry entry, count,
       and queue position — regardless of outstanding show()
       calls. Meant for page/route teardown (same spirit as
       destroyTopbar()) so a page that forgets to balance its
       show()/hide() calls can't leave a stale loader active after
       it navigates away.
    ========================================================== */
    destroy(type) {

        const entry = this._registry.get(type);

        if (!entry) return;

        const wasActive = entry.count > 0;

        this._registry.delete(type);

        this._dequeue(type);

        console.log(`[Loading] destroy() → "${type}"`);

        if (wasActive) {
            this._emit(type, false, "destroy");
        }

    }

    /* ==========================================================
       isLoading()
       ----------------------------------------------------------
       With a type: is that specific loader currently active.
       Without one: is ANYTHING currently active — a single check
       for a global "block navigation" / app-wide spinner.
    ========================================================== */
    isLoading(type) {

        if (type === undefined) {
            return this._queue.length > 0;
        }

        return (this._registry.get(type)?.count || 0) > 0;

    }

    /** Snapshot of every currently-active type, oldest first. */
    getActive() {
        return [...this._queue];
    }

    /* ==========================================================
       clear()
       ----------------------------------------------------------
       Hard reset — e.g. logout, or between test cases. Emits a
       "clear" transition for every type that was active so
       listeners drop their spinners, then wipes all state.
    ========================================================== */
    clear() {

        const activeTypes = [...this._queue];

        this._registry.clear();
        this._queue = [];

        activeTypes.forEach((type) => {
            this._emit(type, false, "clear");
        });

        console.log("[Loading] clear() → all loaders reset");

    }

    /* ==========================================================
       Internal helpers
    ========================================================== */

    _dequeue(type) {

        const index = this._queue.indexOf(type);

        if (index !== -1) {
            this._queue.splice(index, 1);
        }

    }

    _emit(type, isLoading, reason) {

        window.dispatchEvent(new CustomEvent(LOADING_CHANGE_EVENT, {

            detail: {
                type,
                isLoading,
                activeTypes: [...this._queue],
                reason
            }

        }));

    }

}

export const loadingManager = new LoadingManager();
