/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import * as Socket from "@/api/socket";
import { queryClient } from "@/api/queryClient";
import { QueryClientProvider, focusManager } from "@tanstack/react-query";
import { useRouteLoaderData } from "react-router";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import { checkAuth } from "./pageRoute";
import { companyLoader } from "./companyLoader";
import { useCompanyLoaderData } from "./useCompanyLoaderData";

jest.mock("axios");
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("@/api/socket", () => ({ setHeaders: jest.fn() }));
jest.mock("./pageRoute", () => ({ checkAuth: jest.fn() }));
jest.mock("react-router", () => ({ useRouteLoaderData: jest.fn() }));
jest.mock("turboui", () => ({}));
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
const load = (companyId = "company") => companyLoader({ params: { companyId } });
function respond(url: string, companyId = "company") {
  if (url.endsWith("/companies/get")) return { company: { id: `canonical-${companyId}`, name: companyId } };
  if (url.endsWith("/count_by_access_level")) return { count: 1 };
  if (url.endsWith("/list_active")) return { messages: [{ id: "message" }] };
  return { accessState: { status: "active" } };
}
beforeEach(() => {
  queryClient.clear();
  jest.resetAllMocks();
  window.appConfig = { billingEnabled: true } as typeof window.appConfig;
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({});
  jest.mocked(axios.get).mockImplementation(async (url, config) => ({
    data: respond(url, config?.headers?.["x-company-id"] as string),
  }));
});
afterEach(() => {
  queryClient.clear();
  focusManager.setFocused(undefined);
});

it("prefetches once across concurrent loads, route reentry, and mounting", async () => {
  const [inputs] = await Promise.all([load(), load()]);
  expect(inputs).toMatchObject({ companyId: "canonical-company" });
  expect(inputs).not.toHaveProperty("company");
  expect(Socket.setHeaders).toHaveBeenCalledWith({ "x-company-id": "company" });
  jest.mocked(useRouteLoaderData).mockReturnValue(inputs);
  const { result } = renderHook(useCompanyLoaderData, { initialProps: undefined, wrapper });
  await load();
  expect(axios.get).toHaveBeenCalledTimes(4);
  expect(result.current.company.name).toBe("company");
  expect(result.current.canAddProject).toBe(true);
  expect(result.current.canAddGoal).toBe(true);
  expect(result.current.siteMessages).toEqual([{ id: "message" }]);
});

it("observes invalidated company names and creation permissions", async () => {
  jest.mocked(useRouteLoaderData).mockReturnValue(await load());
  const { result } = renderHook(useCompanyLoaderData, { initialProps: undefined, wrapper });
  jest.mocked(axios.get).mockImplementation(async (url) => ({
    data: url.endsWith("/companies/get") ? { company: { id: "canonical-company", name: "Renamed" } } : { count: 0 },
  }));
  await act(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: Api.companies.getQueryKeyPrefix() }),
      queryClient.invalidateQueries({ queryKey: Api.spaces.countByAccessLevelQueryKeyPrefix() }),
    ]);
  });
  await waitFor(() => expect(result.current.company.name).toBe("Renamed"));
  expect(result.current.canAddProject).toBe(false);
  expect(result.current.canAddGoal).toBe(false);
});

it("skips billing entirely when disabled", async () => {
  window.appConfig.billingEnabled = false;
  jest.mocked(useRouteLoaderData).mockReturnValue(await load());
  const { result } = renderHook(useCompanyLoaderData, { initialProps: undefined, wrapper });
  expect(result.current.billingAccessState).toBeNull();
  expect(axios.get).toHaveBeenCalledTimes(3);
});

