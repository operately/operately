import * as Sentry from "@sentry/react";
import axios, { AxiosError, AxiosHeaders } from "axios";

import { createSentryAxiosClient, installSentryAxiosInterceptor } from "./axiosErrorReporting";

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
      },
    });
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

  it("reports network errors without a response", async () => {
    const client = axios.create();
    installSentryAxiosInterceptor(client);

    const error = new AxiosError("Network Error", "ERR_NETWORK", {
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
          code: "ERR_NETWORK",
          timeout_ms: undefined,
          has_response: false,
          transport: "network",
        }),
      }),
    );
  });

  it.each(["ECONNABORTED", "ETIMEDOUT"])("reports %s as a timeout with bounded metadata", async (code) => {
    const client = installSentryAxiosInterceptor(axios.create());
    const error = new AxiosError(
      "timeout exceeded",
      code,
      {
        headers: new AxiosHeaders({ Authorization: "private-credential" }),
        method: "get",
        url: "/api/v2/spaces/get",
        timeout: 15000,
        params: { id: "private-space" },
        data: { content: "private-payload" },
        auth: { username: "private-user", password: "private-password" },
      },
      { privateRequest: "private-request" },
    );

    await expect(getRejectedHandler(client)(error)).rejects.toBe(error);

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { source: "axios", handled: "true" },
      extra: {
        method: "get",
        url: "/api/v2/spaces/get",
        status: undefined,
        code,
        timeout_ms: 15000,
        has_response: false,
        transport: "timeout",
      },
    });
  });

  it.each([
    ["ECONNABORTED", "timeout"],
    ["ETIMEDOUT", "timeout"],
    ["ERR_NETWORK", "network"],
    ["ERR_UNKNOWN", "unknown"],
    [undefined, "unknown"],
  ])("reports response-less errors with code %s and no configuration", async (code, transport) => {
    const client = installSentryAxiosInterceptor(axios.create());
    const error = new AxiosError("request failed", code);

    await expect(getRejectedHandler(client)(error)).rejects.toBe(error);

    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { source: "axios", handled: "true" },
      extra: {
        method: undefined,
        url: undefined,
        status: undefined,
        code,
        timeout_ms: undefined,
        has_response: false,
        transport,
      },
    });
  });

  it.each(["ERR_BAD_RESPONSE", "ECONNABORTED", "ETIMEDOUT", "ERR_NETWORK"])(
    "classifies HTTP responses separately even with code %s",
    async (code) => {
      const client = installSentryAxiosInterceptor(axios.create());
      const config = { headers: new AxiosHeaders(), method: "post", url: "/api/v2/comments/create", timeout: 0 };
      const error = new AxiosError("request failed", code, config, undefined, {
        status: 500,
        statusText: "Internal Server Error",
        headers: new AxiosHeaders({ "private-header": "private-value" }),
        config,
        data: { content: "private-response" },
      });

      await expect(getRejectedHandler(client)(error)).rejects.toBe(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        tags: { source: "axios", handled: "true" },
        extra: {
          method: "post",
          url: "/api/v2/comments/create",
          status: 500,
          code,
          timeout_ms: 0,
          has_response: true,
          transport: "http_response",
        },
      });
    },
  );

  it("preserves reporting and rejection of non-Axios errors", async () => {
    const client = installSentryAxiosInterceptor(axios.create());
    const error = new Error("unexpected failure");

    await expect(getRejectedHandler(client)(error)).rejects.toBe(error);

    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });

  it.each([undefined, {}, { appConfig: {} }, { appConfig: { sentry: { enabled: false } } }])(
    "preserves rejections without reporting when Sentry is unavailable: %p",
    async (windowValue) => {
      Object.defineProperty(global, "window", { configurable: true, value: windowValue });
      const client = installSentryAxiosInterceptor(axios.create());
      const errors = [new AxiosError("timeout exceeded", "ECONNABORTED"), new Error("unexpected failure")];

      for (const error of errors) {
        await expect(getRejectedHandler(client)(error)).rejects.toBe(error);
      }

      expect(Sentry.captureException).not.toHaveBeenCalled();
    },
  );

  it("instruments upload clients and reports failures once through the request pipeline", async () => {
    const client = createSentryAxiosClient();
    installSentryAxiosInterceptor(client);
    const error = new AxiosError("timeout exceeded", "ETIMEDOUT");
    client.defaults.adapter = () => Promise.reject(error);

    await expect(client.put("/upload")).rejects.toBe(error);

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(Sentry.captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ extra: expect.objectContaining({ code: "ETIMEDOUT", transport: "timeout" }) }),
    );
  });

  it("installs only one interceptor per client", () => {
    const client = axios.create();

    installSentryAxiosInterceptor(client);
    installSentryAxiosInterceptor(client);

    expect(getResponseHandlers(client)).toHaveLength(1);
  });
});
