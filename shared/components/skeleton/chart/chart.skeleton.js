/**
 * =========================================
 * CampusOne Chart Skeleton
 * =========================================
 */

import { BaseSkeleton } from "../base/base.skeleton.js";

// Uneven heights so the placeholder reads as a chart, not a
// row of identical blocks. Cycled if `bars` exceeds this list.
const BAR_HEIGHTS = [55, 80, 40, 95, 65, 75, 50, 90];

export function ChartSkeleton({ bars = 6, height = 200 } = {}) {

    const chartHeight =
        typeof height === "number" ? `${height}px` : height;

    const barsHtml = Array.from({ length: bars }, (_, index) => `
        <div
            class="skel-chart-bar"
            style="height:${BAR_HEIGHTS[index % BAR_HEIGHTS.length]}%"
        >
            ${BaseSkeleton.render({
                width: "100%",
                height: "100%",
                radius: "var(--radius-sm) var(--radius-sm) 0 0"
            })}
        </div>
    `).join("");

    return `
        <div class="skel-chart" style="height:${chartHeight}">
            ${barsHtml}
        </div>
    `;

}
