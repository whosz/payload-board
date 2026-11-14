// Stable per-app colour: follows app.order, so it doesn't change when the list is re-sorted.
// Values live in globals.css (--app-color-N) so each theme can pick readable shades.
export const appColor = (order: number) => `var(--app-color-${Math.abs(order) % 5})`;
