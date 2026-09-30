/**
 * =========================================
 * CampusOne Base Skeleton Component
 * =========================================
 */

export class BaseSkeleton {

    /**
     * Core primitive — every shape below is built on top of this.
     * Width/height/radius are applied inline so the exact final
     * size is known before the element ever paints, which is what
     * prevents layout shift once real content replaces it.
     *
     * @param {Object}  [options]
     * @param {string|number} [options.width]  - any CSS width (px, %, rem...). Numbers are treated as px.
     * @param {string|number} [options.height] - any CSS height. Numbers are treated as px.
     * @param {string}  [options.radius]  - any CSS border-radius; omit to use the --skeleton-radius token
     * @param {string}  [options.className] - extra class(es) merged onto the root .co-skeleton
     */
    static render({ width, height, radius, className = "" } = {}) {

        const toCssSize = (value) =>
            typeof value === "number" ? `${value}px` : value;

        const style = [
            width !== undefined ? `width:${toCssSize(width)}` : "",
            height !== undefined ? `height:${toCssSize(height)}` : "",
            radius ? `border-radius:${radius}` : ""
        ].filter(Boolean).join(";");

        const classes =
            `co-skeleton ${className}`.trim();

        return `
            <div
                class="${classes}"
                style="${style}"
                aria-hidden="true">
            </div>
        `;

    }

    /* =========================================
       Shape Primitives
       (Width / Height / Radius support comes
       straight from render() above.)
    ========================================= */

    /** Sharp-cornered block. */
    static rectangle(width = "100%", height = "20px") {
        return this.render({
            width,
            height,
            radius: "0",
            className: "co-skeleton-rect"
        });
    }

    /** Soft-cornered block — defaults to the design system's --radius-md. */
    static rounded(width = "100%", height = "20px", radius = "var(--radius-md)") {
        return this.render({
            width,
            height,
            radius,
            className: "co-skeleton-rounded"
        });
    }

    /** Perfect circle — pass one size, width and height stay in sync. */
    static circle(size = 48) {
        return this.render({
            width: size,
            height: size,
            radius: "50%",
            className: "co-skeleton-circle"
        });
    }

    /* =========================================
       Existing Presets
       (kept as-is for backward compatibility —
       nothing below this line changed)
    ========================================= */

    static avatar(size = 48) {
        return `
            <div
                class="co-skeleton co-skeleton-avatar"
                style="width:${size}px;height:${size}px">
            </div>
        `;
    }

    static title(width = "65%") {
        return `
            <div
                class="co-skeleton co-skeleton-title"
                style="width:${width}">
            </div>
        `;
    }

    static text(width = "100%") {
        return `
            <div
                class="co-skeleton co-skeleton-text"
                style="width:${width}">
            </div>
        `;
    }

    static button(width = "120px") {
        return `
            <div
                class="co-skeleton co-skeleton-button"
                style="width:${width}">
            </div>
        `;
    }

    static image(height = "200px") {
        return `
            <div
                class="co-skeleton co-skeleton-image"
                style="height:${height}">
            </div>
        `;
    }

}