import React from "react";
import { AxiosError } from "axios";

import nprogress from "nprogress";
import { setDevData } from "@/features/DevBar/useDevBarData";
import { redirect } from "react-router-dom";

type Loader = ({ params }: { params: any }) => Promise<any>;

interface Options {
  auth?: boolean;
}

const defaultOptions: Options = {
  auth: true,
};

export function pageRoute(path: string, pageModule: any, options: Options = {}) {
  options = { ...defaultOptions, ...options };

  const Element = pageModule.Page;
  const loader = pageModule.loader;

  return {
    path: path,
    id: pageModule.name + path,
    loader: pageLoader(path, pageModule.name, loader, options),
    element: <Element />,
    shouldRevalidate: ({ currentUrl, nextUrl }) => {
      console.log("shouldRevalidate", nextUrl, currentUrl);

      if (currentUrl?.pathname === nextUrl?.pathname && currentUrl?.search !== nextUrl?.search) {
        const oldParams = new URLSearchParams(currentUrl.search);
        const newParams = new URLSearchParams(nextUrl.search);
        const oldKeys = Array.from(oldParams).map(([key]) => key);
        const newKeys = Array.from(newParams).map(([key]) => key);

        const addedKeys = newKeys.filter((key) => !oldKeys.includes(key));
        const removedKeys = oldKeys.filter((key) => !newKeys.includes(key));

        const diff = { addedKeys, removedKeys };

        if (diff.addedKeys.length === 0 && diff.removedKeys.length === 0) {
          return false;
        }

        if (diff.addedKeys.toString() === "peek" || diff.removedKeys.toString() === "peek") {
          return false;
        }

        return true;
      }

      console.log("shouldRevalidate", "true2");
      return true;
    },
  };
}

function pageLoader(path: string, pageName: string, loader: Loader, options: Options = {}) {
  return async (req: any) => {
    if (options.auth) {
      checkAuth();
    }

    try {
      setDevData({ networkRequests: 0 });

      const start = performance.now();
      startProgressIndicator(req);

      const data = await loader(req);

      stopProgressIndicator();
      const end = performance.now();

      setDevData({ pageName: pageName, loadTime: end - start });

      return data;
    } catch (error) {
      stopProgressIndicator();
      redirectToLoginIfUnauthorized(error);

      console.log("Error loading page", path, error);
    }
  };
}

function startProgressIndicator(req: any) {
  if (req.request.url === document.URL) {
    nprogress.start();
  }
}

function stopProgressIndicator() {
  if (nprogress.isStarted()) {
    nprogress.done();
  }
}

function redirectToLoginIfUnauthorized(error: any) {
  if (error instanceof AxiosError) {
    if (error.response?.status === 401) {
      throw redirect("/log_in");
    }
  }
}

export function checkAuth() {
  if (!window.appConfig.configured) {
    stopProgressIndicator();
    throw redirect("/setup");
  }

  if (!window.appConfig.account?.id) {
    stopProgressIndicator();

    if (window.location.pathname === "/") {
      throw redirect("/log_in");
    } else {
      throw redirect("/log_in?redirect_to=" + encodeURIComponent(window.location.pathname));
    }
  }
}
