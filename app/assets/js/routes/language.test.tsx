/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import { act, waitFor } from "@/__tests__/renderHook";
import { applyLanguage, i18n, setupTestCatalog } from "@/__tests__/i18n";
import { createAppRoutes } from "./index";

setupTestCatalog();

// jsdom does not provide Fetch's Request; these routes only issue GET navigations.
beforeAll(() => {
  Object.defineProperty(globalThis, "Request", {
    configurable: true,
    value: class {
      url: string;
      signal?: AbortSignal | null;
      method = "GET";

      constructor(url: string, init: RequestInit = {}) {
        this.url = url;
        this.signal = init.signal;
      }
    },
  });
});

afterAll(() => Reflect.deleteProperty(globalThis, "Request"));

jest.mock("axios");
jest.mock("@/api/socket", () => ({ setHeaders: jest.fn() }));
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("@/features/DevBar/useDevBarData", () => ({ setDevData: jest.fn() }));
jest.mock("@sentry/react", () => ({ captureException: jest.fn() }));
jest.mock("@/contexts/CurrentCompanyContext", () => ({ CurrentCompanyProvider: () => null }));
jest.mock("@/contexts/TimezoneContext", () => ({ TimezoneProvider: () => null }));
jest.mock("@/layouts/CompanyLayout", () => () => null);
jest.mock("@/layouts/NonCompanyLayout", () => {
  const { Outlet } = jest.requireActual("react-router");
  return () => <Outlet />;
});
jest.mock("@/ee/layouts/SaasAdminLayout", () => () => null);
jest.mock("@/ee/pages", () => ({
  __esModule: true,
  default: new Proxy({}, { get: (_, name) => ({ name, Page: () => null, loader: async () => null }) }),
}));
jest.mock("@/pages", () => ({
  __esModule: true,
  default: new Proxy(
    {},
    {
      get: (_, name) => ({
        name,
        Page: () => {
          const { useTranslation } = jest.requireActual("react-i18next");
          const { t } = useTranslation();
          return (
            <div data-test-id="page">
              {t("Loading...")}
              <input data-test-id="draft" defaultValue="" />
            </div>
          );
        },
        loader: async () => null,
      }),
    },
  ),
}));
jest.mock("@/pages/NotFoundPage", () => ({
  __esModule: true,
  default: {
    Page: () => {
      const { useTranslation } = jest.requireActual("react-i18next");
      const { t } = useTranslation();
      return <div data-test-id="not-found">{t("Loading...")}</div>;
    },
  },
}));
jest.mock("turboui", () => ({
  i18nOptions: jest.requireActual("../../../../turboui/src/i18nOptions").i18nOptions,
  ErrorPage: () => {
    const { useTranslation } = jest.requireActual("react-i18next");
    const { t } = useTranslation();
    return <div data-test-id="server-error">{t("Loading...")}</div>;
  },
}));

let language = "pt-BR";
let languageFails = false;
let companyStatus = 500;
let root: ReturnType<typeof createRoot>;
let router: ReturnType<typeof createMemoryRouter>;
let container: HTMLDivElement;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  queryClient.clear();
  jest.clearAllMocks();
  language = "pt-BR";
  languageFails = false;
  companyStatus = 500;
  window.appConfig = {
    ...window.appConfig,
    environment: "prod",
    account: { id: 1 },
    configured: true,
  };
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "old-company" });
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.mocked(axios.get).mockImplementation(async (url) => {
    if (url.endsWith("/get_language")) {
      if (languageFails) throw new Error("offline");
      return { data: { language } };
    }
    throw { status: companyStatus };
  });
  container = document.createElement("div");
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  router?.dispose();
  queryClient.clear();
  jest.restoreAllMocks();
});

async function visit(path: string) {
  router = createAppRoutes(((routes) =>
    createMemoryRouter(routes, {
      initialEntries: [path],
    })) as typeof import("react-router").createBrowserRouter) as ReturnType<typeof createMemoryRouter>;
  await act(async () =>
    root.render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  );
}

