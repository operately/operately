/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import { QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, useRouteLoaderData, type RouteObject } from "react-router";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import { act } from "@/__tests__/renderHook";
import { companyLayoutInputs, prefetchCompanyLayout } from "@/models/companies/companyLayoutQueries";
import { useCompanyLoaderData } from "./useCompanyLoaderData";
import { logOut } from "./auth";
import { createAppRoutes } from "./index";
import { isPreloadingEnabled } from "./preloading/preloadSession";
import { resetAnalytics } from "@/analytics/session";

jest.mock("axios");
jest.mock("@/analytics/session", () => ({ resetAnalytics: jest.fn() }));
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("react-router", () => ({ ...jest.requireActual("react-router"), useRouteLoaderData: jest.fn() }));
jest.mock("@/pages", () => ({
  __esModule: true,
  default: new Proxy({}, { get: (_, name) => ({ name, Page: () => null, loader: jest.fn() }) }),
}));
jest.mock("@/ee/routes", () => ({ saasAdminRoutes: () => ({ path: "/admin" }) }));
jest.mock("@/pages/SpaceKanbanPage/legacyLoader", () => ({ legacyLoader: jest.fn() }));
jest.mock("./ErrorPage", () => () => null);
jest.mock("@/layouts/NonCompanyLayout", () => () => null);
jest.mock("@/contexts/CurrentCompanyContext", () => ({
  CurrentCompanyProvider: ({ children }: React.PropsWithChildren) => {
    React.useLayoutEffect(() => {
      mockCompanyProviderMounted = true;
      return () => {
        mockCompanyProviderMounted = false;
      };
    }, []);
    return <>{children}</>;
  },
}));
jest.mock("@/contexts/TimezoneContext", () => ({
  TimezoneProvider: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
jest.mock("@/contexts/LanguageContext", () => ({
  LanguageProvider: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
jest.mock("@/contexts/RouteLanguageProvider", () => ({ RouteLanguageProvider: () => null }));
jest.mock("@/layouts/CompanyLayout", () => () => {
  const { company } = useCompanyLoaderData();
  return <div data-test-id="company-layout">{company.name}</div>;
});

let mockCompanyProviderMounted = false;

it("preserves the company page on failed logout and tears it down before successful logout clears its cache", async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  window.appConfig = { billingEnabled: false } as typeof window.appConfig;
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company" });
  jest.mocked(axios.get).mockImplementation(async (url) => ({
    data: url.endsWith("/companies/get")
      ? { company: { id: "company", name: "Original" } }
      : url.endsWith("/list_active")
        ? { messages: [] }
        : { count: 1 },
  }));
  const inputs = companyLayoutInputs();
  await prefetchCompanyLayout(inputs);
  jest.mocked(useRouteLoaderData).mockReturnValue(inputs);
  global.fetch = jest.fn().mockResolvedValue({ status: 401 });

  const createRouter = jest.fn();
  createAppRoutes(createRouter as unknown as typeof createBrowserRouter);
  const routes: RouteObject[] = createRouter.mock.calls[0][0];
  const companyRoute = routes.find(({ id }) => id === "companyRoot");
  const element = companyRoute?.element;
  if (!React.isValidElement(element)) throw new Error("Company route element is missing");
  const container = document.createElement("div");
  const root = createRoot(container);
  const renderRoute = () =>
    root.render(<QueryClientProvider client={queryClient}>{React.cloneElement(element)}</QueryClientProvider>);
  const cachedCompany = () => queryClient.getQueryData(Api.companies.getQueryKey(inputs.companyInput));
  const clear = queryClient.clear.bind(queryClient);
  const mountedAtClear: boolean[] = [];
  jest.spyOn(queryClient, "clear").mockImplementation(() => {
    mountedAtClear.push(mockCompanyProviderMounted);
    clear();
  });

  try {
    act(renderRoute);
    expect(container.querySelector('[data-test-id="company-layout"]')?.textContent).toBe("Original");
    const companyBeforeLogout = cachedCompany();
    await act(async () => {
      expect(await logOut()).toBe("failure");
    });
    act(renderRoute);
    expect(container.querySelector('[data-test-id="company-layout"]')?.textContent).toBe("Original");
    expect(cachedCompany()).toEqual(companyBeforeLogout);
    expect(queryClient.clear).not.toHaveBeenCalled();
    expect(isPreloadingEnabled()).toBe(true);
    expect(resetAnalytics).not.toHaveBeenCalled();

    jest.mocked(global.fetch).mockResolvedValue({ status: 200 } as Response);
    await act(async () => {
      expect(await logOut()).toBe("success");
    });
    // Keep this document alive and rerender the outgoing route before its caller's redirect completes.
    act(renderRoute);
    expect(mountedAtClear).toEqual([false]);
    expect(container.childElementCount).toBe(0);
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(isPreloadingEnabled()).toBe(false);
    expect(resetAnalytics).toHaveBeenCalledTimes(1);
  } finally {
    act(() => root.unmount());
    jest.restoreAllMocks();
    queryClient.clear();
  }
});
