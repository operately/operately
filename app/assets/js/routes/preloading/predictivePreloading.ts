import type { PagePreloader } from "./preloadPage";
import { isPreloadingEnabled, subscribePreloadSession } from "./preloadSession";

/** Preload one page at a time. Navigation drops queued pages; in-flight requests continue. */
export function createPredictivePreloading(preloader: PagePreloader) {
  let batch: { hrefs: string[]; scope: string } | undefined;
  let hoverPending = false;
  let running = false;
  let disposed = false;

  function cancel() {
    batch = undefined;
  }

  function resume() {
    // Let effect cleanup/navigation cancel the batch before starting another loader.
    queueMicrotask(runNext);
  }

  async function runNext() {
    if (!batch || disposed || running || hoverPending || preloader.hasPending()) return;
    if (!isPreloadingEnabled() || batch.scope !== preloader.scope()) return cancel();

    const href = batch.hrefs.shift();
    if (!href) return;
    if (!preloader.isEligible(href)) return resume();

    running = true;
    try {
      await preloader.preloadPage(href);
    } finally {
      running = false;
      resume();
    }
  }

  const unsubscribe = subscribePreloadSession(cancel);
  const unsubscribeCompletion = preloader.subscribeToCompletion(resume);

  return {
    schedule(hrefs: string[]) {
      cancel();
      if (disposed || !isPreloadingEnabled()) return () => {};

      const scheduled = { hrefs: [...new Set(hrefs)].filter(preloader.isEligible), scope: preloader.scope() };
      batch = scheduled;
      resume();

      // An outgoing page's cleanup must not discard the incoming page's queue.
      return () => {
        if (batch === scheduled) cancel();
      };
    },
    cancel,
    /**
     * Pause while hover/focus timers are pending. When they fire or are canceled,
     * try resuming; runNext still waits for any in-flight preload to finish.
     */
    setHoverPending(pending: boolean) {
      hoverPending = pending;
      if (!pending) resume();
    },
    dispose() {
      disposed = true;
      cancel();
      unsubscribe();
      unsubscribeCompletion();
    },
  };
}
