/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import * as AdminApi from "@/ee/admin_api";
import { queryClient, useLoadedQuery } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";

jest.mock("axios");
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("@/ee/admin_api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
beforeEach(() => {
  queryClient.clear();
  jest.resetAllMocks();
  AdminApi.default.default.setBasePath("/admin/api");
});
afterEach(() => queryClient.clear());
import { useUpdateUpdateBadgeSettings } from "./updateBadgeLifecycle";

it("publishes confirmed settings to mounted queries", async () => {
  const options = AdminApi.getUpdateBadgeSettingsQueryOptions({});
  queryClient.setQueryData(AdminApi.getUpdateBadgeSettingsQueryKey({}), { enabled: true });
  jest.mocked(axios.post).mockResolvedValue({ data: { success: true, enabled: false } });
  const { result } = renderHook(() => ({ mutation: useUpdateUpdateBadgeSettings(), query: useLoadedQuery(options) }), {
    initialProps: undefined,
    wrapper,
  });
  await act(async () => {
    await result.current.mutation.mutateAsync({ enabled: false });
  });
  await waitFor(() => expect(result.current.query.data?.enabled).toEqual(false));
  expect(axios.get).not.toHaveBeenCalled();
});

it("preserves cached settings when the server returns success false", async () => {
  const key = AdminApi.getUpdateBadgeSettingsQueryKey({});
  queryClient.setQueryData(key, { enabled: true });
  jest.mocked(axios.post).mockResolvedValue({ data: { success: false, enabled: false } });
  const { result } = renderHook(useUpdateUpdateBadgeSettings, { initialProps: undefined, wrapper });
  await act(async () => {
    expect((await result.current.mutateAsync({ enabled: false })).success).toBe(false);
  });
  expect(queryClient.getQueryData(key)).toEqual({ enabled: true });
});

it("preserves cached settings on request failure", async () => {
  const key = AdminApi.getUpdateBadgeSettingsQueryKey({});
  queryClient.setQueryData(key, { enabled: true });
  jest.mocked(axios.post).mockRejectedValue(new Error("offline"));
  const { result } = renderHook(useUpdateUpdateBadgeSettings, { initialProps: undefined, wrapper });
  await act(async () => {
    await expect(result.current.mutateAsync({ enabled: false })).rejects.toThrow("offline");
  });
  expect(queryClient.getQueryData(key)).toEqual({ enabled: true });
});
