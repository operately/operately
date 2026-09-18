/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import * as AdminApi from "@/ee/admin_api";
import { queryClient } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@/__tests__/renderHook";
import { Page } from "./index";

let mockSwitch: { value: boolean; setValue: (value: boolean) => Promise<void> };
jest.mock("axios");
jest.mock("@/ee/admin_api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("@/components/Pages", () => ({
  Page: ({ children }: React.PropsWithChildren) => children,
  useLoadedData: () => ({ queryInput: {} }),
}));
jest.mock("@/components/PaperContainer", () => ({
  Root: ({ children }: React.PropsWithChildren) => children,
  Body: ({ children }: React.PropsWithChildren) => children,
  Navigation: () => null,
  Header: () => null,
}));
jest.mock("turboui", () => ({
  PageSection: ({ children }: React.PropsWithChildren) => children,
  SwitchToggle: (props: typeof mockSwitch) => {
    mockSwitch = props;
    return null;
  },
  showErrorToast: jest.fn(),
  showSuccessToast: jest.fn(),
}));
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>
    <Page />
    {children}
  </QueryClientProvider>
);
beforeEach(() => {
  queryClient.clear();
  jest.resetAllMocks();
  AdminApi.default.default.setBasePath("/admin/api");
  queryClient.setQueryData(AdminApi.getUpdateBadgeSettingsQueryKey({}), { enabled: true });
});
afterEach(() => queryClient.clear());

it("updates the displayed and cached setting after saving", async () => {
  jest.mocked(axios.post).mockResolvedValue({ data: { success: true, enabled: false } });
  renderHook(() => null, { initialProps: undefined, wrapper });
  await act(async () => {
    await mockSwitch.setValue(false);
  });
  expect(mockSwitch.value).toBe(false);
  expect(queryClient.getQueryData(AdminApi.getUpdateBadgeSettingsQueryKey({}))).toEqual({ enabled: false });
});

it.each(["rejected", "unsuccessful"])("rolls back the toggle when saving is %s", async (failure) => {
  if (failure === "rejected") jest.mocked(axios.post).mockRejectedValue(new Error("offline"));
  else jest.mocked(axios.post).mockResolvedValue({ data: { success: false, enabled: false } });
  renderHook(() => null, { initialProps: undefined, wrapper });
  await act(async () => {
    await mockSwitch.setValue(false);
  });
  expect(mockSwitch.value).toBe(true);
  expect(queryClient.getQueryData(AdminApi.getUpdateBadgeSettingsQueryKey({}))).toEqual({ enabled: true });
});
