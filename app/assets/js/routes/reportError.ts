import { captureException, captureReactException } from "@sentry/react";
import axios from "axios";
import type { ClientOnErrorFunction } from "react-router";

export const reportError: ClientOnErrorFunction = (error, { errorInfo }) => {
  if (!error) return;
  if (typeof error === "object" && "status" in error && error.status === 404) return;

  console.error(error);

  // Axios interceptors already report request failures.
  if (!window.appConfig.sentry.enabled || axios.isAxiosError(error)) return;

  if (errorInfo) {
    captureReactException(error, errorInfo, { level: "fatal" });
  } else {
    captureException(error, { level: "fatal" });
  }
};
