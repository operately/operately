import React from "react";

import { setDevData } from "@/features/DevBar/useDevBarData";
import { isUnauthorizedError, loginPath } from "@/utils/unauthorized";
import nprogress from "nprogress";
import { redirect } from "react-router";
import { Loader, PageModule } from "./types";

interface Options {
  auth?: boolean;
}

const defaultOptions: Options = {
  auth: true,
};

export function pageRoute(path: string, pageModule: PageModule, options: Options = {}) {
  options = { ...defaultOptions, ...options };

  const Element = pageModule.Page;
  const loader = pageModule.loader;

  return {
    path: path,
    loader: pageLoader(path, pageModule.name, loader, options),
    element: <Element />,
    shouldRevalidate: pageModule.shouldRevalidate,
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

      if (hasHttpStatus(error, 500)) {
        console.log("Error loading page", path, error);
      }

      throw error;
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

function redirectToLoginIfUnauthorized(error: unknown) {
  if (isUnauthorizedError(error)) {
    throw redirect(loginPath());
  }
}

function hasHttpStatus(error: unknown, status: number): boolean {
  return typeof error === "object" && error !== null && "status" in error && error.status === status;
}

export function checkAuth() {
  if (!window.appConfig.configured) {
    stopProgressIndicator();
    throw redirect("/setup");
  }

  if (!window.appConfig.account?.id) {
    stopProgressIndicator();
    throw redirect(loginPath());
  }
}
