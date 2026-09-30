/**
 * =========================================
 * CampusOne Dashboard Skeleton
 * -----------------------------------------
 * Composition, not a new primitive — reuses
 * the other skeleton components so a full
 * dashboard loading state stays visually
 * consistent with the pieces it's made of.
 * =========================================
 */

import { CardSkeleton } from "../card/card.skeleton.js";
import { ChartSkeleton } from "../chart/chart.skeleton.js";
import { TableSkeleton } from "../table/table.skeleton.js";

export function DashboardSkeleton({
    statCards = 4,
    tableRows = 4,
    tableColumns = 4
} = {}) {

    return `
        <div class="skel-dashboard">

            <div class="skel-dashboard-stats">
                ${Array.from(
                    { length: statCards },
                    () => CardSkeleton({ withImage: false, lines: 1 })
                ).join("")}
            </div>

            <div class="skel-dashboard-chart">
                ${ChartSkeleton()}
            </div>

            <div class="skel-dashboard-table">
                ${TableSkeleton({ rows: tableRows, columns: tableColumns })}
            </div>

        </div>
    `;

}
