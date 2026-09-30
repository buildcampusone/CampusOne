/**
 * =========================================
 * CampusOne Profile Skeleton
 * =========================================
 */

import { BaseSkeleton } from "../base/base.skeleton.js";

export function ProfileSkeleton({ size = 64 } = {}) {

    return `
        <div class="skel-profile">

            ${BaseSkeleton.circle(size)}

            <div class="skel-profile-meta">

                ${BaseSkeleton.rectangle("60%", "18px")}

                ${BaseSkeleton.rectangle("40%", "14px")}

            </div>

        </div>
    `;

}
