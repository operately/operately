/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "@/__tests__/renderHook";
import { useRouteError, useRouteLoaderData } from "react-router";
import ErrorPage from "./ErrorPage";

jest.mock("react-router", () => ({ useRouteError: jest.fn(), useRouteLoaderData: jest.fn() }));
jest.mock("@/pages/NotFoundPage", () => ({
  __esModule: true,
  default: { Page: () => <div data-test-id="not-found" /> },
}));
jest.mock("@sentry/react", () => ({ captureException: jest.fn() }));
jest.mock("turboui", () => ({ GhostButton: ({ linkTo, children }) => <a href={linkTo}>{children}</a> }));

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

it.each([
  [{ companyId: "canonical-company" }, "/canonical-company"],
  [undefined, "/"],
])("links server errors back to the loaded company or lobby", async (metadata, href) => {
  window.appConfig = { environment: "prod" } as typeof window.appConfig;
  jest.mocked(useRouteLoaderData).mockReturnValue(metadata);
  jest.mocked(useRouteError).mockReturnValue(new Error("failed"));
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  const element = document.createElement("div");
  const root = createRoot(element);
  try {
    await act(async () => root.render(<ErrorPage />));
    expect(element.querySelector("a")?.getAttribute("href")).toBe(href);
  } finally {
    await act(async () => root.unmount());
    log.mockRestore();
  }
});

it("preserves not-found rendering without company loader data", async () => {
  jest.mocked(useRouteLoaderData).mockReturnValue(undefined);
  jest.mocked(useRouteError).mockReturnValue({ status: 404 });
  const element = document.createElement("div");
  const root = createRoot(element);
  try {
    await act(async () => root.render(<ErrorPage />));
    expect(element.querySelector('[data-test-id="not-found"]')).not.toBeNull();
  } finally {
    await act(async () => root.unmount());
  }
});
