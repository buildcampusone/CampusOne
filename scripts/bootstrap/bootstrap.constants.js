/**
 * ==========================================================
 * CampusOne Bootstrap — Constants
 * ----------------------------------------------------------
 * Deliberately standalone, not imported from
 * shared/constants/*.js. Those files import the Firebase SDK
 * from gstatic CDN URLs (browser ES modules) and cannot be
 * required/imported under plain Node.js. This keeps the
 * bootstrap tool fully isolated from the app, per design.
 *
 * If roles.js / status.js / collections.js in the main app
 * ever change these specific values, update them here too —
 * there are only three lines that matter.
 * ==========================================================
 */

const USERS_COLLECTION = "users";
const PLATFORM_SUPER_ADMIN_ROLE = "platform_super_admin";
const ACTIVE_STATUS = "active";

module.exports = {
    USERS_COLLECTION,
    PLATFORM_SUPER_ADMIN_ROLE,
    ACTIVE_STATUS
};
