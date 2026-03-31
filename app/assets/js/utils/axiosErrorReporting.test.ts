import * as Sentry from "@sentry/react";
import axios from "axios";

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

  it("reports network errors without a response", async () => {
    const client = axios.create();
    installSentryAxiosInterceptor(client);

    const error = {
      isAxiosError: true,
      config: { method: "get", url: "/api/v2/projects/get" },
      message: "Network Error",
    };

    await expect(getRejectedHandler(client)(error)).rejects.toBe(error);

    expect(Sentry.captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        extra: expect.objectContaining({
          method: "get",
          url: "/api/v2/projects/get",
          status: undefined,
        }),
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
