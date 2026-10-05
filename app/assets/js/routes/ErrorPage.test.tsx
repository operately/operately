/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "@/__tests__/renderHook";
import { MemoryRouter, useRouteError, useRouteLoaderData } from "react-router";
import ErrorPage from "./ErrorPage";
import { applyLanguage, setupTestCatalog } from "@/__tests__/i18n";
import { resolveEffectiveLanguage } from "@/i18n/languages";
import { captureException } from "@sentry/react";

setupTestCatalog();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useRouteError: jest.fn(),
  useRouteLoaderData: jest.fn(),
}));
jest.mock("@/pages/NotFoundPage", () => ({
  __esModule: true,
  default: { Page: () => <div data-test-id="not-found" /> },
}));
jest.mock("@sentry/react", () => ({ captureException: jest.fn() }));
jest.mock("../../../../turboui/node_modules/react", () => jest.requireActual("react"));
jest.mock("../../../../turboui/node_modules/react-router", () => jest.requireActual("react-router"));
jest.mock("../../../../turboui/node_modules/react-i18next", () => jest.requireActual("react-i18next"));
jest.mock("../../../../turboui/node_modules/i18next", () => jest.requireActual("i18next"));
jest.mock("turboui", () => ({
  ...jest.requireActual("../../../../turboui/src/ErrorPage"),
  i18nOptions: jest.requireActual("../../../../turboui/src/i18nOptions").i18nOptions,
}));

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
    await act(async () =>
      root.render(
        <MemoryRouter>
          <ErrorPage />
        </MemoryRouter>,
      ),
    );
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
    await act(async () =>
      root.render(
        <MemoryRouter>
          <ErrorPage />
        </MemoryRouter>,
      ),
    );
    expect(element.querySelector('[data-test-id="not-found"]')).not.toBeNull();
  } finally {
    await act(async () => root.unmount());
  }
});

it.each([
  ["prod", true],
  ["prod", false],
  ["dev", true],
  ["test", true],
] as const)("diagnostics and flag rollback: %s, %s", async (environment, enabled) => {
  await applyLanguage(resolveEffectiveLanguage("pt-BR", enabled));
  window.appConfig = { environment } as typeof window.appConfig;
  jest.mocked(useRouteLoaderData).mockReturnValue({ companyId: "company" });
  const error = new Error("Literal diagnostic");
  error.stack = "Literal <script> & stack";
  jest.mocked(useRouteError).mockReturnValue(error);
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  const element = document.createElement("div");
  const root = createRoot(element);

  try {
    await act(async () =>
      root.render(
        <MemoryRouter>
          <ErrorPage />
        </MemoryRouter>,
      ),
    );

    expect(element.textContent).toContain(enabled ? "Ops! Algo deu errado." : "Oops! Something went wrong.");
    expect(element.querySelector("pre")?.textContent ?? null).toBe(environment === "prod" ? null : error.stack);
    expect(element.querySelector("script")).toBeNull();
    expect(captureException).toHaveBeenCalledWith(error, { level: "fatal" });
  } finally {
    await act(async () => root.unmount());
    log.mockRestore();
  }
});

it("handles missing errors in development without crashing", async () => {
  window.appConfig = { environment: "dev" } as typeof window.appConfig;
  jest.mocked(useRouteError).mockReturnValue(null);
  jest.mocked(useRouteLoaderData).mockReturnValue(undefined);
  const element = document.createElement("div");
  const root = createRoot(element);

  try {
    await act(async () =>
      root.render(
        <MemoryRouter>
          <ErrorPage />
        </MemoryRouter>,
      ),
    );
    expect(element.textContent).toContain("500");
    expect(element.querySelector("pre")?.textContent).toBe("");
  } finally {
    await act(async () => root.unmount());
  }
});
