import React, { createContext, useContext, useEffect, useState } from "react";
import type { Navigation, RouteObject } from "react-router";
import { createPagePreloader } from "./preloadPage";
import { listenForPagePreloads } from "./hoverPreloading";
import { createPredictivePreloading } from "./predictivePreloading";

const PredictivePreloadingContext = createContext<ReturnType<typeof createPredictivePreloading> | null>(null);

interface PreloadingRouter {
  routes: RouteObject[];
  state: {
    location: { pathname: string; search: string };
    navigation: Pick<Navigation, "state">;
  };
  subscribe: (listener: (state: PreloadingRouter["state"]) => void) => () => void;
}

export function PagePreloading({ router, children }: { router: PreloadingRouter; children?: React.ReactNode }) {
  const [queue, setQueue] = useState<ReturnType<typeof createPredictivePreloading> | null>(null);
  useEffect(() => {
    const preloader = createPagePreloader({
      routes: router.routes,
      getLocation: () => new URL(router.state.location.pathname + router.state.location.search, window.location.origin),
      isNavigating: () => router.state.navigation.state !== "idle",
    });

    const queue = createPredictivePreloading(preloader);
    setQueue(queue);

    const listener = listenForPagePreloads(preloader, document, queue.setHoverPending);
    const unsubscribe = router.subscribe((state) => {
      if (state.navigation.state !== "idle") {
        queue.cancel();
        listener.cancel();
      }
    });

    return () => {
      unsubscribe();
      queue.dispose();
      listener.dispose();
      preloader.dispose();
    };
  }, [router]);

  return <PredictivePreloadingContext.Provider value={queue}>{children}</PredictivePreloadingContext.Provider>;
}

/** Only mounted pages enqueue destinations; preloaded loaders never start another queue. */
export function usePredictivePreloading(hrefs: string[]) {
  const queue = useContext(PredictivePreloadingContext);
  // Cache updates can rerender a page without changing its destination list.
  const destinations = JSON.stringify(hrefs);

  useEffect(() => {
    const hrefs: string[] = JSON.parse(destinations);
    return queue?.schedule(hrefs);
  }, [queue, destinations]);
}