it.each(["/billing/pick-company", "/public/documents/token"])(
  "resolves Portuguese on direct navigation to %s",
  async (path) => {
    await visit(path);
    await waitFor(() => expect(container.textContent).toBe("Carregando..."));
    const request = jest.mocked(axios.get).mock.calls.find(([url]) => url.endsWith("/get_language"));
    expect(request?.[1]?.headers).not.toHaveProperty("x-company-id");
    expect(request?.[1]?.params).not.toHaveProperty("company_id");
    expect(Api.default.getHeaders()).toEqual({ "x-company-id": "old-company" });
  },
);

it("refreshes account language on navigation and clears inherited Portuguese for anonymous/flag-off pages", async () => {
  await visit("/billing/pick-company");
  await waitFor(() => expect(container.textContent).toBe("Carregando..."));
  language = "en";
  await act(async () => {
    await router.navigate("/public/documents/token");
  });
  await waitFor(() => expect(container.textContent).toBe("Loading..."));
  expect(i18n.language).toBe("en");
});

it.each([404, 500])("resolves the route company's language when its loader fails with %s", async (status) => {
  companyStatus = status;
  await visit("/company");
  await waitFor(() => expect(container.textContent).toBe("Carregando..."));
  expect(
    container.querySelector(status === 404 ? '[data-test-id="not-found"]' : '[data-test-id="server-error"]'),
  ).not.toBeNull();
  const request = jest.mocked(axios.get).mock.calls.find(([url]) => url.endsWith("/get_language"));
  expect(request?.[1]?.params).toEqual({ company_id: "company" });
  expect(request?.[1]?.headers).not.toHaveProperty("x-company-id");
});

it.each([false, true])(
  "falls back to English when the company is unavailable or language lookup fails (%s)",
  async (fails) => {
    await applyLanguage("pt-BR");
    language = "en";
    languageFails = fails;
    await visit("/unknown-company");
    await waitFor(() => expect(container.textContent).toBe("Loading..."));
    expect(i18n.language).toBe("en");
  },
);

it("does not display stale copy while resolving language or apply an abandoned route's response", async () => {
  await applyLanguage("pt-BR");
  let finishLookup: (value: { data: { language: string } }) => void = () => {
    throw new Error("lookup not started");
  };
  jest.mocked(axios.get).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finishLookup = resolve;
      }),
  );
  await visit("/public/documents/token");
  await waitFor(() => expect(axios.get).toHaveBeenCalled());
  expect(container.textContent).toBe("");

  language = "en";
  await act(async () => {
    await router.navigate("/billing/pick-company");
  });
  await waitFor(() => expect(container.textContent).toBe("Loading..."));
  await act(async () => {
    finishLookup({ data: { language: "pt-BR" } });
  });
  expect(i18n.language).toBe("en");
  expect(container.textContent).toBe("Loading...");
});

it("preserves page state while resolving language after query-string navigation", async () => {
  await visit("/billing/pick-company");
  await waitFor(() => expect(container.textContent).toBe("Carregando..."));
  const input = container.querySelector<HTMLInputElement>('[data-test-id="draft"]');
  if (!input) throw new Error("Draft input is missing");
  input.value = "Unsaved changes";

  let finishLookup: (value: { data: { language: string } }) => void = () => {
    throw new Error("lookup not started");
  };
  jest.mocked(axios.get).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finishLookup = resolve;
      }),
  );
  const requestsBeforeNavigation = jest.mocked(axios.get).mock.calls.length;
  await act(async () => {
    await router.navigate("/billing/pick-company?plan=business");
  });
  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(requestsBeforeNavigation + 1));

  expect(container.querySelector('[data-test-id="draft"]')).toBe(input);
  expect(input.closest("[hidden]")).not.toBeNull();

  await act(async () => {
    finishLookup({ data: { language: "en" } });
  });
  await waitFor(() => expect(container.textContent).toBe("Loading..."));
  expect(container.querySelector('[data-test-id="draft"]')).toBe(input);
  expect(input.value).toBe("Unsaved changes");
  expect(input.closest("[hidden]")).toBeNull();
});

it("resolves the operator account language without using the inspected company's ID", async () => {
  await visit("/admin/companies/target-company");
  await waitFor(() => expect(i18n.language).toBe("pt-BR"));
  const request = jest.mocked(axios.get).mock.calls.find(([url]) => url.endsWith("/get_language"));
  expect(request).toBeDefined();
  expect(request?.[1]?.params).not.toHaveProperty("company_id");
  expect(request?.[1]?.headers).not.toHaveProperty("x-company-id");
});
