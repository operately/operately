import React from "react";
import { createRoot } from "react-dom/client";

import * as Signals from "@/signals";
import * as Sentry from "@sentry/react";
import {
  createRoutesFromChildren,
  matchRoutes,
  RouterProvider,
  useLocation,
  useNavigationType,
} from "react-router-dom";

import { createAppRoutes } from "./routes";

import Api from "@/api";
import AdminApi from "@/ee/admin_api";
import "./i18n";

import { setupTestErrorLogger } from "@/utils/errorLogger";

import "@/api/socket";
import ReactModal from "react-modal";
import { ToasterBar } from "turboui";

setupTestErrorLogger();

Api.default.setBasePath("/api/v2");
AdminApi.default.setBasePath("/admin/api/v1");

Signals.init();

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
    <ToasterBar />
    <RouterProvider router={routes} />
  </React.StrictMode>
);

if (rootElement !== null) {
  createRoot(rootElement).render(App);

  // The app element must be set for all ReactModal instances
  // read more: https://reactcommunity.org/react-modal/accessibility/#app-element
  ReactModal.setAppElement(rootElement);
} else {
  console.error("Root element not found");
}
