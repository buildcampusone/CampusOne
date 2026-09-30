/**
 * =========================================
 * CampusOne Table Skeleton
 * =========================================
 */

import { BaseSkeleton } from "../base/base.skeleton.js";

function skeletonRow(columns) {

    return `
        <div class="skel-table-row">
            ${Array.from(
                { length: columns },
                () => BaseSkeleton.rectangle("100%", "14px")
            ).join("")}
        </div>
    `;

}

export function TableSkeleton({ rows = 5, columns = 4 } = {}) {

    return `
        <div
            class="skel-table"
            style="--skel-table-columns:${columns}"
        >
            ${Array.from({ length: rows }, () => skeletonRow(columns)).join("")}
        </div>
    `;

}
