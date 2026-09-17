/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Pages from "@/components/Pages";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import { InvitePeoplePage, showErrorToast } from "turboui";
import PageModule from "./index";

jest.mock("axios");
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("@/components/Pages", () => ({ useLoadedData: jest.fn() }));
jest.mock("@/routes/useCompanyLoaderData", () => ({ useCompanyLoaderData: () => ({ company: { name: "Company" } }) }));
jest.mock("@/routes/paths", () => ({
  usePaths: () => ({
    companyAdminPath: () => "/admin",
    companyManagePeoplePath: () => "/people",
    companyManagePeopleAddPeoplePath: () => "/add-people",
  }),
}));
jest.mock("turboui", () => ({ InvitePeoplePage: jest.fn(() => null), showErrorToast: jest.fn() }));

const inviteLink = { token: "original", isActive: true, allowedDomains: [] };
const { Page } = PageModule;
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>
    <Page />
    {children}
  </QueryClientProvider>
);
function props() {
  const calls = jest.mocked(InvitePeoplePage).mock.calls;
  const latest = calls[calls.length - 1];
  if (!latest) throw new Error("Invite page has not rendered");
  return latest[0];
}
beforeEach(async () => {
  queryClient.clear();
  jest.clearAllMocks();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company" });
  jest.mocked(axios.post).mockResolvedValue({ data: { inviteLink } });
  jest.mocked(Pages.useLoadedData).mockReturnValue(await PageModule.loader({ params: {}, request: {} }));
});
afterEach(() => queryClient.clear());

it("shows the reset token even if the subsequent refresh fails", async () => {
  renderHook(() => null, { initialProps: undefined, wrapper });
  jest
    .mocked(axios.post)
    .mockResolvedValueOnce({ data: { inviteLink: { ...inviteLink, token: "new" } } })
    .mockRejectedValue(new Error("Refresh failed"));
  await act(async () => {
    await props().onResetLink();
  });
  await waitFor(() => expect(props().invitationLink).toBe(`${window.location.origin}/join/new`));
  expect(showErrorToast).not.toHaveBeenCalled();
});

it("keeps domain restriction editing enabled until domains are saved", async () => {
  renderHook(() => null, { initialProps: undefined, wrapper });
  await act(async () => {
    await props().domainRestriction?.onToggle?.(true);
  });
  expect(props().domainRestriction?.enabled).toBe(true);
  const updated = { ...inviteLink, allowedDomains: ["example.com"] };
  jest.mocked(axios.post).mockResolvedValue({ data: { inviteLink: updated } });
  await act(async () => {
    await props().domainRestriction?.onChange?.("example.com");
  });
  await waitFor(() => expect(props().domainRestriction?.value).toBe("example.com"));
});

it("rolls back failed link and domain toggles", async () => {
  renderHook(() => null, { initialProps: undefined, wrapper });
  jest.mocked(axios.post).mockRejectedValue(new Error("Failed"));
  await act(async () => {
    await props().onToggleLink?.(false);
  });
  expect(props().linkEnabled).toBe(true);
  await act(async () => {
    await props().domainRestriction?.onToggle?.(true);
  });
  expect(props().domainRestriction?.enabled).toBe(false);
  expect(showErrorToast).toHaveBeenCalledTimes(2);
});
