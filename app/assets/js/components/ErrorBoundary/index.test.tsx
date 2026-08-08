import * as Sentry from "@sentry/react";

import { ErrorBoundary } from "./index";

jest.mock("@sentry/react", () => ({
  captureException: jest.fn(),
}));

function stubSentryEnabled(enabled: boolean) {
  Object.defineProperty(global, "window", {
    configurable: true,
    value: {
      appConfig: {
        sentry: {
          enabled,
        },
      },
    },
  });
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    jest.mocked(Sentry.captureException).mockReset();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("reports to Sentry with componentStack when enabled", () => {
    stubSentryEnabled(true);

    const error = new Error("feed render failed");
    const info = { componentStack: "\n    at ActivityItem" };
    const boundary = new ErrorBoundary({ children: null, fallback: "fallback" });

    boundary.componentDidCatch(error, info);

    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      extra: { componentStack: info.componentStack },
    });
  });

  it("does not report to Sentry when disabled", () => {
    stubSentryEnabled(false);

    const boundary = new ErrorBoundary({ children: null, fallback: "fallback" });
    boundary.componentDidCatch(new Error("feed render failed"), { componentStack: "\n    at ActivityItem" });

    expect(Sentry.captureException).not.toHaveBeenCalled();
  });
});
