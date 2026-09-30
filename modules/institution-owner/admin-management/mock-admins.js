/**
 * ==========================================================
 * CampusOne
 * Institution Owner — Institution Admin Management
 * Mock Administrator Records
 * ----------------------------------------------------------
 * Phase 5.1.3 — Institution Administrator Directory
 *
 * Pure data. No DOM, no Firebase, no side effects — a flat
 * array `admin-management.controller.js` reads from while
 * fetchAdminDirectory()/fetchAdminSummary() are still mock-
 * backed. Exactly one consumer (the controller); nothing else
 * in this module imports this file directly, which is what
 * makes it disposable in 5.1.4 once a Firestore `users` query
 * takes over the same two functions.
 *
 * Field names deliberately mirror create-admin.controller.js's
 * already-established buildPayload() shape — fullName,
 * designation, email, mobile, department, status, role — so
 * 5.1.4 needs zero field-remapping when real documents replace
 * this array. `status` and `role` reuse the real enums
 * (shared/constants/status.js, shared/constants/roles.js)
 * rather than inventing parallel string literals here.
 *
 * `department` values are a small fixed set — the same strings
 * getDepartmentFilterOptions() will enumerate once that filter
 * gets real options, so both stay in sync by construction, not
 * by convention.
 * ==========================================================
 */

import { USER_STATUS } from "../../../shared/constants/status.js";
import { ROLES } from "../../../shared/constants/roles.js";

export const MOCK_DEPARTMENTS = Object.freeze([
    "Computer Science",
    "Administration",
    "Examinations"
]);

export const mockAdmins = [
    {
        id: "mock-admin-001",
        fullName: "Ritika Sharma",
        designation: "Academic Coordinator",
        email: "ritika.sharma@example.edu",
        mobile: "9876543210",
        department: "Computer Science",
        status: USER_STATUS.ACTIVE,
        role: ROLES.INSTITUTION_ADMIN,
        createdAt: "2026-05-12T09:30:00.000Z",
        lastLogin: "2026-07-25T07:45:00.000Z"
    },
    {
        id: "mock-admin-002",
        fullName: "Aman Verma",
        designation: "Examination Controller",
        email: "aman.verma@example.edu",
        mobile: "9876543211",
        department: "Examinations",
        status: USER_STATUS.ACTIVE,
        role: ROLES.INSTITUTION_ADMIN,
        createdAt: "2026-04-02T11:15:00.000Z",
        lastLogin: "2026-07-20T13:10:00.000Z"
    },
    {
        id: "mock-admin-003",
        fullName: "Priya Nair",
        designation: "Front Office Administrator",
        email: "priya.nair@example.edu",
        mobile: "9876543212",
        department: "Administration",
        status: USER_STATUS.PENDING,
        role: ROLES.INSTITUTION_ADMIN,
        createdAt: "2026-07-18T06:00:00.000Z",
        lastLogin: null
    },
    {
        id: "mock-admin-004",
        fullName: "Suresh Iyer",
        designation: "Department Coordinator",
        email: "suresh.iyer@example.edu",
        mobile: "9876543213",
        department: "Computer Science",
        status: USER_STATUS.SUSPENDED,
        role: ROLES.INSTITUTION_ADMIN,
        createdAt: "2026-02-27T08:20:00.000Z",
        lastLogin: "2026-06-11T09:05:00.000Z"
    },
    {
        id: "mock-admin-005",
        fullName: "Neha Kapoor",
        designation: "Records Officer",
        email: "neha.kapoor@example.edu",
        mobile: "9876543214",
        department: "Administration",
        status: USER_STATUS.ACTIVE,
        role: ROLES.INSTITUTION_ADMIN,
        createdAt: "2026-06-30T10:40:00.000Z",
        lastLogin: "2026-07-26T05:55:00.000Z"
    }
];

export default mockAdmins;
