/**
 * =========================================
 * CampusOne List Skeleton
 * =========================================
 */

import { BaseSkeleton } from "../base/base.skeleton.js";

function skeletonItem(withAvatar) {

    return `
        <div class="skel-list-item">

            ${withAvatar ? BaseSkeleton.circle(36) : ""}

            <div class="skel-list-item-body">

                ${BaseSkeleton.rectangle("70%", "14px")}

                ${BaseSkeleton.rectangle("40%", "12px")}

            </div>

        </div>
    `;

}

export function ListSkeleton({ items = 5, withAvatar = true } = {}) {

    return `
        <div class="skel-list">
            ${Array.from({ length: items }, () => skeletonItem(withAvatar)).join("")}
        </div>
    `;

}
