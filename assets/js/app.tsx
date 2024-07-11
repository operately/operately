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

import { createAppRoutes } from "./routes";

import Api from "@/api";
import "./i18n";

import { setupTestErrorLogger } from "@/utils/errorLogger";
import { ThemeProvider } from "./theme";

import "@/api/socket";

setupTestErrorLogger();

Api.configureDefault({ basePath: "/api/v2" });

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
const routes = createAppRoutes();

const App: JSX.Element = (
  <React.StrictMode>
    <ThemeProvider>
      <RouterProvider router={routes} />
    </ThemeProvider>
  </React.StrictMode>
);

if (rootElement !== null) {
  createRoot(rootElement).render(App);
}
