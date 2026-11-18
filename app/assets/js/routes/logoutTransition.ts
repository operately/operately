import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

// Successful logout ends this document's company lifecycle. The root redirect
// loads a fresh document; outgoing routes must stay unmounted until then.
let loggingOut = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return loggingOut;
}

export function useLogoutTransition() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function beginLogoutTransition() {
  // A scheduled update can leave query observers mounted during cache clearing.
  flushSync(() => {
    loggingOut = true;
    listeners.forEach((listener) => listener());
  });
}
