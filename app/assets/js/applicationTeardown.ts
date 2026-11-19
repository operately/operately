let teardown: (() => void) | undefined;

export function registerApplicationTeardown(callback: () => void) {
  teardown = callback;
}

/** Detach the outgoing application synchronously before removing its session data. */
export function teardownApplication() {
  const callback = teardown;
  teardown = undefined;
  callback?.();
}
