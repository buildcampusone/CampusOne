/**
 * ==========================================================
 * CampusOne
 * Institution Owner — Institution Admin Management
 * Directory Filter / Sort Pipeline
 * ----------------------------------------------------------
 * Phase 5.1.3 — Institution Administrator Directory
 *
 * Pure functions only — no DOM access, no globals, no mutation
 * of the array/objects passed in. Each function returns a new
 * array so it runs identically whether the source is
 * mock-admins.js today or a Firestore snapshot in 5.1.4; the
 * ordered reduction (search -> status -> department -> sort) is
 * composed by the controller, not by this file, so each step
 * stays independently testable.
 * ==========================================================
 */

/**
 * Case-insensitive substring match against fullName, email, and
 * mobile. An empty/whitespace-only term is treated as "no
 * filter" — returns a shallow copy of the input, unchanged.
 *
 * @param {Array<object>} admins
 * @param {string} searchTerm
 * @returns {Array<object>}
 */
export function filterBySearch(admins, searchTerm) {

    const term = (searchTerm ?? "").trim().toLowerCase();

    if (!term) return [...admins];

    return admins.filter((admin) => {

        const fullName = (admin.fullName ?? "").toLowerCase();
        const email = (admin.email ?? "").toLowerCase();
        const mobile = (admin.mobile ?? "").toLowerCase();

        return (
            fullName.includes(term) ||
            email.includes(term) ||
            mobile.includes(term)
        );

    });

}

/**
 * Filters by the admin's `status` field. `"all"` (or a falsy
 * value) means no filter — matches getStatusFilterOptions()'
 * placeholder convention ("All Statuses"). Any other value must
 * match one of the real USER_STATUS strings already used on the
 * record (shared/constants/status.js) — this function doesn't
 * import that enum itself, it just compares against whatever
 * value the caller passes through from the Status Select.
 *
 * @param {Array<object>} admins
 * @param {string} status
 * @returns {Array<object>}
 */
export function filterByStatus(admins, status) {

    if (!status || status === "all") return [...admins];

    return admins.filter((admin) => admin.status === status);

}

/**
 * Filters by the admin's `department` field. `"all"` (or a
 * falsy value) means no filter. Compares directly against
 * whatever value the Department Select passes through — no
 * normalization here, since both the Select's options and the
 * mock/Firestore records are built from the same source
 * (MOCK_DEPARTMENTS today).
 *
 * @param {Array<object>} admins
 * @param {string} department
 * @returns {Array<object>}
 */
export function filterByDepartment(admins, department) {

    if (!department || department === "all") return [...admins];

    return admins.filter((admin) => admin.department === department);

}

/**
 * Sorts by one of the three real getSortOptions() values —
 * "newest", "oldest", "alphabetical". Any other/unrecognized
 * value returns a shallow copy in the original order rather
 * than throwing, so a stray/legacy value never breaks the
 * directory render.
 *
 * @param {Array<object>} admins
 * @param {"newest"|"oldest"|"alphabetical"} sort
 * @returns {Array<object>}
 */
export function sortAdmins(admins, sort) {

    const list = [...admins];

    switch (sort) {

        case "newest":

            return list.sort(
                (a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0)
            );

        case "oldest":

            return list.sort(
                (a, b) => new Date(a.createdAt ?? 0) - new Date(b.createdAt ?? 0)
            );

        case "alphabetical":

            return list.sort(
                (a, b) => (a.fullName ?? "").localeCompare(b.fullName ?? "")
            );

        default:

            return list;

    }

}
