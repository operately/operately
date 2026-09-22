/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import * as AdminApi from "@/ee/admin_api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import { showErrorToast, showSuccessToast } from "turboui";
import { useGetAccounts } from "@/ee/models/saasAdminLifecycle";
import { PendingAccountAction, useAccountActions } from "./AccountActionsMenu";

jest.mock("axios");
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("@/ee/admin_api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("turboui", () => ({ showErrorToast: jest.fn(), showSuccessToast: jest.fn() }));

let client: QueryClient;
const closeDialog = jest.fn();
const assign = jest.fn();
const originalLocation = window.location;
const account: AdminApi.Account = {
  id: "target",
  fullName: "Target",
  email: "target@example.com",
  siteAdmin: false,
  companiesCount: 1,
  ownedCompaniesCount: 0,
  insertedAt: "2026-01-01T00:00:00Z",
};
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);
beforeEach(() => {
  jest.resetAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  AdminApi.default.default.setBasePath("/admin/api");
  window.appConfig = { account: { id: 123 } } as typeof window.appConfig;
  Object.defineProperty(window, "location", { configurable: true, value: { assign } });
});
afterEach(() => {
  client.clear();
  Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
});

describe.each<PendingAccountAction["type"]>(["promote", "demote", "delete"])("%s feedback", (type) => {
  function mount() {
    return renderHook(() => useAccountActions({ pendingAction: { type, account }, closeDialog }), {
      initialProps: undefined,
      wrapper,
    });
  }

  it("closes the dialog and reports success after the action", async () => {
    jest.mocked(axios.post).mockResolvedValue({ data: { success: true } });
    const { result } = mount();
    await act(() => result.current.handleConfirmAction());
    expect(showSuccessToast).toHaveBeenCalledTimes(1);
    expect(showErrorToast).not.toHaveBeenCalled();
    expect(closeDialog).toHaveBeenCalledTimes(1);
    expect(assign).not.toHaveBeenCalled();
  });

  it.each(["blocked", "rejected"])("keeps the dialog open and reports a %s action", async (failure) => {
    if (failure === "blocked")
      jest.mocked(axios.post).mockResolvedValue({ data: { success: false, error: "Blocked" } });
    else jest.mocked(axios.post).mockRejectedValue({ response: { data: { message: "Forbidden" } } });
    const { result } = mount();
    await act(() => result.current.handleConfirmAction());
    expect(showErrorToast).toHaveBeenCalledWith(expect.any(String), failure === "blocked" ? "Blocked" : "Forbidden");
    expect(showSuccessToast).not.toHaveBeenCalled();
    expect(closeDialog).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
  });
});

it.each([
  { type: "demote" as const, destination: "/" },
  { type: "delete" as const, destination: "/log_in" },
])("redirects after self-$type without refetching privileged data", async ({ type, destination }) => {
  jest.mocked(axios.get).mockResolvedValue({ data: { accounts: [] } });
  jest.mocked(axios.post).mockResolvedValue({ data: { success: true } });
  const { result } = renderHook(
    () => ({
      accounts: useGetAccounts(),
      actions: useAccountActions({ pendingAction: { type, account: { ...account, id: "123" } }, closeDialog }),
    }),
    { initialProps: undefined, wrapper },
  );
  await waitFor(() => expect(result.current.accounts.isSuccess).toBe(true));
  await act(() => result.current.actions.handleConfirmAction());
  expect(assign).toHaveBeenCalledWith(destination);
  expect(axios.get).toHaveBeenCalledTimes(1);
});

it("does nothing when no action is pending", async () => {
  const { result } = renderHook(() => useAccountActions({ pendingAction: null, closeDialog }), {
    initialProps: undefined,
    wrapper,
  });
  await act(() => result.current.handleConfirmAction());
  expect(axios.post).not.toHaveBeenCalled();
  expect(result.current.dialogContent).toBeNull();
});

it.each<PendingAccountAction["type"]>(["demote", "delete"])(
  "does not refetch admin data if the self-%s dialog closes during the request",
  async (type) => {
    jest.mocked(axios.get).mockResolvedValue({ data: { accounts: [] } });
    let finish = (_value: unknown) => {};
    jest.mocked(axios.post).mockImplementation(() => new Promise((resolve) => (finish = resolve)));
    const { result, rerender } = renderHook(
      (pendingAction: PendingAccountAction | null) => ({
        accounts: useGetAccounts(),
        actions: useAccountActions({ pendingAction, closeDialog }),
      }),
      { initialProps: { type, account: { ...account, id: "123" } }, wrapper },
    );
    await waitFor(() => expect(result.current.accounts.isSuccess).toBe(true));
    let saving: Promise<void>;
    await act(async () => {
      saving = result.current.actions.handleConfirmAction();
    });
    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    rerender(null);
    await act(async () => {
      finish({ data: { success: true } });
      await saving;
    });
    expect(assign).toHaveBeenCalled();
    expect(axios.get).toHaveBeenCalledTimes(1);
  },
);
