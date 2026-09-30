/**
 * =========================================
 * CampusOne Card Skeleton
 * =========================================
 */

import { BaseSkeleton } from "../base/base.skeleton.js";

export function CardSkeleton({ withImage = true, lines = 2 } = {}) {

    return `
        <div class="skel-card">

            ${withImage ? BaseSkeleton.rounded("100%", "160px", "var(--radius-lg)") : ""}

            <div class="skel-card-body">

                ${BaseSkeleton.rectangle("70%", "18px")}

                ${Array.from(
                    { length: lines },
                    () => BaseSkeleton.rectangle("100%", "14px")
                ).join("")}

            </div>

        </div>
    `;

}
