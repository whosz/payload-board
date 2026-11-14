// Stable per-app colour: follows app.order, so it doesn't change when the list is re-sorted.
const APP_COLORS = ['#19e3ff', '#ff4fa3', '#ffc21a', '#9b75ff', '#b6ff1a'];

export const appColor = (order: number) => APP_COLORS[Math.abs(order) % APP_COLORS.length];
