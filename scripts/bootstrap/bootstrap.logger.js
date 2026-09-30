/**
 * ==========================================================
 * CampusOne Bootstrap — Logger
 * ----------------------------------------------------------
 * Console-only by design — nothing here writes to a file, so
 * there is no log artifact on disk that could ever end up
 * accidentally committed or shared. Every log line goes
 * through redact() first as a defense-in-depth measure: even
 * if a future change accidentally passed a password-shaped
 * field into a log call, it would print as "[REDACTED]"
 * instead of the real value.
 * ==========================================================
 */

const SENSITIVE_KEYS = new Set(["password", "newPassword", "pass", "pwd"]);

function redact(meta) {

    if (!meta || typeof meta !== "object") {
        return meta;
    }

    const clean = {};

    for (const [key, value] of Object.entries(meta)) {

        clean[key] = SENSITIVE_KEYS.has(key.toLowerCase())
            ? "[REDACTED]"
            : value;

    }

    return clean;

}

function timestamp() {

    return new Date().toISOString();

}

function info(message, meta) {

    console.log(`[${timestamp()}] [INFO]`, message, redact(meta) || "");

}

function warn(message, meta) {

    console.warn(`[${timestamp()}] [WARN]`, message, redact(meta) || "");

}

function error(message, meta) {

    console.error(`[${timestamp()}] [ERROR]`, message, redact(meta) || "");

}

module.exports = { info, warn, error };
