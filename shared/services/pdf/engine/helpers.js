/* =========================================
   Shared Formatting Helpers
   Small, reusable formatters so every
   document formats currency/dates the same
   way — change it once, applies everywhere.
========================================= */

export function formatCurrency(amount) {

    const number = Number(amount) || 0;

    return `₹${number.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

}

export function formatDate(dateLike) {

    const date = dateLike ? new Date(dateLike) : new Date();

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

}

export function formatDateTime(dateLike) {

    const date = dateLike ? new Date(dateLike) : new Date();

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

}

export function safeText(value, fallback = "—") {

    if (value === null || value === undefined || value === "") return fallback;

    return value;

}
