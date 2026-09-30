/**
 * ==========================================================
 * CampusOne Bootstrap — Core Service
 * ----------------------------------------------------------
 * Runs entirely on the Firebase Admin SDK, which acts with
 * full trusted-server privileges and bypasses firestore.rules
 * by design — that is precisely why this tool exists (no
 * Platform Super Admin can ever exist yet to satisfy the
 * client-side rule, see the design note in the seeder's own
 * README). This file must NEVER be imported by, or share code
 * with, the browser app.
 *
 * Flow:
 *   1. detectExistingSuperAdmin() — fast pre-check
 *   2. createOrRecoverAuthUser()   — passwordless Auth account
 *   3. createFirestoreDocTx()      — atomic, create-only write
 *   4. generateResetLink()         — the only way the admin
 *      ever obtains access; no password ever exists in this
 *      process's memory, logs, or Firestore.
 *   5. On any failure in step 3 for a freshly-created Auth
 *      user, step 2's account is rolled back (deleted).
 * ==========================================================
 */

const logger = require("./bootstrap.logger");

const {
    USERS_COLLECTION,
    PLATFORM_SUPER_ADMIN_ROLE,
    ACTIVE_STATUS
} = require("./bootstrap.constants");

class BootstrapAlreadyExistsError extends Error {

    constructor(message, details) {

        super(message);
        this.name = "BootstrapAlreadyExistsError";
        this.details = details;

    }

}

/**
 * Fast, non-transactional pre-check so the common case (a
 * Super Admin already exists) never even attempts to create
 * an Auth account. This alone is NOT the race-condition guard
 * — createFirestoreDocTx() below re-checks atomically.
 */
async function detectExistingSuperAdmin(db) {

    const snapshot = await db
        .collection(USERS_COLLECTION)
        .where("role", "==", PLATFORM_SUPER_ADMIN_ROLE)
        .limit(1)
        .get();

    if (snapshot.empty) {
        return null;
    }

    const doc = snapshot.docs[0];

    return { uid: doc.id, ...doc.data() };

}

/**
 * Creates the Firebase Auth account with NO password field at
 * all — Admin SDK's createUser() treats a missing `password`
 * as "no password credential", so the account can only ever be
 * accessed after the operator completes the password-reset
 * link flow. `emailVerified: true` is set because this account
 * is provisioned directly by a trusted operator via a secured
 * script, not through public self-registration.
 *
 * Disaster-recovery path: if a PRIOR bootstrap run created the
 * Auth account but crashed before the Firestore write (e.g.
 * process killed, network drop), createUser() will fail with
 * "auth/email-already-exists". Rather than treating that as a
 * hard failure, this looks up the existing Auth account by
 * email and continues the bootstrap using its uid — this is
 * what makes the tool safely re-runnable after a partial
 * failure instead of requiring manual Firebase Console cleanup.
 */
async function createOrRecoverAuthUser(auth, { email, fullName }) {

    try {

        const userRecord = await auth.createUser({
            email,
            displayName: fullName,
            emailVerified: true,
            disabled: false
        });

        return { uid: userRecord.uid, recovered: false };

    } catch (error) {

        if (error.code !== "auth/email-already-exists") {
            throw error;
        }

        logger.warn(
            "Auth account for this email already exists — checking whether a prior bootstrap run was interrupted before the Firestore write.",
            { email }
        );

        const existing = await auth.getUserByEmail(email);

        return { uid: existing.uid, recovered: true };

    }

}

/**
 * Writes the Platform Super Admin document using Firestore
 * create-only semantics inside a transaction. The transaction
 * re-reads for ANY existing platform_super_admin doc (closing
 * the race window between detectExistingSuperAdmin() and here
 * — e.g. two operators running the script at the same moment)
 * and uses `create()` (not `set()`) on the target doc, which
 * fails outright rather than overwriting if that uid somehow
 * already has a document.
 */
