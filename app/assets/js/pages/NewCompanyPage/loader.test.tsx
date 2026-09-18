/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Pages from "@/components/Pages";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import { loader, useLoadedData } from "./loader";

jest.mock("axios");
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("react-router", () => ({}));
jest.mock("turboui", () => ({}));
jest.mock("@/api/socket", () => ({ setHeaders: jest.fn() }));
jest.mock("@/components/Pages", () => ({ useLoadedData: jest.fn() }));
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
beforeEach(() => {
  queryClient.clear();
  jest.clearAllMocks();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({});
});
afterEach(() => queryClient.clear());

it("reuses the billing catalog and observes cache updates", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { plans: [], catalogProducts: [] } });
  const inputs = await loader();
  expect(inputs).toEqual({ queryInput: {} });
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  await loader();
  expect(axios.get).toHaveBeenCalledTimes(1);
  const updated = { plans: [{ key: "business" }], catalogProducts: [] };
  jest.mocked(axios.get).mockResolvedValue({ data: updated });
  await act(() => queryClient.invalidateQueries({ queryKey: Api.billing.getCatalogQueryKeyPrefix() }));
  await waitFor(() => expect(result.current.billingCatalog).toEqual(updated));
});

it("keeps the prefetched catalog while navigation changes the company headers", async () => {
  const catalog = { plans: [], catalogProducts: [] };
  jest.mocked(axios.get).mockResolvedValue({ data: catalog });
  jest.mocked(Pages.useLoadedData).mockReturnValue(await loader());
  const { result, rerender } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  Api.default.setHeaders({ "x-company-id": "new-company" });
  rerender(undefined);
  expect(result.current.billingCatalog).toEqual(catalog);
  expect(axios.get).toHaveBeenCalledTimes(1);
});
