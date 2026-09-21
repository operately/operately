import { useEffect } from "react";
import type { createBrowserRouter } from "react-router";
import { createPagePreloader } from "./preloadPage";
import { listenForPagePreloads } from "./hoverPreloading";

export function PagePreloading({ router }: { router: ReturnType<typeof createBrowserRouter> }) {
  useEffect(() => {
    const preloader = createPagePreloader({
      routes: router.routes,
      getLocation: () => new URL(router.state.location.pathname + router.state.location.search, window.location.origin),
      isNavigating: () => router.state.navigation.state !== "idle",
    });

    const listener = listenForPagePreloads(preloader, document);
    const unsubscribe = router.subscribe((state) => {
      if (state.navigation.state !== "idle") listener.cancel();
    });

    return () => {
      unsubscribe();
      listener.dispose();
      preloader.dispose();
    };
  }, [router]);

  return null;
}
