/**
 * ==========================================================
 * CampusOne Role Guard
 * ==========================================================
 */

import { ROLES } from "../constants/roles.js";

export function hasRole(user, ...roles) {

    if (!user) {
        return false;
    }

    return roles.includes(user.role);

}

export function isPlatformSuperAdmin(user) {

    return hasRole(
        user,
        ROLES.PLATFORM_SUPER_ADMIN
    );

}

export function isInstitutionOwner(user) {

    return hasRole(
        user,
        ROLES.INSTITUTION_OWNER
    );

}

export function isInstitutionAdmin(user) {

    return hasRole(
        user,
        ROLES.INSTITUTION_ADMIN
    );

}

export function isDepartmentAdmin(user) {

    return hasRole(
        user,
        ROLES.DEPARTMENT_ADMIN
    );

}

export function isFaculty(user) {

    return hasRole(
        user,
        ROLES.FACULTY
    );

}

export function isStudent(user) {

    return hasRole(
        user,
        ROLES.STUDENT
    );

}

export function isParent(user) {

    return hasRole(
        user,
        ROLES.PARENT
    );

}