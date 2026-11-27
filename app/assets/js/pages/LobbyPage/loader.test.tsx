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

it("prefetches account and companies and observes company-list invalidation", async () => {
  jest.mocked(axios.get).mockImplementation(async (url) => ({
    data: url.endsWith("get_account")
      ? { account: { fullName: "Person" } }
      : {
          companies: [
            { id: "first", name: "First" },
            { id: "second", name: "Before" },
          ],
        },
  }));
  const inputs = await loader();
  expect(inputs).toEqual({
    context: { basePath: "/api/v2", headers: {} },
    accountInput: {},
    companiesInput: { includeMemberCount: true },
  });
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  await loader();
  expect(axios.get).toHaveBeenCalledTimes(2);
  expect(result.current?.account.fullName).toBe("Person");
  jest.mocked(axios.get).mockResolvedValue({ data: { companies: [{ id: "new", name: "After" }] } });
  await act(() => queryClient.invalidateQueries({ queryKey: Api.companies.listQueryKeyPrefix() }));
  await waitFor(() => expect(result.current?.companies[0]?.name).toBe("After"));
});

it("redirects an account with one company to that company", async () => {
  jest.mocked(axios.get).mockImplementation(async (url) => ({
    data: url.endsWith("get_account")
      ? { account: { fullName: "Person" } }
      : { companies: [{ id: "company", name: "Company" }] },
  }));

  expect(await loader()).toEqual({ location: "/company" });
});

it("allows an empty company list while requiring the account", async () => {
  jest.mocked(axios.get).mockImplementation(async (url) => ({
    data: url.endsWith("get_account") ? { account: { fullName: "Person" } } : { companies: [] },
  }));
  jest.mocked(Pages.useLoadedData).mockReturnValue(await loader());
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current?.companies).toEqual([]);
  expect(result.current?.account.fullName).toBe("Person");
});

it("keeps the prefetched account and companies while navigation changes company headers", async () => {
  const account = { fullName: "Person" };
  const companies = [
    { id: "company", name: "Company" },
    { id: "other", name: "Other" },
  ];
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

it("uses the prefetched account and companies when company headers change before the first mount and a remount", async () => {
  const account = { fullName: "Person" };
  const companies = [
    { id: "company", name: "Company" },
    { id: "other", name: "Other" },
  ];
  jest.mocked(axios.get).mockImplementation(async (url) => ({
    data: url.endsWith("get_account") ? { account } : { companies },
  }));
  jest.mocked(Pages.useLoadedData).mockReturnValue(await loader());

  Api.default.setHeaders({ "x-company-id": "destination" });
  const firstMount = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(firstMount.result.current).toEqual({ account, companies });
  firstMount.unmount();

  const remount = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(remount.result.current).toEqual({ account, companies });
  expect(axios.get).toHaveBeenCalledTimes(2);
  expect(queryClient.getQueryData(Api.people.getAccountQueryKey({}))).toBeUndefined();
  expect(queryClient.getQueryData(Api.companies.listQueryKey({ includeMemberCount: true }))).toBeUndefined();
});

it.each(["account", "companies"])("shows pending data until the missing %s query recovers", async (missing) => {
  const account = { fullName: "Person" };
  const companies = [
    { id: "first", name: "First" },
    { id: "second", name: "Second" },
  ];
  jest.mocked(axios.get).mockImplementation(async (url) => ({
    data: url.endsWith("get_account") ? { account } : { companies },
  }));
  const inputs = await loader();
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);
  const key =
    missing === "account"
      ? Api.people.getAccountQueryKey({})
      : Api.companies.listQueryKey({ includeMemberCount: true });
  queryClient.removeQueries({ queryKey: key, exact: true });

  let resolveRequest: (response: { data: unknown }) => void = () => {};
  const response = new Promise<{ data: unknown }>((resolve) => {
    resolveRequest = resolve;
  });
  jest
    .mocked(axios.get)
    .mockImplementation((url) =>
      url.endsWith(missing === "account" ? "get_account" : "companies/list")
        ? response
        : Promise.resolve({ data: url.endsWith("get_account") ? { account } : { companies } }),
    );

  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current).toBeNull();

  await act(async () => resolveRequest({ data: missing === "account" ? { account } : { companies } }));
  await waitFor(() => expect(result.current).toEqual({ account, companies }));
});

it("propagates a failed account request", async () => {
  const failure = new Error("Account request failed");
  jest.mocked(axios.get).mockImplementation(async (url) => {
    if (url.endsWith("get_account")) throw failure;
    return { data: { companies: [] } };
  });

  await expect(loader()).rejects.toBe(failure);
});
