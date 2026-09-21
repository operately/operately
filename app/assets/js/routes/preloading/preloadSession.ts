// After login/logout, this document still has its old account/company state.
// Keep preloading disabled until the authentication flow reloads the document,
// which initializes fresh state and resets this flag to true.
let enabled = true;
const listeners = new Set<() => void>();

export function isPreloadingEnabled() {
  return enabled;
}

export function disablePreloading() {
  enabled = false;
  listeners.forEach((listener) => listener());
}

export function subscribePreloadSession(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
