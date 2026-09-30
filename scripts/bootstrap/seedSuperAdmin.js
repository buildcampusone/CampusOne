#!/usr/bin/env node

/**
 * ==========================================================
 * CampusOne — Platform Super Admin Bootstrap
 * ----------------------------------------------------------
 * Run this ONLY during initial deployment or disaster
 * recovery. See README.md in this folder before running.
 *
 * Usage:
 *   npm install
 *   cp .env.example .env   (then fill in real values)
 *   npm run bootstrap
 * ==========================================================
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const admin = require("firebase-admin");
const logger = require("./bootstrap.logger");
const { validateInput, BootstrapValidationError } = require("./bootstrap.validation");
const { bootstrapSuperAdmin } = require("./bootstrap.service");

async function main() {

    const email = (process.env.SUPER_ADMIN_EMAIL || "").trim();
    const fullName = (process.env.SUPER_ADMIN_FULL_NAME || "").trim();
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    validateInput({ email, fullName });

    if (!serviceAccountPath) {
        throw new BootstrapValidationError("FIREBASE_SERVICE_ACCOUNT_PATH is required in .env.");
    }

    const serviceAccount = require(path.resolve(serviceAccountPath));

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    const auth = admin.auth();
    const db = admin.firestore();

    logger.info("Starting CampusOne bootstrap — checking for an existing Platform Super Admin...");

    const result = await bootstrapSuperAdmin({ auth, db, email, fullName });

    if (!result.created) {

        logger.info(
            "No action taken — a Platform Super Admin already exists. This tool never overwrites or duplicates.",
            { existingUid: result.existing?.uid, existingEmail: result.existing?.email }
        );

        if (result.resetLink) {

            console.log("\n A fresh password reset link was generated for the");
            console.log(" existing account (useful if the original link was lost):\n");
            console.log(` ${result.resetLink}\n`);

        }

        return;

    }

    logger.info("Platform Super Admin created successfully.", { uid: result.uid, email: result.email });

    console.log("\n==================================================");
    console.log(" BOOTSTRAP COMPLETE");
    console.log("==================================================");
    console.log(` UID:   ${result.uid}`);
    console.log(` Email: ${result.email}`);
    console.log("\n Password Reset Link (send this to the operator");
    console.log(" through a secure, one-time channel — it is the");
    console.log(" ONLY way to set the account's password):\n");
    console.log(` ${result.resetLink}`);
    console.log("\n This link is not stored anywhere by this script.");
    console.log(" If lost, re-run this script — it will detect the");
    console.log(" existing account and generate a fresh link.");
    console.log("==================================================\n");

}

main()
    .then(() => process.exit(0))
    .catch((error) => {

        logger.error(error.message, { name: error.name });
        process.exit(1);

    });
