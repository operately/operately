// Does nothing until startAnalytics registers tracker.logout; logout is safe before initialization.
let reset = () => {};

export function registerAnalyticsReset(callback: () => void) {
  reset = callback;
}

export function resetAnalytics() {
  reset();
}
