import * as Sentry from "@sentry/react";
import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";

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

  // The server reports the original exception with its database stack.
  if (status === 503 && error.response?.data?.code === "database_connection_queue_timeout") {
    return false;
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
      code: error.code,
      timeout_ms: error.config?.timeout,
      has_response: error.response !== undefined,
      transport: classifyAxiosTransport(error),
    },
  });
}

function classifyAxiosTransport(error: AxiosError): "http_response" | "timeout" | "network" | "unknown" {
  if (error.response !== undefined) {
    return "http_response";
  }

  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
    return "timeout";
  }

  if (error.code === "ERR_NETWORK") {
    return "network";
  }

  return "unknown";
}

function isSentryEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.appConfig?.sentry?.enabled === true;
}
