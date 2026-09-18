/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import * as AdminApi from "@/ee/admin_api";
import { queryClient } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Pages from "@/components/Pages";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import { loader, useLoadedData } from "./loader";

jest.mock("axios");
jest.mock("@/ee/admin_api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("@/components/Pages", () => ({ useLoadedData: jest.fn() }));
jest.mock("react-router", () => ({ redirect: (location: string) => ({ location }) }));
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
beforeEach(() => {
  queryClient.clear();
  jest.clearAllMocks();
  AdminApi.default.default.setBasePath("/admin/api");
  window.appConfig = { billingEnabled: true } as typeof window.appConfig;
});
afterEach(() => queryClient.clear());

it("prefetches query inputs and reuses cached data on mount and reentry", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { products: [], planDefinitions: [] } });
  const inputs = await loader();
  expect(inputs).toEqual({ queryInput: {} });
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current).toEqual({ products: [], planDefinitions: [] });
  await loader();
  expect(axios.get).toHaveBeenCalledTimes(2);
});

it("observes refreshed query data", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { products: [], planDefinitions: [] } });
  jest.mocked(Pages.useLoadedData).mockReturnValue(await loader());
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  const updated = { products: [{ id: "updated" }] };
  jest.mocked(axios.get).mockResolvedValue({ data: updated });
  await act(() => queryClient.invalidateQueries({ queryKey: AdminApi.listBillingProductsQueryKeyPrefix() }));
  await waitFor(() => expect(result.current.products).toEqual(updated.products));
});

it("redirects without fetching when billing is disabled", async () => {
  window.appConfig.billingEnabled = false;
  await expect(loader()).rejects.toEqual({ location: "/admin" });
  expect(axios.get).not.toHaveBeenCalled();
});
