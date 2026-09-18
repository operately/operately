/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { useBillingActions } from "@/models/billing";
import { queryClient } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Pages from "@/components/Pages";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import { loader, useLoadedData } from "./loader";

jest.mock("axios");
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("react-router", () => ({ redirect: (location: string) => ({ location }) }));
jest.mock("turboui", () => ({}));
jest.mock("@/api/socket", () => ({ setHeaders: jest.fn() }));
jest.mock("@/components/Pages", () => ({ useLoadedData: jest.fn() }));
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
const args = { params: { companyId: "company" } };
const billing = { account: { status: "active", cancelAtPeriodEnd: false } };

beforeEach(() => {
  queryClient.clear();
  jest.clearAllMocks();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company" });
  window.appConfig = { billingEnabled: true } as typeof window.appConfig;
  jest.mocked(axios.get).mockImplementation(async (url) => ({
    data: url.endsWith("/companies/get") ? { company: { permissions: { canManageBilling: true } } } : { billing },
  }));
});
afterEach(() => queryClient.clear());

it("prefetches inputs, avoids mount requests, and observes cached billing updates", async () => {
  const inputs = await loader(args);
  expect(inputs).toEqual({ queryInput: {} });
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current.billing).toEqual(billing);
  expect(axios.get).toHaveBeenCalledTimes(2);
  const updated = { ...billing, memberCount: 10 };
  act(() => queryClient.setQueryData(Api.billing.getQueryKey({}), { billing: updated }));
  await waitFor(() => expect(result.current.billing).toEqual(updated));
});

it("checks permissions and billing afresh on reentry", async () => {
  await loader(args);
  await loader(args);
  expect(axios.get).toHaveBeenCalledTimes(4);
  jest.mocked(axios.get).mockResolvedValue({ data: { company: { permissions: { canManageBilling: false } } } });
  await expect(loader(args)).rejects.toEqual({ location: "/company/admin" });
});

it("redirects when billing is disabled", async () => {
  window.appConfig.billingEnabled = false;
  await expect(loader(args)).rejects.toEqual({ location: "/company/admin" });
});

it("keeps the loaded billing while navigation changes headers", async () => {
  jest.mocked(Pages.useLoadedData).mockReturnValue(await loader(args));
  const { result, rerender } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  Api.default.setHeaders({ "x-company-id": "other-company" });
  rerender(undefined);
  expect(result.current.billing).toEqual(billing);
  expect(axios.get).toHaveBeenCalledTimes(2);
});

it("preserves the forbidden billing redirect and propagates other errors", async () => {
  const error = { response: { status: 403 } };
  jest.mocked(axios.isAxiosError).mockReturnValue(true);
  jest.mocked(axios.get).mockImplementation(async (url) => {
    if (url.endsWith("/companies/get")) return { data: { company: { permissions: { canManageBilling: true } } } };
    throw error;
  });
  await expect(loader(args)).rejects.toEqual({ location: "/company/admin" });
  error.response.status = 500;
  await expect(loader(args)).rejects.toBe(error);
});

it("finishes route revalidation when a billing refresh supersedes its in-flight read", async () => {
  await loader(args);
  const { result } = renderHook(useBillingActions, { initialProps: undefined, wrapper });
  jest.mocked(axios.get).mockImplementation(async (url) => {
    if (url.endsWith("/companies/get")) return { data: { company: { permissions: { canManageBilling: true } } } };
    return new Promise(() => {});
  });
  const revalidation = loader(args).catch((error: unknown) => error);
  await waitFor(() => expect(queryClient.isFetching({ queryKey: Api.billing.getQueryKey({}) })).toBe(1));
  jest.mocked(axios.post).mockResolvedValue({ data: { billing } });
  await act(async () => {
    await result.current.refreshBilling({});
  });
  expect(await revalidation).toEqual({ queryInput: {} });
});
