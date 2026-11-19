/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import { companyLayoutInputs, prefetchCompanyLayout } from "@/models/companies/companyLayoutQueries";
import { useCompanyLoaderData } from "./useCompanyLoaderData";
import { act, waitFor } from "@/__tests__/renderHook";
import { createBrowserRouter, matchRoutes, useRouteLoaderData, type RouteObject } from "react-router";
import { createAppRoutes } from "./index";
import { companyLoader } from "./companyLoader";

jest.mock("@/pages", () => ({
  __esModule: true,
  default: new Proxy({}, { get: (_, name) => ({ name, Page: () => null, loader: jest.fn() }) }),
}));
jest.mock("@/ee/pages", () => ({
  __esModule: true,
  default: new Proxy({}, { get: (_, name) => ({ name, Page: () => null, loader: jest.fn() }) }),
}));
jest.mock("@/features/DevBar/useDevBarData", () => ({ setDevData: jest.fn() }));
let mockProfileReady = false;
jest.mock("axios");
jest.mock("react-router", () => ({ ...jest.requireActual("react-router"), useRouteLoaderData: jest.fn() }));
jest.mock("turboui", () => ({ ContentListSkeleton: () => <div role="status" /> }));
jest.mock("@/contexts/CurrentCompanyContext", () => ({
  CurrentCompanyProvider: ({ children }) => (mockProfileReady ? children : null),
}));
jest.mock("@/contexts/TimezoneContext", () => ({ TimezoneProvider: ({ children }) => children }));
jest.mock("@/contexts/LanguageContext", () => ({ LanguageProvider: ({ children }) => children }));
jest.mock("@/layouts/CompanyLayout", () => () => {
  const { company } = useCompanyLoaderData();
  return <nav data-test-id="company-navigation">{company.name}</nav>;
});
jest.mock("@/layouts/NonCompanyLayout", () => () => null);
jest.mock("@/ee/layouts/SaasAdminLayout", () => () => null);
jest.mock("./ErrorPage", () => () => null);
jest.mock("./companyLoader", () => ({ companyLoader: jest.fn() }));

function routes(): RouteObject[] {
  const createRouter = jest.fn();
  createAppRoutes(createRouter as unknown as typeof createBrowserRouter);
  return createRouter.mock.calls[0][0];
}

it.each([
  "/company-import",
  "/setup",
  "/billing/pick-company",
  "/join",
  "/join/token",
  "/join/token/full",
  "/acme/invite-team",
  "/acme/admin/billing",
  "/acme/admin/billing/plans",
  "/acme/admin/billing/cancel",
  "/acme/spaces/space/kanban",
])("excludes %s from speculative loading without removing its navigation loader", (url) => {
  const matches = matchRoutes(routes(), url);
  expect(matches).not.toBeNull();
  const route = matches?.at(-1)?.route;
  expect(route?.handle.preload).toBe(false);
  expect(route?.loader).toEqual(expect.any(Function));
});

it.each([
  "/acme",
  "/acme/work-map",
  "/acme/spaces/space",
  "/acme/projects/project?tab=tasks",
  "/acme/goals/goal",
  "/admin/email-settings",
])("exposes data loaders for eligible routes such as %s", (url) => {
  const matches = matchRoutes(routes(), url);
  expect(matches?.at(-1)?.route.handle.preload).toBe(true);
  expect(matches?.some(({ route }) => route.handle?.preload === false)).toBe(false);
  expect(matches?.at(-1)?.route.handle.dataLoader).toEqual(expect.any(Function));
});

it("keeps the company layout loader exclusive to navigation", () => {
  const route = routes().find(({ id }) => id === "companyRoot");
  expect(route?.loader).toBe(companyLoader);
  expect(route).toBeDefined();
  expect(route?.handle?.dataLoader).toBeUndefined();
});

it("gates the production company layout after profile loading outlives its prefetched company", async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  queryClient.clear();
  window.appConfig = { billingEnabled: false } as typeof window.appConfig;
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company" });
  const company = { id: "company", name: "Engineering" };
  jest.mocked(axios.get).mockImplementation(async (url) => ({
    data: url.endsWith("/companies/get") ? { company } : url.endsWith("/list_active") ? { messages: [] } : { count: 1 },
  }));
  const inputs = companyLayoutInputs();
  await prefetchCompanyLayout(inputs);
  jest.mocked(useRouteLoaderData).mockReturnValue({ ...inputs, companyId: company.id });
  const container = document.createElement("div");
  const root = createRoot(container);
  const renderRoute = () =>
    root.render(
      <QueryClientProvider client={queryClient}>
        {routes().find(({ id }) => id === "companyRoot")?.element}
      </QueryClientProvider>,
    );
  try {
    mockProfileReady = false;
    act(renderRoute);
    queryClient.removeQueries({ queryKey: Api.companies.getQueryKeyPrefix() });
    let resolveCompany: (response: unknown) => void = () => {
      throw new Error("Request not started");
    };
    jest.mocked(axios.get).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCompany = resolve;
        }),
    );
    mockProfileReady = true;
    act(renderRoute);
    expect(container.querySelector('[role="status"]')).not.toBeNull();
    expect(container.querySelector("nav")).toBeNull();
    await act(async () => resolveCompany({ data: { company } }));
    await waitFor(() => expect(container.querySelector("nav")?.textContent).toBe(company.name));
    expect(container.querySelector('[role="status"]')).toBeNull();
  } finally {
    act(() => root.unmount());
    queryClient.clear();
    mockProfileReady = false;
  }
});
