import React from "react";

import nprogress from "nprogress";

export function pageRoute(path: string, pageModule: any) {
  const Element = pageModule.Page;
  const loader = pageModule.loader;

  return {
    path: path,
    loader: showProgress(loader),
    element: <Element />,
  };
}

function showProgress(loader: ({ params }: { params: any }) => Promise<any>) {
  return async (req: any) => {
    let samePage = req.request.url === document.URL;

    try {
      const start = performance.now();
      if (!samePage) nprogress.start();

      const data = await loader(req);

      if (!samePage) nprogress.done();

      const end = performance.now();

      if (window.appConfig.environment === "development") {
        console.log(`Execution time: ${end - start} ms`);
      }

      return data;
    } catch (error) {
      console.error(error);
      if (!samePage) nprogress.done();
    }
  };
}
