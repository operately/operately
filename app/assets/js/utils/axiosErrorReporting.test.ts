import * as Sentry from "@sentry/react";
import axios, { AxiosError, AxiosHeaders, CanceledError } from "axios";

import { installSentryAxiosInterceptor } from "./axiosErrorReporting";

jest.mock("@sentry/react", () => ({
  captureException: jest.fn(),
}));

function getResponseHandlers(client: any) {
  return client.interceptors.response.handlers.filter(Boolean);
}

function getRejectedHandler(client: any) {
  const handlers = getResponseHandlers(client);
  const latest = handlers[handlers.length - 1];

  if (!latest?.rejected) {
    throw new Error("Missing axios rejection handler");
  }

  return latest.rejected;
}

describe("installSentryAxiosInterceptor", () => {
  beforeEach(() => {
    jest.mocked(Sentry.captureException).mockReset();

    Object.defineProperty(global, "window", {
      configurable: true,
      value: {
        appConfig: {
          sentry: {
            enabled: true,
          },
        },
        navigator: { onLine: true },
        document: { visibilityState: "visible" },
      },
    });
  });

  it("ignores explicit cancellations and preserves the rejection", async () => {
    const client = installSentryAxiosInterceptor(axios.create());
    const error = new CanceledError();

    await expect(getRejectedHandler(client)(error)).rejects.toBe(error);

    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("reports non-404 axios errors and preserves the rejection", async () => {
    const client = axios.create();
    installSentryAxiosInterceptor(client);

    const error = {
      isAxiosError: true,
      response: { status: 500 },
      config: { method: "post", url: "/api/v2/comments/create" },
    };

    await expect(getRejectedHandler(client)(error)).rejects.toBe(error);

    expect(Sentry.captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        tags: expect.objectContaining({ source: "axios", handled: "true" }),
        extra: expect.objectContaining({
          method: "post",
          url: "/api/v2/comments/create",
          status: 500,
        }),
      }),
    );
  });

  it("ignores axios 404 errors", async () => {
    const client = axios.create();
    installSentryAxiosInterceptor(client);

    const error = {
      isAxiosError: true,
      response: { status: 404 },
      config: { method: "get", url: "/api/v2/projects/get" },
    };

    await expect(getRejectedHandler(client)(error)).rejects.toBe(error);

    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it.each([401, 403, 410])("ignores axios %s errors", async (status) => {
    const client = axios.create();
    installSentryAxiosInterceptor(client);

    const error = {
      isAxiosError: true,
      response: { status },
      config: { method: "get", url: "/api/v2/projects/get" },
    };

    await expect(getRejectedHandler(client)(error)).rejects.toBe(error);

    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it.each([
    [503, "database_connection_queue_timeout", false],
    [503, "unknown_failure", true],
    [500, "database_connection_queue_timeout", true],
  ])("handles status %s and code %s without duplicating confirmed queue reports", async (status, code, report) => {
    const client = installSentryAxiosInterceptor(axios.create());
    const error = { isAxiosError: true, response: { status, data: { code } } };

    await expect(getRejectedHandler(client)(error)).rejects.toBe(error);
    expect(Sentry.captureException).toHaveBeenCalledTimes(report ? 1 : 0);
  });

  it.each([
    ["Network Error", AxiosError.ERR_NETWORK],
    ["Request aborted", AxiosError.ECONNABORTED],
    ["timeout of 5000ms exceeded", AxiosError.ECONNABORTED],
    ["timeout of 5000ms exceeded", AxiosError.ETIMEDOUT],
  ])("reports %s (%s) without a response", async (message, code) => {
    const client = axios.create();
    installSentryAxiosInterceptor(client);

    const error = new AxiosError(message, code, {
      headers: new AxiosHeaders(),
      method: "get",
      url: "/api/v2/projects/get",
    });

    await expect(getRejectedHandler(client)(error)).rejects.toBe(error);

    expect(Sentry.captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        extra: expect.objectContaining({
          method: "get",
          url: "/api/v2/projects/get",
          status: undefined,
          code,
        }),
      }),
    );
  });

  it.each([
    { online: true, visibilityState: "visible", signalAborted: false },
    { online: false, visibilityState: "hidden", signalAborted: true },
  ])("includes diagnostic context: %j", async ({ online, visibilityState, signalAborted }) => {
    Object.defineProperty(window.navigator, "onLine", { value: online });
    Object.defineProperty(window.document, "visibilityState", { value: visibilityState });
    const controller = new AbortController();
    if (signalAborted) controller.abort();

    const client = installSentryAxiosInterceptor(axios.create());
    const error = new AxiosError("Network Error", AxiosError.ERR_NETWORK, {
      headers: new AxiosHeaders({ Authorization: "secret" }),
      data: { password: "secret" },
      method: "get",
      url: "/api/v2/get_language",
      timeout: 5000,
      signal: controller.signal,
    });

    await expect(getRejectedHandler(client)(error)).rejects.toBe(error);

    expect(Sentry.captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        extra: {
          method: "get",
          url: "/api/v2/get_language",
          status: undefined,
          code: AxiosError.ERR_NETWORK,
          timeout: 5000,
          signalAborted,
          online,
          visibilityState,
        },
      }),
    );
  });

  it("installs only one interceptor per client", () => {
    const client = axios.create();

    installSentryAxiosInterceptor(client);
    installSentryAxiosInterceptor(client);

    expect(getResponseHandlers(client)).toHaveLength(1);
  });
});
