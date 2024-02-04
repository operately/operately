import React from "react";

import nprogress from "nprogress";
import { setPerfData } from "@/features/PerfBar/usePerfBarData";

export function pageRoute(path: string, pageModule: any) {
  const Element = pageModule.Page;
  const loader = pageModule.loader;

  return {
    path: path,
    loader: showProgress(path, loader),
    element: <Element />,
  };
}

function showProgress(path: string, loader: ({ params }: { params: any }) => Promise<any>) {
  return async (req: any) => {
    let samePage = req.request.url === document.URL;

    try {
      setPerfData({ networkRequests: 0 });

      const start = performance.now();
      if (!samePage) nprogress.start();

      const data = await loader(req);

      if (!samePage) nprogress.done();
      const end = performance.now();

      if (window.appConfig.environment === "development") {
        console.log(`Execution time: ${end - start} ms`);
      }

      setPerfData({ pageLoad: end - start });

      return data;
    } catch (error) {
      console.log("Error loading page", path, error);
      if (!samePage) nprogress.done();
    }
  };
}
