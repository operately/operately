import { setupTestErrorLogger } from "@/utils/errorLogger";
setupTestErrorLogger();

import React from "react";
import { createRoot } from "react-dom/client";

import * as Signals from "@/signals";
import * as Sentry from "@sentry/react";
import axios from "axios";
import {
  createBrowserRouter,
  createRoutesFromChildren,
  matchRoutes,
  RouterProvider,
  useLocation,
  useNavigationType,
} from "react-router";

import { createAppRoutes } from "./routes";
import { ThemeProvider } from "@/contexts/ThemeContext";

import Api from "@/api";
import AdminApi from "@/ee/admin_api";
import "./i18n";

import "@/api/socket";
import ReactModal from "react-modal";
import { ToasterBar } from "turboui";
import { installSentryAxiosInterceptor } from "@/utils/axiosErrorReporting";

Api.default.setBasePath("/api/v2");
AdminApi.default.setBasePath("/admin/api/v1");

Signals.init();

if (window.appConfig.sentry.enabled) {
  Sentry.init({
    dsn: window.appConfig.sentry.dsn,
    release: window.appConfig.version,
    integrations: [
      Sentry.reactRouterV7BrowserTracingIntegration({
        useEffect: React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
    ],
    tracesSampleRate: 0,
  });

  installSentryAxiosInterceptor(axios);
}

const createRouter = window.appConfig.sentry.enabled
  ? Sentry.wrapCreateBrowserRouterV7(createBrowserRouter)
  : createBrowserRouter;
const routes = createAppRoutes(createRouter);

const rootElement: HTMLElement | null = document.getElementById("root");

const App: JSX.Element = (
  <React.StrictMode>
    <ToasterBar />
    <ThemeProvider>
      <RouterProvider router={routes} />
    </ThemeProvider>
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
