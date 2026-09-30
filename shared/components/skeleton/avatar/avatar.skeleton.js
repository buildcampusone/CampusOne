/**
 * =========================================
 * CampusOne Avatar Skeleton
 * =========================================
 */

import { BaseSkeleton } from "../base/base.skeleton.js";

export function AvatarSkeleton({ size = 48 } = {}) {

    return `
        <div class="skel-avatar">
            ${BaseSkeleton.circle(size)}
        </div>
    `;

}
