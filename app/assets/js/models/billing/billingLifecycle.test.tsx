/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api, { type BillingOverview } from "@/api";
import { queryClient } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import { useBillingActions } from "./billingLifecycle";

jest.mock("axios");
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
const billing = { account: { status: "active", cancelAtPeriodEnd: false } } as BillingOverview;
const target = {
  plan: "team",
  billingInterval: "monthly" as const,
  product: {} as BillingOverview["catalogProducts"][number],
};

beforeEach(() => {
  queryClient.clear();
  jest.clearAllMocks();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company" });
});
afterEach(() => queryClient.clear());

it.each([
  ["changePlan", "/billing/change_plan", { plan: "team", billing_interval: "monthly" }],
  ["cancelSubscription", "/billing/cancel", {}],
  ["reactivateSubscription", "/billing/reactivate", {}],
] as const)("%s preserves its result and updates cached billing", async (action, path, input) => {
  const accessKey = Api.billing.getAccessStateQueryKey({});
  queryClient.setQueryData(accessKey, {});
  jest.mocked(axios.post).mockResolvedValue({ data: { billing } });
  const { result } = renderHook(useBillingActions, { initialProps: undefined, wrapper });
  await act(async () => {
    expect(await result.current[action](target)).toEqual({ outcome: "billing_updated", billing });
  });
  expect(axios.post).toHaveBeenCalledWith(`/api/v2${path}`, input, { headers: { "x-company-id": "company" } });
  expect(queryClient.getQueryData(Api.billing.getQueryKey({}))).toEqual({ billing });
  expect(queryClient.getQueryState(accessKey)?.isInvalidated).toBe(true);
});

it("refreshes billing and synchronizes the query cache", async () => {
  const accessKey = Api.billing.getAccessStateQueryKey({});
  queryClient.setQueryData(accessKey, {});
  jest.mocked(axios.post).mockResolvedValue({ data: { billing } });
  const { result } = renderHook(useBillingActions, { initialProps: undefined, wrapper });
  await act(async () => expect(await result.current.refreshBilling({})).toEqual(billing));
  expect(axios.post).toHaveBeenCalledWith("/api/v2/billing/refresh", {}, expect.anything());
  expect(queryClient.getQueryData(Api.billing.getQueryKey({}))).toEqual({ billing });
  expect(queryClient.getQueryState(accessKey)?.isInvalidated).toBe(true);
});

it("invalidates billing after creating checkout and preserves the external session", async () => {
  const key = Api.billing.getQueryKey({});
  queryClient.setQueryData(key, { billing });
  const session = { url: "https://polar.sh/checkout/test" };
  jest.mocked(axios.post).mockResolvedValue({ data: { session } });
  const { result } = renderHook(useBillingActions, { initialProps: undefined, wrapper });
  await act(async () =>
    expect(await result.current.beginCheckout(target)).toEqual({ outcome: "session_created", session }),
  );
  expect(axios.post).toHaveBeenCalledWith(
    "/api/v2/billing/create_checkout_session",
    { plan: "team", billing_interval: "monthly" },
    expect.anything(),
  );
  expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true);
});

it.each(["beginCheckout", "changePlan"] as const)(
  "%s preserves missing and unavailable target results without requests",
  async (action) => {
    const { result } = renderHook(useBillingActions, { initialProps: undefined, wrapper });
    await expect(result.current[action](null)).resolves.toEqual({ outcome: "missing_target" });
    await expect(result.current[action]({ ...target, product: null })).resolves.toEqual({
      outcome: "target_unavailable",
    });
    expect(axios.post).not.toHaveBeenCalled();
  },
);

it.each([
  ["beginPaymentMethodSession", "create_payment_method_session"],
  ["beginCustomerPortalSession", "create_customer_portal_session"],
] as const)("%s preserves the return path and external session", async (action, endpoint) => {
  const session = { url: "https://polar.sh/session/test" };
  jest.mocked(axios.post).mockResolvedValue({ data: { session } });
  const { result } = renderHook(useBillingActions, { initialProps: undefined, wrapper });
  await act(async () =>
    expect(await result.current[action]("/company/admin/billing")).toEqual({ outcome: "session_created", session }),
  );
  expect(axios.post).toHaveBeenCalledWith(
    `/api/v2/billing/${endpoint}`,
    { return_to: "/company/admin/billing" },
    expect.anything(),
  );
});

