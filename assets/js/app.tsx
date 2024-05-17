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

import { ApolloProvider } from "@apollo/client";
import client from "./graphql/client";
import "./i18n";

import { ThemeProvider } from "./theme";
import { CurrentUserProvider } from "./contexts/CurrentUserContext";

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
    <ApolloProvider client={client}>
      <CurrentUserProvider>
        <ThemeProvider>
          <RouterProvider router={routes} />
        </ThemeProvider>
      </CurrentUserProvider>
    </ApolloProvider>
  </React.StrictMode>
);

if (rootElement !== null) {
  createRoot(rootElement).render(App);
}
