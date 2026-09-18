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

it("prefetches account and companies and observes company-list invalidation", async () => {
  jest.mocked(axios.get).mockImplementation(async (url) => ({
    data: url.endsWith("get_account")
      ? { account: { fullName: "Person" } }
      : { companies: [{ id: "company", name: "Before" }] },
  }));
  const inputs = await loader();
  expect(inputs).toEqual({ accountInput: {}, companiesInput: { includeMemberCount: true } });
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  await loader();
  expect(axios.get).toHaveBeenCalledTimes(2);
  expect(result.current.account.fullName).toBe("Person");
  jest.mocked(axios.get).mockResolvedValue({ data: { companies: [{ id: "new", name: "After" }] } });
  await act(() => queryClient.invalidateQueries({ queryKey: Api.companies.listQueryKeyPrefix() }));
  await waitFor(() => expect(result.current.companies[0]?.name).toBe("After"));
});

it("allows an empty company list while requiring the account", async () => {
  jest.mocked(axios.get).mockImplementation(async (url) => ({
    data: url.endsWith("get_account") ? { account: { fullName: "Person" } } : {},
  }));
  jest.mocked(Pages.useLoadedData).mockReturnValue(await loader());
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current.companies).toEqual([]);
  expect(result.current.account.fullName).toBe("Person");
});

it("keeps the prefetched account and companies while navigation changes company headers", async () => {
  const account = { fullName: "Person" };
  const companies = [{ id: "company", name: "Company" }];
  jest.mocked(axios.get).mockImplementation(async (url) => ({
    data: url.endsWith("get_account") ? { account } : { companies },
  }));
  jest.mocked(Pages.useLoadedData).mockReturnValue(await loader());
  const { result, rerender } = renderHook(useLoadedData, { initialProps: undefined, wrapper });

  Api.default.setHeaders({ "x-company-id": "company" });
  rerender(undefined);

  expect(result.current).toEqual({ account, companies });
  expect(axios.get).toHaveBeenCalledTimes(2);
});
