/**
 * ==========================================================
 * CampusOne Storage Service
 * shared/services/storage.service.js
 * -----------------------------------------------------------
 * Single entry point for Firebase Storage in CampusOne.
 *
 * RULE: No controller/page imports directly from
 * "firebase-storage.js". File uploads — branding images,
 * profile photos, generated documents — go through here, the
 * same way shared/services/auth.service.js is the single entry
 * point for Firebase Auth.
 * ==========================================================
 */

import { storage } from "../../firebase/firebase.js";

import {
    ref,
    uploadBytes,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

/* =========================================
   Timeout Helper
   -----------------------------------------------------------
   uploadBytes()/getDownloadURL() are ordinary network calls
   with no built-in client-side timeout — on a slow/flaky
   connection the underlying XHR/fetch can stall indefinitely:
   no success, no error, forever. Racing every call against a
   timer converts "hangs forever" into "rejects after N
   seconds", which a normal try/catch CAN handle.
========================================= */

function withTimeout(promise, timeoutMs, label) {

    let timeoutId;

    const timeout = new Promise((_, reject) => {

        timeoutId = setTimeout(() => {

            reject(
                new Error(
                    `Timed out while ${label} (no response after ${Math.round(timeoutMs / 1000)}s). ` +
                    "This usually means a slow or unstable internet connection."
                )
            );

        }, timeoutMs);

    });

    return Promise.race([promise, timeout])
        .finally(() => clearTimeout(timeoutId));

}

/**
 * Upload File (with timeout)
 * Uploads `file` to `storagePath` and resolves with its
 * download URL. Bounded by `timeoutMs` so a stalled upload
 * rejects instead of hanging the caller indefinitely.
 *
 * Throws on failure — callers that treat an upload as optional
 * (e.g. branding images during registration) should wrap this
 * call in their own try/catch and decide the fallback.
 */
export async function uploadFileWithTimeout(
    storagePath,
    file,
    timeoutMs = 25000
) {

    if (!storagePath) {
        throw new Error("Storage path is required.");
    }

    if (!file) {
        throw new Error("File is required.");
    }

    const fileRef = ref(storage, storagePath);

    await withTimeout(
        uploadBytes(fileRef, file),
        timeoutMs,
        `uploading the file to ${storagePath}`
    );

    return await withTimeout(
        getDownloadURL(fileRef),
        timeoutMs,
        `fetching the download URL for ${storagePath}`
    );

}

/**
 * Upload File With Progress
 * ----------------------------------------------------------
 * Resumable-upload sibling of uploadFileWithTimeout() above —
 * same "throws on failure, caller decides the fallback" contract
 * and the same timeout ceiling, but backed by
 * uploadBytesResumable() instead of uploadBytes() so it can
 * report 0-100 byte progress via onProgress() while the transfer
 * runs. uploadBytes() has no progress events at all, which is
 * the one gap this fills — everything else (path/file
 * validation, timeout behavior) is identical to its sibling.
 * Used by Institution Logo management (Phase 4.3), where the
 * Branding card renders a real upload progress bar.
 *
 * @param {string} storagePath
 * @param {File|Blob} file
 * @param {object} [options]
 * @param {(percent: number) => void} [options.onProgress]
 * @param {number} [options.timeoutMs]
 * @returns {Promise<string>} the uploaded file's download URL.
 */
export async function uploadFileWithProgress(
    storagePath,
    file,
    { onProgress, timeoutMs = 25000 } = {}
) {

    if (!storagePath) {
        throw new Error("Storage path is required.");
    }

    if (!file) {
        throw new Error("File is required.");
    }

    const fileRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(fileRef, file);

    await new Promise((resolve, reject) => {

        const timeoutId = setTimeout(() => {

            uploadTask.cancel();

            reject(
                new Error(
                    `Timed out while uploading the file to ${storagePath} ` +
                    `(no response after ${Math.round(timeoutMs / 1000)}s). ` +
                    "This usually means a slow or unstable internet connection."
                )
            );

        }, timeoutMs);

        uploadTask.on(
            "state_changed",
            (snapshot) => {

                if (typeof onProgress === "function" && snapshot.totalBytes > 0) {
                    onProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
                }

            },
            (error) => {
                clearTimeout(timeoutId);
                reject(error);
            },
            () => {
                clearTimeout(timeoutId);
                resolve();
            }
        );

    });

    return await withTimeout(
        getDownloadURL(fileRef),
        timeoutMs,
        `fetching the download URL for ${storagePath}`
    );

}

/**
 * Delete File (with timeout)
 * ----------------------------------------------------------
 * Removes the object at `storagePath`. Idempotent by design —
 * "storage/object-not-found" resolves quietly instead of
 * throwing, since a caller removing a file that's already gone
 * (a retry, two tabs racing) should not see that as a failure.
 * Any other error (permission, network, timeout) still throws,
 * same "caller decides the fallback" contract as the two upload
 * functions above.
 */
export async function deleteFileWithTimeout(storagePath, timeoutMs = 25000) {

    if (!storagePath) {
        throw new Error("Storage path is required.");
    }

    const fileRef = ref(storage, storagePath);

    try {

        await withTimeout(
            deleteObject(fileRef),
            timeoutMs,
            `deleting the file at ${storagePath}`
        );

    } catch (error) {

        if (error?.code === "storage/object-not-found") {
            return;
        }

        throw error;

    }

}
