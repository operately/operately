import { TextDecoder, TextEncoder } from "util";

Object.assign(global, { TextDecoder, TextEncoder });

// jsdom does not implement ResizeObserver, which some layout-aware components
// (e.g. the Page shell) rely on. Provide a no-op polyfill for the test env.
if (typeof (global as any).ResizeObserver === "undefined") {
  (global as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
