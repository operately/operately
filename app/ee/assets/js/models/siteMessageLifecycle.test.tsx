/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import * as AdminApi from "@/ee/admin_api";
import { queryClient, useLoadedQuery } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";

jest.mock("axios");
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
import * as Messages from "./siteMessageLifecycle";

it.each([
  [Messages.useCreateSiteMessage, "create_site_message"],
  [Messages.useUpdateSiteMessage, "update_site_message"],
  [Messages.useDeleteSiteMessage, "delete_site_message"],
] as const)("refreshes the mounted message list after %s", async (hook, endpoint) => {
  const options = AdminApi.listSiteMessagesQueryOptions({});
  queryClient.setQueryData(AdminApi.listSiteMessagesQueryKey({}), { messages: [{ id: "before" }] });
  queryClient.setQueryData(AdminApi.getEmailSettingsQueryKey({}), {});
  jest.mocked(axios.post).mockResolvedValue({ data: { message: { id: "after" } } });
  jest.mocked(axios.get).mockResolvedValue({ data: { messages: [{ id: "after" }] } });
  const { result } = renderHook(
    () => ({ mutation: hook(), query: useLoadedQuery(options), refresh: Messages.useRefreshSiteMessages() }),
    { initialProps: undefined, wrapper },
  );
  await act(async () => {
    await result.current.mutation.mutateAsync({ id: "message" } as never);
    await result.current.refresh();
  });
  await waitFor(() => expect(result.current.query.data?.messages).toEqual([{ id: "after" }]));
  expect(axios.post).toHaveBeenCalledWith(`/admin/api/${endpoint}`, { id: "message" }, expect.anything());
  expect(axios.get).toHaveBeenCalledTimes(1);
  expect(queryClient.getQueryState(AdminApi.getEmailSettingsQueryKey({}))?.isInvalidated).toBe(false);
});

it("preserves cached messages on mutation failure", async () => {
  const key = AdminApi.listSiteMessagesQueryKey({});
  queryClient.setQueryData(key, { messages: [{ id: "before" }] });
  jest.mocked(axios.post).mockRejectedValue(new Error("failed"));
  const { result } = renderHook(Messages.useDeleteSiteMessage, { initialProps: undefined, wrapper });
  await act(async () => {
    await expect(result.current.mutateAsync({ id: "before" })).rejects.toThrow("failed");
  });
  expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false);
  expect(queryClient.getQueryData(key)).toEqual({ messages: [{ id: "before" }] });
});

it("loads companies through a shared query for the audience picker", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { companies: [{ id: "company", name: "Company" }] } });
  const { result } = renderHook(Messages.useSiteMessageCompanies, { initialProps: undefined, wrapper });
  await waitFor(() => expect(result.current.data?.companies).toEqual([{ id: "company", name: "Company" }]));
  expect(result.current.isPending).toBe(false);
  expect(axios.get).toHaveBeenCalledTimes(1);
});