async function createFirestoreDocTx(db, { uid, email, fullName }) {

    const usersRef = db.collection(USERS_COLLECTION);
    const targetRef = usersRef.doc(uid);

    await db.runTransaction(async (tx) => {

        const existingSuperAdmin = await tx.get(
            usersRef.where("role", "==", PLATFORM_SUPER_ADMIN_ROLE).limit(1)
        );

        if (!existingSuperAdmin.empty) {

            throw new BootstrapAlreadyExistsError(
                "A Platform Super Admin was created concurrently by another run.",
                { uid: existingSuperAdmin.docs[0].id }
            );

        }

        const targetSnap = await tx.get(targetRef);

        if (targetSnap.exists) {

            // Recovery path: the Firestore doc was actually already
            // written by a previous run (the process must have
            // crashed after this step but before the reset link was
            // returned to the operator). Do not overwrite it — surface
            // it as already-bootstrapped instead.
            throw new BootstrapAlreadyExistsError(
                "A user document for this account already exists.",
                { uid }
            );

        }

        tx.create(targetRef, {

            uid,
            email,
            fullName,

            role: PLATFORM_SUPER_ADMIN_ROLE,
            status: ACTIVE_STATUS,
            institutionId: null,

            createdAt: new Date(),
            updatedAt: new Date()

        });

    });

}

async function generateResetLink(auth, email) {

    return auth.generatePasswordResetLink(email);

}

/**
 * Orchestrates the full bootstrap. Returns:
 *   { created: true, uid, email, resetLink }
 *   { created: false, reason: "already-exists", existing }
 *
 * Throws for any unrecoverable error (validation is expected
 * to have already run before this is called).
 */
async function bootstrapSuperAdmin({ auth, db, email, fullName }) {

    const existing = await detectExistingSuperAdmin(db);

    if (existing) {

        // Idempotent AND useful for disaster recovery: if the
        // operator lost the original reset link, re-running this
        // script safely generates a fresh one for the existing
        // account without creating anything new or touching the
        // existing Firestore doc.
        const resetLink = await generateResetLink(auth, existing.email).catch((error) => {

            logger.warn("Could not generate a fresh reset link for the existing Super Admin.", { error: error.message });
            return null;

        });

        return {
            created: false,
            reason: "already-exists",
            existing: { uid: existing.uid, email: existing.email },
            resetLink
        };

    }

    const { uid, recovered } = await createOrRecoverAuthUser(auth, { email, fullName });

    if (recovered) {
        logger.info("Continuing an interrupted prior bootstrap run using the existing Auth account.", { uid });
    }

    try {

        await createFirestoreDocTx(db, { uid, email, fullName });

    } catch (error) {

        if (error instanceof BootstrapAlreadyExistsError) {

            // Nothing to roll back — the account (new or recovered)
            // is legitimately already part of a completed or
            // in-progress bootstrap. Surface as idempotent no-op.
            const resetLink = await generateResetLink(auth, email).catch(() => null);

            return {
                created: false,
                reason: "already-exists",
                existing: { ...error.details, email },
                resetLink
            };

        }

        // Genuine failure. Only roll back the Auth account if THIS
        // run created it — never delete a recovered pre-existing
        // account, since that could destroy a legitimate prior
        // partial bootstrap that a human still needs to inspect.
        if (!recovered) {

            logger.error("Firestore write failed after Auth account creation — rolling back the Auth account.", { uid });

            await auth.deleteUser(uid).catch((rollbackError) => {

                logger.error(
                    "ROLLBACK FAILED — an orphaned Auth account may now exist and requires manual cleanup in the Firebase Console.",
                    { uid, rollbackError: rollbackError.message }
                );

            });

        }

        throw error;

    }

    const resetLink = await generateResetLink(auth, email);

    return { created: true, uid, email, resetLink };

}

module.exports = {
    BootstrapAlreadyExistsError,
    detectExistingSuperAdmin,
    createOrRecoverAuthUser,
    createFirestoreDocTx,
    generateResetLink,
    bootstrapSuperAdmin
};
