/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Pages from "@/components/Pages";
import { renderHook } from "@/__tests__/renderHook";
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
beforeEach(() => {
  queryClient.clear();
  jest.clearAllMocks();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({});
});
afterEach(() => queryClient.clear());

it("loads eligible companies, preserves filters, and fetches fresh data on reentry", async () => {
  const companies = [{ id: "company", name: "Company" }];
  jest.mocked(axios.get).mockResolvedValue({ data: { companies } });
  const inputs = await loader();
  expect(inputs).toEqual({ queryInput: { includeMemberCount: true, canManageBilling: true } });
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);
  const { result, rerender } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current.companies).toEqual(companies);
  expect(axios.get).toHaveBeenCalledTimes(1);
  expect(axios.get).toHaveBeenCalledWith("/api/v2/companies/list", {
    params: { include_member_count: true, can_manage_billing: true },
    headers: {},
  });
  await loader();
  expect(axios.get).toHaveBeenCalledTimes(2);
  Api.default.setHeaders({ "x-company-id": "company" });
  rerender(undefined);
  expect(result.current.companies).toEqual(companies);
  expect(axios.get).toHaveBeenCalledTimes(2);
});

it("uses an empty list when no companies are returned", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: {} });
  jest.mocked(Pages.useLoadedData).mockReturnValue(await loader());
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current.companies).toEqual([]);
});
