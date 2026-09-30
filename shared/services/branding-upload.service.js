/**
 * ==========================================================
 * CampusOne Branding Upload Service
 * shared/services/branding-upload.service.js
 * -----------------------------------------------------------
 * Single entry point the UI goes through for Branding image
 * uploads (Institution Logo / Cover Image / Favicon). Nothing
 * outside this file should import shared/services/storage.service.js
 * for branding images, and no caller should special-case
 * "is Storage enabled" itself — that decision, and every
 * placeholder-vs-real behavior it implies, lives here and only
 * here.
 *
 * WHY THIS FILE EXISTS
 * Firebase Storage is not enabled yet for CampusOne. Branding
 * uploads are fully built (client-side image processing, Save
 * flow, Firestore write path) but must not reach the network
 * until Storage is turned on. Rather than scattering
 * "if (storageEnabled)" checks across institution-profile.page.js,
 * every caller talks to the two functions below, and this file
 * is the only place that knows uploads are currently disabled.
 *
 * TURNING THIS ON LATER
 * When Firebase Storage is enabled, flip BRANDING_UPLOADS_ENABLED
 * to true. uploadBrandingImage()/deleteBrandingImage() already
 * delegate to the real implementation in storage.service.js
 * (uploadFileWithProgress / deleteFileWithTimeout) — no other
 * module, and no Branding UI, needs to change.
 * ==========================================================
 */

/**
 * Single source of truth for whether Branding image uploads are
 * live. Everything else in this file — and every caller in the
 * UI — derives its behavior from this one flag.
 */
export const BRANDING_UPLOADS_ENABLED = false;

/**
 * User-facing copy for every place uploads are currently blocked
 * (info toast, disabled-button explanation, etc.) — kept in one
 * place so the wording never drifts between call sites.
 */
export const BRANDING_UPLOAD_UNAVAILABLE_MESSAGE =
    "Image uploads are temporarily unavailable because Cloud Storage " +
    "has not been enabled for CampusOne yet. This feature will be " +
    "available in a future update.";

/**
 * Uploads a Branding image and resolves with its download URL.
 * While Storage is disabled this always rejects with
 * BRANDING_UPLOAD_UNAVAILABLE_MESSAGE and never touches the
 * network — callers should not reach this function at all under
 * normal use (the UI gates its trigger points on
 * BRANDING_UPLOADS_ENABLED first), but it fails safely either way.
 *
 * storage.service.js is imported dynamically, and only once
 * uploads are enabled, so its Firebase Storage timeout machinery
 * isn't part of the active code path while Storage stays off.
 *
 * @param {string} storagePath
 * @param {File|Blob} file
 * @param {object} [options]
 * @param {(percent: number) => void} [options.onProgress]
 * @returns {Promise<string>}
 */
export async function uploadBrandingImage(storagePath, file, options = {}) {

    if (!BRANDING_UPLOADS_ENABLED) {
        throw new Error(BRANDING_UPLOAD_UNAVAILABLE_MESSAGE);
    }

    const { uploadFileWithProgress } = await import("./storage.service.js");

    return uploadFileWithProgress(storagePath, file, options);

}

/**
 * Deletes a Branding image. Same "disabled until Storage is on"
 * contract as uploadBrandingImage() above.
 *
 * @param {string} storagePath
 * @returns {Promise<void>}
 */
export async function deleteBrandingImage(storagePath) {

    if (!BRANDING_UPLOADS_ENABLED) {
        throw new Error(BRANDING_UPLOAD_UNAVAILABLE_MESSAGE);
    }

    const { deleteFileWithTimeout } = await import("./storage.service.js");

    return deleteFileWithTimeout(storagePath);

}
