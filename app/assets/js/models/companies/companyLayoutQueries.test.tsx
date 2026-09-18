/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { queryClient, useLoadedQuery } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import {
  companyLayoutInputs,
  prefetchCompanyLayout,
  useCompanyLayoutQueries,
  useRefreshCompanyLayout,
} from "./companyLayoutQueries";
import { useEditCompany } from "./companyLifecycle";

jest.mock("axios");
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
beforeEach(() => {
  queryClient.clear();
  jest.resetAllMocks();
  window.appConfig = { billingEnabled: true } as typeof window.appConfig;
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company" });
});
afterEach(() => queryClient.clear());
function responses(name: string, status: string, count: number) {
  jest.mocked(axios.get).mockImplementation(async (url) => ({
    data: url.endsWith("/companies/get")
      ? { company: { id: "company", name } }
      : url.endsWith("/count_by_access_level")
        ? { count }
        : url.endsWith("/list_active")
          ? { messages: [{ id: name }] }
          : { accessState: { status } },
  }));
}

it("refreshes the layout's subscribed data for a billing signal without unrelated queries", async () => {
  responses("Before", "active", 1);
  const inputs = companyLayoutInputs();
  await prefetchCompanyLayout(inputs);
  const unrelated = Api.notifications.listQueryKey({ page: 1 });
  queryClient.setQueryData(unrelated, {});
  const { result } = renderHook(
    () => ({ data: useCompanyLayoutQueries(inputs), refresh: useRefreshCompanyLayout(inputs) }),
    { initialProps: undefined, wrapper },
  );
  responses("After", "read_only", 0);
  await act(() => result.current.refresh());
  await waitFor(() => expect(result.current.data.company.name).toBe("After"));
  expect(result.current.data.billingAccessState).toMatchObject({ status: "read_only" });
  expect(result.current.data.siteMessages).toEqual([{ id: "After" }]);
  expect(result.current.data.canAddProject).toBe(false);
  expect(axios.get).toHaveBeenCalledTimes(8);
  expect(queryClient.getQueryState(unrelated)?.isInvalidated).toBe(false);
});

it("updates the layout after renaming without router revalidation", async () => {
  responses("Before", "active", 1);
  const inputs = companyLayoutInputs();
  await prefetchCompanyLayout(inputs);
  const { result } = renderHook(() => ({ data: useCompanyLayoutQueries(inputs), edit: useEditCompany() }), {
    initialProps: undefined,
    wrapper,
  });
  responses("Renamed", "active", 1);
  jest.mocked(axios.post).mockResolvedValue({ data: {} });
  await act(async () => {
    await result.current.edit.mutateAsync({ name: "Renamed" });
  });
  await waitFor(() => expect(result.current.data.company.name).toBe("Renamed"));
  expect(axios.get).toHaveBeenCalledTimes(5);
});

it("keeps optional errors nonfatal after a previously successful read", async () => {
  responses("Before", "active", 1);
  const inputs = companyLayoutInputs();
  await prefetchCompanyLayout(inputs);
  const { result } = renderHook(
    () => ({ data: useCompanyLayoutQueries(inputs), refresh: useRefreshCompanyLayout(inputs) }),
    { initialProps: undefined, wrapper },
  );
  jest.mocked(axios.get).mockImplementation(async (url) => {
    if (url.endsWith("/list_active") || url.endsWith("/get_access_state")) throw new Error("offline");
    return { data: url.endsWith("/companies/get") ? { company: { id: "company", name: "Before" } } : { count: 1 } };
  });
  await act(() => result.current.refresh());
  await waitFor(() => expect(result.current.data.siteMessages).toEqual([]));
  expect(result.current.data.billingAccessState).toBeNull();
  expect(result.current.data.company.name).toBe("Before");
  expect(queryClient.getQueryData(Api.site_messages.listActiveQueryKey({}))).toEqual({ messages: [{ id: "Before" }] });
});

it("anchors even a new outgoing consumer to the loader's captured company", async () => {
  responses("Before", "active", 1);
  const inputs = companyLayoutInputs();
  await prefetchCompanyLayout(inputs);
  const overviewOptions = Api.billing.getQueryOptions({});
  queryClient.setQueryData(Api.billing.getQueryKey({}), { billing: { account: { status: "free" } } });
  Api.default.setHeaders({ "x-company-id": "destination" });
  const { result } = renderHook(
    () => ({
      data: useCompanyLayoutQueries(inputs),
      overview: useLoadedQuery(overviewOptions),
      refresh: useRefreshCompanyLayout(inputs),
    }),
    { initialProps: undefined, wrapper },
  );
  await act(() => result.current.refresh());
  expect(result.current.data.company.name).toBe("Before");
  expect(axios.get).toHaveBeenCalledTimes(4);
  expect(queryClient.getQueryData(Api.companies.getQueryKey(inputs.companyInput))).toBeUndefined();
});

it("refreshes the mounted billing overview when the layout receives a billing update", async () => {
  responses("Company", "active", 1);
  const inputs = companyLayoutInputs();
  await prefetchCompanyLayout(inputs);
  const overviewOptions = Api.billing.getQueryOptions({});
  queryClient.setQueryData(Api.billing.getQueryKey({}), { billing: { account: { status: "free" } } });
  const { result } = renderHook(
    () => ({
      overview: useLoadedQuery(overviewOptions),
      refresh: useRefreshCompanyLayout(inputs),
    }),
    { initialProps: undefined, wrapper },
  );
  jest.mocked(axios.get).mockResolvedValue({ data: { billing: { account: { status: "active" } } } });
  await act(() => result.current.refresh());
  await waitFor(() => expect(result.current.overview.data?.billing.account.status).toBe("active"));
});
