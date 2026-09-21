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
import { useUpdateEmailSettings, useSendTestEmail } from "./emailSettingsLifecycle";

it("publishes confirmed settings to mounted queries", async () => {
  const options = AdminApi.getEmailSettingsQueryOptions({});
  queryClient.setQueryData(AdminApi.getEmailSettingsQueryKey({}), { emailSettings: { provider: "smtp" } });
  jest
    .mocked(axios.post)
    .mockResolvedValue({ data: { success: true, emailSettings: { provider: "sendgrid", sendgridApiKeySet: true } } });
  const { result } = renderHook(() => ({ mutation: useUpdateEmailSettings(), query: useLoadedQuery(options) }), {
    initialProps: undefined,
    wrapper,
  });
  await act(async () => {
    await result.current.mutation.mutateAsync({ provider: "sendgrid" });
  });
  await waitFor(() =>
    expect(result.current.query.data?.emailSettings).toEqual({ provider: "sendgrid", sendgridApiKeySet: true }),
  );
  expect(axios.get).not.toHaveBeenCalled();
});

it("preserves cached settings when the server returns success false", async () => {
  const key = AdminApi.getEmailSettingsQueryKey({});
  queryClient.setQueryData(key, { emailSettings: { provider: "smtp" } });
  jest
    .mocked(axios.post)
    .mockResolvedValue({ data: { success: false, emailSettings: { provider: "sendgrid", sendgridApiKeySet: true } } });
  const { result } = renderHook(useUpdateEmailSettings, { initialProps: undefined, wrapper });
  await act(async () => {
    expect((await result.current.mutateAsync({ provider: "sendgrid" })).success).toBe(false);
  });
  expect(queryClient.getQueryData(key)).toEqual({ emailSettings: { provider: "smtp" } });
});

it("preserves cached settings on request failure", async () => {
  const key = AdminApi.getEmailSettingsQueryKey({});
  queryClient.setQueryData(key, { emailSettings: { provider: "smtp" } });
  jest.mocked(axios.post).mockRejectedValue(new Error("offline"));
  const { result } = renderHook(useUpdateEmailSettings, { initialProps: undefined, wrapper });
  await act(async () => {
    await expect(result.current.mutateAsync({ provider: "sendgrid" })).rejects.toThrow("offline");
  });
  expect(queryClient.getQueryData(key)).toEqual({ emailSettings: { provider: "smtp" } });
});

it("sends test email without changing stored email settings", async () => {
  const key = AdminApi.getEmailSettingsQueryKey({});
  queryClient.setQueryData(key, { emailSettings: { provider: "smtp" } });
  jest.mocked(axios.post).mockResolvedValue({ data: { success: false, error: "delivery failed" } });
  const { result } = renderHook(useSendTestEmail, { initialProps: undefined, wrapper });
  await act(async () => {
    expect(await result.current.mutateAsync({ recipient: "test@example.com", subject: "Test", body: "Test" })).toEqual({
      success: false,
      error: "delivery failed",
    });
  });
  expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false);
});
