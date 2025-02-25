import React from "react";
import { createRoot } from "react-dom/client";

import * as Signals from "@/signals";

import { routes } from "./routes";
import { Router } from "./routes/Router";

import Api from "@/api";
import AdminApi from "@/ee/admin_api";
import "./i18n";

import { setupTestErrorLogger } from "@/utils/errorLogger";

import "@/api/socket";
import ReactModal from "react-modal";

setupTestErrorLogger();

Api.default.setBasePath("/api/v2");
AdminApi.default.setBasePath("/admin/api/v1");

Signals.init();

const rootElement: HTMLElement | null = document.getElementById("root");

const App: JSX.Element = (
  <React.StrictMode>
    <Router routes={routes} />
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
