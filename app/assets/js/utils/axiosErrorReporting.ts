import * as Sentry from "@sentry/react";
import axios, { AxiosInstance, AxiosResponse } from "axios";

const instrumentedClients = new WeakSet<AxiosInstance>();

// 401/403: auth/permission denials (expected app flow)
// 404: missing resource (already excluded)
// 410: stale-client version mismatch reload flow
const IGNORED_AXIOS_STATUSES = new Set([401, 403, 404, 410]);

export function installSentryAxiosInterceptor(client: AxiosInstance): AxiosInstance {
  if (instrumentedClients.has(client)) {
    return client;
  }

  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: unknown) => {
      if (shouldCaptureAxiosError(error)) {
        captureAxiosError(error);
      }

      return Promise.reject(error);
    },
  );

  instrumentedClients.add(client);
  return client;
}

export function createSentryAxiosClient(): AxiosInstance {
  const client = axios.create();
  return installSentryAxiosInterceptor(client);
}

function shouldCaptureAxiosError(error: unknown): boolean {
  if (!isSentryEnabled()) {
    return false;
  }

  if (!axios.isAxiosError(error)) {
    return true;
  }

  const status = error.response?.status;
  if (status === undefined) {
    return true;
  }

  return !IGNORED_AXIOS_STATUSES.has(status);
}

function captureAxiosError(error: unknown) {
  if (!axios.isAxiosError(error)) {
    Sentry.captureException(error);
    return;
  }

  Sentry.captureException(error, {
    tags: {
      source: "axios",
      handled: "true",
    },
    extra: {
      method: error.config?.method,
      url: error.config?.url,
      status: error.response?.status,
    },
  });
}

function isSentryEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.appConfig?.sentry?.enabled === true;
}
