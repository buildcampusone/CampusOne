/**
 * ==========================================================
 * CampusOne
 * Loading Types
 * ----------------------------------------------------------
 * Centralized loading identifiers + the event contract for
 * the Loading Engine (loading.manager.js / loading.service.js).
 *
 * Any file that wants to react to loading state (a spinner
 * component, a page overlay, a skeleton table, etc.) listens
 * for LOADING_CHANGE_EVENT on window instead of importing the
 * manager directly — same pattern as "sidebar:statechange"
 * and "campusone:profile-updated".
 * ==========================================================
 */

export const LoadingType = Object.freeze({
  APP: "app",
  SPLASH: "splash",
  LOGIN: "login",

  DASHBOARD: "dashboard",
  PROFILE: "profile",

  NOTICE: "notice",
  ATTENDANCE: "attendance",

  STUDENTS: "students",
  FACULTY: "faculty",

  INSTITUTION: "institution",

  TABLE: "table",
  CARD: "card",
  LIST: "list",
  FORM: "form",

  IMAGE: "image",
  UPLOAD: "upload",

  PDF: "pdf",

  SETTINGS: "settings",

  SUPER_ADMIN: "super_admin"
});

// Fired on window whenever any loader's active/inactive state
// actually changes (not on every duplicate show()/hide() call —
// see "Duplicate Protection" in loading.manager.js).
//
// event.detail shape:
//   {
//     type,          // the LoadingType this change is about
//     isLoading,     // true if it just became active, false if it just cleared
//     activeTypes,   // array snapshot of every currently-active type, in
//                    // activation order (oldest first) — useful for a
//                    // global "is anything loading?" indicator
//     reason         // "show" | "hide" | "replace" | "destroy" | "clear"
//   }
export const LOADING_CHANGE_EVENT = "campusone:loading-change";