it("preserves provider errors while caching the recovery refresh", async () => {
  jest
    .mocked(axios.post)
    .mockRejectedValueOnce(new Error("provider unavailable"))
    .mockResolvedValueOnce({ data: { billing } });
  const { result } = renderHook(useBillingActions, { initialProps: undefined, wrapper });
  await act(async () =>
    expect(await result.current.cancelSubscription()).toEqual({ outcome: "provider_error", billing }),
  );
  expect(queryClient.getQueryData(Api.billing.getQueryKey({}))).toEqual({ billing });
});

it("preserves existing cache data when both the operation and recovery refresh fail", async () => {
  queryClient.setQueryData(Api.billing.getQueryKey({}), { billing });
  jest.mocked(axios.post).mockRejectedValue(new Error("offline"));
  const { result } = renderHook(useBillingActions, { initialProps: undefined, wrapper });
  await act(async () => expect(await result.current.cancelSubscription()).toEqual({ outcome: "provider_error" }));
  expect(axios.post).toHaveBeenCalledTimes(2);
  expect(queryClient.getQueryData(Api.billing.getQueryKey({}))).toEqual({ billing });
});

it("writes a mutation response to the originating company after headers change", async () => {
  const originalKey = Api.billing.getQueryKey({});
  const originalAccessKey = Api.billing.getAccessStateQueryKey({});
  queryClient.setQueryData(originalAccessKey, {});
  let resolveResponse: (value: unknown) => void = () => {
    throw new Error("Request has not started");
  };
  jest.mocked(axios.post).mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveResponse = resolve;
      }),
  );
  const { result } = renderHook(useBillingActions, { initialProps: undefined, wrapper });
  let operation: Promise<unknown>;
  act(() => {
    operation = result.current.cancelSubscription();
  });
  await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
  Api.default.setHeaders({ "x-company-id": "other-company" });
  const otherKey = Api.billing.getQueryKey({});
  const otherAccessKey = Api.billing.getAccessStateQueryKey({});
  queryClient.setQueryData(otherAccessKey, {});
  queryClient.setQueryData(otherKey, { billing: { account: { status: "free" } } });
  await act(async () => {
    resolveResponse({ data: { billing } });
    await operation;
  });
  expect(queryClient.getQueryData(originalKey)).toEqual({ billing });
  expect(queryClient.getQueryState(originalAccessKey)?.isInvalidated).toBe(true);
  expect(queryClient.getQueryState(otherAccessKey)?.isInvalidated).toBe(false);
  expect(queryClient.getQueryData(otherKey)).toEqual({ billing: { account: { status: "free" } } });
});

it("does not refresh a different company after a provider failure during navigation", async () => {
  jest.mocked(axios.post).mockImplementation(async () => {
    Api.default.setHeaders({ "x-company-id": "other-company" });
    throw new Error("provider unavailable");
  });
  const { result } = renderHook(useBillingActions, { initialProps: undefined, wrapper });
  await act(async () => expect(await result.current.cancelSubscription()).toEqual({ outcome: "provider_error" }));
  expect(axios.post).toHaveBeenCalledTimes(1);
});

it("prevents an older in-flight read from overwriting a confirmed mutation", async () => {
  let resolveRead: (value: unknown) => void = () => {
    throw new Error("Request has not started");
  };
  jest.mocked(axios.get).mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveRead = resolve;
      }),
  );
  const read = queryClient.fetchQuery(Api.billing.getQueryOptions({})).catch(() => undefined);
  jest.mocked(axios.post).mockResolvedValue({ data: { billing } });
  const { result } = renderHook(useBillingActions, { initialProps: undefined, wrapper });
  await act(async () => {
    await result.current.cancelSubscription();
  });
  resolveRead({ data: { billing: { account: { status: "free" } } } });
  await read;
  expect(queryClient.getQueryData(Api.billing.getQueryKey({}))).toEqual({ billing });
});
