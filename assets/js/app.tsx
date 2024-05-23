import React from "react";
import { createRoot } from "react-dom/client";

import * as Sentry from "@sentry/react";
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
  RouterProvider,
} from "react-router-dom";

import routes from "./routes";

import "./i18n";

if (window.appConfig.sentry.enabled) {
  Sentry.init({
    dsn: window.appConfig.sentry.dsn,
    integrations: [
      new Sentry.BrowserTracing({
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          React.useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes,
        ),
      }),
    ],
    enableTracing: false,
  });
}

const rootElement: HTMLElement | null = document.getElementById("root");

const App: JSX.Element = (
  <React.StrictMode>
    <RouterProvider router={routes} />
  </React.StrictMode>
);

if (rootElement !== null) {
  createRoot(rootElement).render(App);
}
