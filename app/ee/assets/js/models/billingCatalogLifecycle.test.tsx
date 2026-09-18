/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import * as AdminApi from "@/ee/admin_api";
import { queryClient, useLoadedQuery } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";

jest.mock("axios");
jest.mock("@/ee/admin_api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
beforeEach(() => {
  queryClient.clear();
  jest.resetAllMocks();
  AdminApi.default.default.setBasePath("/admin/api");
});
afterEach(() => queryClient.clear());
import Api from "@/api";
import * as Catalog from "./billingCatalogLifecycle";
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));

it.each([
  [Catalog.useCreateBillingProduct, "create_billing_product"],
  [Catalog.useUpdateBillingProduct, "update_billing_product"],
  [Catalog.useArchiveBillingProduct, "archive_billing_product"],
  [Catalog.useSetActiveBillingProduct, "set_active_billing_product"],
  [Catalog.useSyncBillingProductsFromPolar, "sync_billing_products_from_polar"],
  [Catalog.useCreateBillingPlanDefinition, "create_billing_plan_definition"],
  [Catalog.useUpdateBillingPlanDefinition, "update_billing_plan_definition"],
  [Catalog.useArchiveBillingPlanDefinition, "archive_billing_plan_definition"],
  [Catalog.useUnarchiveBillingPlanDefinition, "unarchive_billing_plan_definition"],
] as const)("invalidates all catalog views after %s", async (hook, endpoint) => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({});
  const publicCatalog = Api.billing.getCatalogQueryKey({});
  Api.default.setHeaders({ "x-company-id": "company" });
  const companyBilling = Api.billing.getQueryKey({});
  const affected = [
    AdminApi.listBillingProductsQueryKey({}),
    AdminApi.listBillingPlanDefinitionsQueryKey({}),
    publicCatalog,
    companyBilling,
  ];
  affected.forEach((key) => queryClient.setQueryData(key, {}));
  const unrelated = AdminApi.getEmailSettingsQueryKey({});
  queryClient.setQueryData(unrelated, {});
  jest.mocked(axios.post).mockResolvedValue({ data: {} });
  const { result } = renderHook<undefined, ReturnType<typeof hook>>(hook, { initialProps: undefined, wrapper });
  await act(async () => {
    await result.current.mutateAsync({} as never);
  });
  expect(axios.post).toHaveBeenCalledWith(`/admin/api/${endpoint}`, {}, expect.anything());
  affected.forEach((key) => expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true));
  expect(queryClient.getQueryState(unrelated)?.isInvalidated).toBe(false);
});

it("refreshes a mounted table once after a successful mutation", async () => {
  const options = AdminApi.listBillingProductsQueryOptions({});
  queryClient.setQueryData(AdminApi.listBillingProductsQueryKey({}), { products: [] });
  queryClient.setQueryData(AdminApi.listBillingPlanDefinitionsQueryKey({}), { planDefinitions: [] });
  jest.mocked(axios.post).mockResolvedValue({ data: {} });
  jest.mocked(axios.get).mockResolvedValue({ data: { products: [{ id: "created" }] } });
  const { result } = renderHook(
    () => ({
      query: useLoadedQuery(options),
      mutation: Catalog.useCreateBillingProduct(),
      refresh: Catalog.useRefreshBillingCatalog(),
    }),
    { initialProps: undefined, wrapper },
  );
  await act(async () => {
    await result.current.mutation.mutateAsync({} as never);
    await result.current.refresh();
  });
  await waitFor(() => expect(result.current.query.data?.products).toEqual([{ id: "created" }]));
  expect(axios.get).toHaveBeenCalledTimes(1);
});

it("does not invalidate catalog data on failure", async () => {
  const key = AdminApi.listBillingProductsQueryKey({});
  queryClient.setQueryData(key, { products: [] });
  jest.mocked(axios.post).mockRejectedValue(new Error("provider unavailable"));
  const { result } = renderHook(Catalog.useSyncBillingProductsFromPolar, { initialProps: undefined, wrapper });
  await act(async () => {
    await expect(result.current.mutateAsync({})).rejects.toThrow("provider unavailable");
  });
  expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false);
});