it("tolerates optional failures without caching fabricated responses and recovers", async () => {
  jest.mocked(axios.get).mockImplementation(async (url) => {
    if (url.endsWith("/list_active") || url.endsWith("/get_access_state")) throw new Error("offline");
    return { data: respond(url) };
  });
  jest.mocked(useRouteLoaderData).mockReturnValue(await load());
  const { result } = renderHook(useCompanyLoaderData, { initialProps: undefined, wrapper });
  expect(result.current.siteMessages).toEqual([]);
  expect(result.current.billingAccessState).toBeNull();
  expect(queryClient.getQueryData(Api.site_messages.listActiveQueryKey({}))).toBeUndefined();
  expect(queryClient.getQueryData(Api.billing.getAccessStateQueryKey({}))).toBeUndefined();
  jest.mocked(axios.get).mockImplementation(async (url) => ({ data: respond(url) }));
  await act(async () => {
    await load();
  });
  await waitFor(() => expect(result.current.siteMessages).toEqual([{ id: "message" }]));
  expect(result.current.billingAccessState).toEqual({ status: "active" });
});

it.each(["/companies/get", "/count_by_access_level"])("propagates required failures from %s", async (endpoint) => {
  jest.mocked(axios.get).mockImplementation(async (url) => {
    if (url.endsWith(endpoint)) throw { status: 500 };
    return { data: respond(url) };
  });
  await expect(load()).rejects.toMatchObject({ status: 500 });
});

it("normalizes invalid company errors to 404", async () => {
  jest.mocked(axios.get).mockRejectedValue({ status: 400 });
  await expect(load()).rejects.toMatchObject({ status: 404 });
});

it("checks authentication before changing headers or requesting data", async () => {
  jest.mocked(checkAuth).mockImplementation(() => {
    throw new Error("unauthorized");
  });
  await expect(load()).rejects.toThrow("unauthorized");
  expect(Socket.setHeaders).not.toHaveBeenCalled();
  expect(Api.default.getHeaders()).toEqual({});
  expect(axios.get).not.toHaveBeenCalled();
});

it("keeps the outgoing company's data and suppresses its reads after headers change", async () => {
  jest.mocked(useRouteLoaderData).mockReturnValue(await load());
  const key = Api.companies.getQueryKey({ includeOwners: true, includePermissions: true });
  const { result, rerender } = renderHook(useCompanyLoaderData, { initialProps: undefined, wrapper });
  Api.default.setHeaders({ "x-company-id": "other" });
  // Invalidation/focus can happen before React renders the new route.
  await act(async () => {
    await queryClient.invalidateQueries({ queryKey: key });
    focusManager.setFocused(false);
    focusManager.setFocused(true);
  });
  rerender(undefined);
  expect(result.current.company.name).toBe("company");
  expect(axios.get).toHaveBeenCalledTimes(4);
  const destination = await load("other");
  jest.mocked(useRouteLoaderData).mockReturnValue(destination);
  rerender(undefined);
  expect(result.current.company.name).toBe("other");
  expect(queryClient.getQueryData(key)).toMatchObject({ company: { name: "company" } });
  expect(axios.get).toHaveBeenCalledTimes(8);
});

it("does not fetch the interrupted company's billing under new headers", async () => {
  let resolveCompany: (response: unknown) => void = () => {
    throw new Error("Request not started");
  };
  jest.mocked(axios.get).mockImplementation(async (url, config) => {
    const companyId = config?.headers?.["x-company-id"] as string;
    if (url.endsWith("/companies/get") && companyId === "company") {
      return new Promise((resolve) => {
        resolveCompany = resolve;
      });
    }
    return { data: respond(url, companyId) };
  });
  const interrupted = load();
  await load("destination");
  resolveCompany({ data: respond("/companies/get", "company") });
  const inputs = await interrupted;
  expect(inputs.companyId).toBe("canonical-company");
  const billingRequests = jest.mocked(axios.get).mock.calls.filter(([url]) => url.endsWith("/get_access_state"));
  expect(billingRequests).toHaveLength(1);
  expect(billingRequests[0]?.[1]?.headers).toEqual({ "x-company-id": "destination" });
});
