# CampusOne — Platform Super Admin Bootstrap

A standalone, isolated tool that safely creates the **very first**
Platform Super Admin for CampusOne. Use it only for:

- **Initial deployment** — the project has no Platform Super Admin yet.
- **Disaster recovery** — the last Platform Super Admin account was
  lost/locked out and no other one exists.

It is never used for day-to-day admin provisioning — once the first
Platform Super Admin exists, *they* create any further platform-level
accounts from inside the app itself.

---

## Why this can't be a normal app feature

CampusOne's `firestore.rules` only allow creating a `users/{uid}`
document with `role: platform_super_admin` if the person making the
request is *already* a Platform Super Admin. Before the first one
exists, nothing in the browser app is allowed to create one — that's
correct, intentional security, not a bug.

This tool breaks that deadlock the standard way: it runs outside the
browser, using the **Firebase Admin SDK** with a service account key.
The Admin SDK always has full trusted-server access and does not go
through `firestore.rules` at all. `firestore.rules` itself is never
touched by this tool.

This folder is completely separate from the CampusOne web app: its
own `package.json`, its own dependencies, its own constants (copied
by value, not imported, from `shared/constants/`). No file inside
`/scripts/bootstrap/` is imported by, or imports from, the app.

---

## What it does and does not do

**Does:**
- Checks whether a Platform Super Admin already exists — if so, stops
  and does nothing.
- Creates one Firebase Auth account, **with no password** — the
  account can only be accessed later via a password-reset link.
- Writes exactly one Firestore document, using create-only semantics
  (fails rather than overwrites if that document already exists).
- Generates a Firebase password-reset link and prints it once, to
  your terminal only.
- Rolls back (deletes) the Auth account it just created if the
  Firestore write fails.
- Is safe to re-run: an already-bootstrapped project is a no-op
  (plus a fresh reset link, in case the original was lost).

**Never does:**
- Never asks for, accepts, stores, or logs a password.
- Never overwrites or deletes any existing document.
- Never touches `institutions`, `institutionCodes`, `subscriptions`,
  or any `institution_owner` / `institution_admin` account.
- Never modifies `firestore.rules`, `storage.rules`, or any file in
  the main CampusOne app.

---

## Prerequisites

- Node.js 18+ installed on the machine you'll run this from (your own
  computer or a secured admin machine — **not** a public server).
- A Firebase **service account key** for the `campusone-bd5c5`
  project: Firebase Console → Project Settings → Service Accounts →
  "Generate new private key". This downloads a JSON file.

---

## Setup (one-time)

```bash
cd scripts/bootstrap
npm install
cp .env.example .env
```

Edit `.env`:

```
FIREBASE_SERVICE_ACCOUNT_PATH=/absolute/path/to/serviceAccountKey.json
SUPER_ADMIN_EMAIL=your-real-admin-email@yourdomain.com
SUPER_ADMIN_FULL_NAME=Your Name
```

Notes:
- Keep the service account JSON **outside** the git repo, or make
  sure it's gitignored. Never commit it.
- There is no password field anywhere in `.env` — this is
  intentional, not an oversight.

---

## Running it — Initial Deployment

```bash
npm run bootstrap
```

Expected output on success:

```
BOOTSTRAP COMPLETE
 UID:   <firebase-uid>
 Email: your-real-admin-email@yourdomain.com

 Password Reset Link (send this to the operator
 through a secure, one-time channel — it is the
 ONLY way to set the account's password):

 https://campusone-bd5c5.firebaseapp.com/__/auth/action?mode=resetPassword&...
```

**Immediately after this:**
1. Copy the link and deliver it to whoever will hold this account
   through a secure channel (password manager share, encrypted
   message — not plain email/Slack if avoidable).
2. That person opens the link, sets their password.
3. They can now sign in through the Super Admin portal's normal login
   (the 5-tap logo gesture → login form) using that email + the
   password they just set.

The link is printed once and is not saved anywhere by this tool. If
it expires or gets lost before use, just run `npm run bootstrap`
again — see below.

---

## Running it — Disaster Recovery

Two recovery situations, both handled by simply running
`npm run bootstrap` again with the same `.env`:

**"I lost the reset link, but the account exists and works fine."**
The script detects the existing Platform Super Admin, makes no
changes, and prints a freshly generated reset link for that same
account.

**"A previous bootstrap run crashed partway through."**
If it crashed after the Auth account was created but before the
Firestore document was written, re-running will detect the orphaned
Auth account, safely continue from there, write the missing
Firestore document, and issue a reset link — without creating a
duplicate account.

**"The only Super Admin account is completely gone/unusable and I
need a new one."**
Manually delete the old Auth user and Firestore `users/{uid}`
document for that account first (a deliberate human decision — this
tool will never do that step for you), then run `npm run bootstrap`
as if it were initial deployment.

---

## Troubleshooting

| Message | Meaning |
|---|---|
| "No action taken — a Platform Super Admin already exists" | Working as intended. Nothing was changed. |
| "SUPER_ADMIN_EMAIL is not a valid email address" | Fix the value in `.env` and re-run. |
| "ROLLBACK FAILED — an orphaned Auth account may now exist" | Rare double-failure. Check the Firebase Console → Authentication for an account with no matching Firestore doc, and delete it manually before re-running. |
| `Error: Cannot find module '.../serviceAccountKey.json'` | `FIREBASE_SERVICE_ACCOUNT_PATH` in `.env` is wrong or the file wasn't placed there. |

---

## Security checklist before you run this

- [ ] Running from a trusted, private machine — not a shared/public one.
- [ ] Service account JSON is not inside a git-tracked, uncommitted-check path.
- [ ] `.env` is not committed (repo's `.gitignore` already covers `*.env`).
- [ ] You have a secure channel ready for delivering the reset link.
