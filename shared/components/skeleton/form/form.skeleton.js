/**
 * =========================================
 * CampusOne Form / Input Skeleton
 * =========================================
 */

import { BaseSkeleton } from "../base/base.skeleton.js";

/**
 * A single label + field placeholder, mirroring
 * shared/components/input/input.js structure.
 */
export function InputSkeleton({ withLabel = true } = {}) {

    return `
        <div class="skel-input-group">

            ${withLabel ? BaseSkeleton.rectangle("35%", "12px") : ""}

            ${BaseSkeleton.rounded("100%", "48px", "var(--radius-md)")}

        </div>
    `;

}

/**
 * A stack of InputSkeletons — for a full form's loading state.
 */
export function FormSkeleton({ fields = 3, withLabel = true } = {}) {

    return `
        <div class="skel-form">
            ${Array.from({ length: fields }, () => InputSkeleton({ withLabel })).join("")}
        </div>
    `;

}
