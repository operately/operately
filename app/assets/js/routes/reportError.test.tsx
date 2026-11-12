/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider, type ClientOnErrorFunction } from "react-router";
import { captureException, captureReactException } from "@sentry/react";
import { AxiosError } from "axios";
import { act } from "@/__tests__/renderHook";
import { reportError } from "./reportError";

jest.mock("@sentry/react", () => ({
  captureException: jest.fn(),
  captureReactException: jest.fn(),
}));

const routeInfo: Parameters<ClientOnErrorFunction>[1] = {
  location: { pathname: "/", search: "", hash: "", state: null, key: "default" },
  params: {},
  pattern: "/",
};

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  window.appConfig = { sentry: { enabled: true } } as typeof window.appConfig;
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

it.each(["render", "commit"])("reports %s failures with the React component stack", async (phase) => {
  const error = new Error("page failed");

  function BrokenPage() {
    React.useLayoutEffect(() => {
      if (phase === "commit") throw error;
    }, []);
    if (phase === "render") throw error;
    return null;
  }

  const router = createMemoryRouter([
    { path: "/", element: <BrokenPage />, errorElement: <div data-test-id="fallback" /> },
  ]);
  const element = document.createElement("div");
  const root = createRoot(element);

  try {
    await act(async () => root.render(<RouterProvider router={router} onError={reportError} />));

    expect(element.querySelector('[data-test-id="fallback"]')).not.toBeNull();
    expect(captureReactException).toHaveBeenCalledTimes(1);
    expect(captureReactException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ componentStack: expect.stringContaining("BrokenPage") }),
      { level: "fatal" },
    );
    expect(captureException).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
    router.dispose();
  }
});

it("reports loader errors without a component stack", () => {
  const error = new Error("loader failed");

  reportError(error, routeInfo);

  expect(captureException).toHaveBeenCalledWith(error, { level: "fatal" });
  expect(captureReactException).not.toHaveBeenCalled();
});

it.each([new AxiosError("request failed"), { status: 404 }])(
  "skips already-reported requests and not-found errors (%#)",
  (error) => {
    reportError(error, routeInfo);

    expect(captureException).not.toHaveBeenCalled();
    expect(captureReactException).not.toHaveBeenCalled();
  },
);

it("does not report when Sentry is disabled", () => {
  window.appConfig.sentry.enabled = false;

  reportError(new Error("page failed"), { ...routeInfo, errorInfo: { componentStack: "\n    at BrokenPage" } });

  expect(captureException).not.toHaveBeenCalled();
  expect(captureReactException).not.toHaveBeenCalled();
});
