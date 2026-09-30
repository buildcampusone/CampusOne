/**
 * =========================================
 * CampusOne Button Skeleton
 * =========================================
 */

import { BaseSkeleton } from "../base/base.skeleton.js";

export function ButtonSkeleton({ width = "120px", height = "42px" } = {}) {

    return `
        <div class="skel-button">
            ${BaseSkeleton.rounded(width, height, "var(--radius-md)")}
        </div>
    `;

}
