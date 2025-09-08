/**
 * @jest-environment jsdom
 */

import { setupSentryErrorLogger } from "../errorLogger";

// Mock @sentry/react
const mockCaptureException = jest.fn();
jest.mock("@sentry/react", () => ({
  captureException: mockCaptureException
}));

// Create a mock window.appConfig
const mockAppConfig = {
  sentry: { enabled: true },
  environment: "production"
};

Object.defineProperty(window, "appConfig", {
  value: mockAppConfig,
  writable: true
});

describe("setupSentryErrorLogger", () => {
  beforeEach(() => {
    mockCaptureException.mockClear();
    // Reset window.appConfig for each test
    window.appConfig = { ...mockAppConfig };
  });

  test("captures unhandled JavaScript errors when Sentry is enabled", () => {
    setupSentryErrorLogger();

    const testError = new Error("Test error");
    const errorEvent = new ErrorEvent("error", {
      error: testError,
      filename: "test.js",
      lineno: 10,
      colno: 5,
      message: "Test error"
    });

    window.dispatchEvent(errorEvent);

    expect(mockCaptureException).toHaveBeenCalledWith(testError, {
      level: "error",
      tags: {
        error_type: "javascript_error",
        source: "global_error_handler"
      },
      extra: {
        filename: "test.js",
        lineno: 10,
        colno: 5,
        message: "Test error"
      }
    });
  });

  test("captures unhandled promise rejections when Sentry is enabled", () => {
    setupSentryErrorLogger();

    const testReason = "Promise rejection reason";
    const rejectionEvent = new PromiseRejectionEvent("unhandledrejection", {
      promise: Promise.reject(testReason),
      reason: testReason
    });

    window.dispatchEvent(rejectionEvent);

    expect(mockCaptureException).toHaveBeenCalledWith(testReason, {
      level: "error",
      tags: {
        error_type: "unhandled_promise_rejection",
        source: "global_error_handler"
      },
      extra: {
        promise: rejectionEvent.promise
      }
    });
  });

  test("does not setup error handlers when Sentry is disabled", () => {
    window.appConfig.sentry.enabled = false;
    setupSentryErrorLogger();

    const testError = new Error("Test error");
    const errorEvent = new ErrorEvent("error", { error: testError });

    window.dispatchEvent(errorEvent);

    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  test("does not setup error handlers in test environment", () => {
    window.appConfig.environment = "test";
    setupSentryErrorLogger();

    const testError = new Error("Test error");
    const errorEvent = new ErrorEvent("error", { error: testError });

    window.dispatchEvent(errorEvent);

    expect(mockCaptureException).not.toHaveBeenCalled();
  });
});