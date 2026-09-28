/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import * as AdminApi from "@/ee/admin_api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import {
  useGetAccounts,
  useGetCompanies,
  useGetActiveCompanies,
  useDeleteAccount,
  usePromoteAccountToSiteAdmin,
  useDemoteAccountFromSiteAdmin,
} from "./saasAdminLifecycle";

jest.mock("axios");
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("@/ee/admin_api/staleClient", () => ({ handleStaleClientError: jest.fn() }));

let client: QueryClient;
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);
beforeEach(() => {
  jest.resetAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  AdminApi.default.default.setBasePath("/admin/api");
});
afterEach(() => client.clear());

describe.each([
  { name: "accounts", useList: useGetAccounts, key: AdminApi.getAccountsQueryKey, field: "accounts" },
  { name: "companies", useList: useGetCompanies, key: AdminApi.getCompaniesQueryKey, field: "companies" },
  {
    name: "active companies",
    useList: useGetActiveCompanies,
    key: AdminApi.getActiveCompaniesQueryKey,
    field: "companies",
  },
])("$name", ({ useList, key, field }) => {
  it("loads and reuses cached list data on remount", async () => {
    const data = { [field]: [{ id: "item1" }] };
    jest.mocked(axios.get).mockResolvedValue({ data });
    const first = renderHook(() => useList(), { initialProps: undefined, wrapper });
    expect(first.result.current.isPending).toBe(true);
    await waitFor(() => expect(first.result.current.data).toEqual(data));
    expect(client.getQueryData(key({}))).toEqual(data);
    first.unmount();
    const second = renderHook(() => useList(), { initialProps: undefined, wrapper });
    expect(second.result.current.data).toEqual(data);
    expect(second.result.current.isPending).toBe(false);
    await waitFor(() => expect(second.result.current.isFetching).toBe(false));
  });

  it("exposes request failures without remaining in the loading state", async () => {
    jest.mocked(axios.get).mockRejectedValue(new Error("Forbidden"));
    const { result } = renderHook(() => useList(), { initialProps: undefined, wrapper });
    await waitFor(() => expect(result.current.error?.message).toBe("Forbidden"));
    expect(result.current.isPending).toBe(false);
  });
});

describe.each([
  { action: "promote", useAction: usePromoteAccountToSiteAdmin, endpoint: "promote_account_to_site_admin" },
  { action: "demote", useAction: useDemoteAccountFromSiteAdmin, endpoint: "demote_account_from_site_admin" },
  { action: "delete", useAction: useDeleteAccount, endpoint: "delete_account" },
])("$action", ({ action, useAction, endpoint }) => {
  function seedQueries() {
    const accounts = AdminApi.getAccountsQueryKey({});
    const companies = [
      AdminApi.getCompaniesQueryKey({}),
      AdminApi.getActiveCompaniesQueryKey({}),
      AdminApi.getCompanyQueryKey({ id: "company1" }),
      AdminApi.getCompanyQueryKey({ id: "company2" }),
    ];
    const unrelated = AdminApi.getEmailSettingsQueryKey({});
    [accounts, ...companies, unrelated].forEach((key) => client.setQueryData(key, {}));
    return { accounts, companies, unrelated };
  }

  it("invalidates only affected admin queries after success", async () => {
    const { accounts, companies, unrelated } = seedQueries();
    jest.mocked(axios.post).mockResolvedValue({ data: { success: true } });
    const { result } = renderHook(() => useAction(), { initialProps: undefined, wrapper });
    await act(() => result.current.mutateAsync({ accountId: "account1" }));
    expect(axios.post).toHaveBeenCalledWith(`/admin/api/${endpoint}`, { account_id: "account1" }, expect.anything());
    expect(client.getQueryState(accounts)?.isInvalidated).toBe(true);
    companies.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(action === "delete"));
    expect(client.getQueryState(unrelated)?.isInvalidated).toBe(false);
  });

  it.each(["blocked", "rejected"])("preserves caches when the action is %s", async (failure) => {
    const { accounts, companies, unrelated } = seedQueries();
    if (failure === "blocked")
      jest.mocked(axios.post).mockResolvedValue({ data: { success: false, error: "Blocked" } });
    else jest.mocked(axios.post).mockRejectedValue(new Error("Forbidden"));
    const { result } = renderHook(() => useAction(), { initialProps: undefined, wrapper });
    await act(async () => {
      const request = result.current.mutateAsync({ accountId: "account1" });
      if (failure === "blocked") await expect(request).resolves.toMatchObject({ success: false });
      else await expect(request).rejects.toThrow("Forbidden");
    });
    [accounts, ...companies, unrelated].forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
  });

  it("awaits refresh of the mounted account list", async () => {
    jest
      .mocked(axios.get)
      .mockResolvedValue({ data: { accounts: [{ id: "account1", site_admin: action === "demote" }] } });
    const { result } = renderHook(() => ({ list: useGetAccounts(), mutation: useAction() }), {
      initialProps: undefined,
      wrapper,
    });
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));
    const updated = action === "delete" ? [] : [{ id: "account1", site_admin: action === "promote" }];
    jest.mocked(axios.get).mockResolvedValue({ data: { accounts: updated } });
    jest.mocked(axios.post).mockResolvedValue({ data: { success: true } });
    await act(() => result.current.mutation.mutateAsync({ accountId: "account1" }));
    await waitFor(() => {
      const accounts = result.current.list.data?.accounts;
      if (action === "delete") expect(accounts).toEqual([]);
      else expect(accounts?.[0]?.siteAdmin).toBe(action === "promote");
    });
    expect(axios.get).toHaveBeenCalledTimes(2);
  });
});

it.each([useDeleteAccount, useDemoteAccountFromSiteAdmin])(
  "can invalidate without refetching when admin access is revoked",
  async (useAction) => {
    jest.mocked(axios.get).mockResolvedValue({ data: { accounts: [] } });
    jest.mocked(axios.post).mockResolvedValue({ data: { success: true } });
    const { result } = renderHook(
      () => ({ list: useGetAccounts(), mutation: useAction({ currentAccountId: "self" }) }),
      {
        initialProps: undefined,
        wrapper,
      },
    );
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));
    await act(() => result.current.mutation.mutateAsync({ accountId: "self" }));
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(client.getQueryState(AdminApi.getAccountsQueryKey({}))?.isInvalidated).toBe(true);
  },
);
