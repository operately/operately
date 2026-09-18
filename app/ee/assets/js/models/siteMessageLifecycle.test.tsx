/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
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
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({});
});
afterEach(() => queryClient.clear());
import * as Messages from "./siteMessageLifecycle";

it.each([
  [Messages.useCreateSiteMessage, "create_site_message"],
  [Messages.useUpdateSiteMessage, "update_site_message"],
  [Messages.useDeleteSiteMessage, "delete_site_message"],
] as const)("refreshes the mounted message list after %s", async (hook, endpoint) => {
  Api.default.setHeaders({ "x-company-id": "other-company" });
  const otherCompanyKey = Api.site_messages.listActiveQueryKey({});
  queryClient.setQueryData(otherCompanyKey, { messages: [{ id: "before" }] });
  Api.default.setHeaders({ "x-company-id": "current-company" });
  const companyKey = Api.site_messages.listActiveQueryKey({});
  queryClient.setQueryData(companyKey, { messages: [{ id: "before" }] });
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
  expect(queryClient.getQueryState(companyKey)?.isInvalidated).toBe(true);
  expect(queryClient.getQueryState(otherCompanyKey)?.isInvalidated).toBe(true);
  expect(queryClient.getQueryData(otherCompanyKey)).toEqual({ messages: [{ id: "before" }] });
  expect(queryClient.getQueryState(AdminApi.getEmailSettingsQueryKey({}))?.isInvalidated).toBe(false);
});

it("preserves cached messages on mutation failure", async () => {
  const publicKey = Api.site_messages.listActiveQueryKey({});
  queryClient.setQueryData(publicKey, { messages: [] });
  const key = AdminApi.listSiteMessagesQueryKey({});
  queryClient.setQueryData(key, { messages: [{ id: "before" }] });
  jest.mocked(axios.post).mockRejectedValue(new Error("failed"));
  const { result } = renderHook(Messages.useDeleteSiteMessage, { initialProps: undefined, wrapper });
  await act(async () => {
    await expect(result.current.mutateAsync({ id: "before" })).rejects.toThrow("failed");
  });
  expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false);
  expect(queryClient.getQueryState(publicKey)?.isInvalidated).toBe(false);
  expect(queryClient.getQueryData(key)).toEqual({ messages: [{ id: "before" }] });
});

it("loads companies through a shared query for the audience picker", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: { companies: [{ id: "company", name: "Company" }] } });
  const { result } = renderHook(Messages.useSiteMessageCompanies, { initialProps: undefined, wrapper });
  await waitFor(() => expect(result.current.data?.companies).toEqual([{ id: "company", name: "Company" }]));
  expect(result.current.isPending).toBe(false);
  expect(axios.get).toHaveBeenCalledTimes(1);
});

it("refreshes only the active company's banner even if an outgoing company still has an observer", async () => {
  Api.default.setHeaders({ "x-company-id": "outgoing" });
  const outgoingOptions = Api.site_messages.listActiveQueryOptions({});
  queryClient.setQueryData(Api.site_messages.listActiveQueryKey({}), { messages: [{ id: "old" }] });
  Api.default.setHeaders({ "x-company-id": "current" });
  const currentOptions = Api.site_messages.listActiveQueryOptions({});
  queryClient.setQueryData(Api.site_messages.listActiveQueryKey({}), { messages: [{ id: "old" }] });
  jest.mocked(axios.post).mockResolvedValue({ data: {} });
  jest.mocked(axios.get).mockResolvedValue({ data: { messages: [{ id: "new" }] } });
  const { result } = renderHook(
    () => ({
      mutation: Messages.useDeleteSiteMessage(),
      outgoing: useLoadedQuery(outgoingOptions),
      current: useLoadedQuery(currentOptions),
    }),
    { initialProps: undefined, wrapper },
  );
  await act(async () => {
    await result.current.mutation.mutateAsync({ id: "old" });
  });
  await waitFor(() => expect(result.current.current.data?.messages).toEqual([{ id: "new" }]));
  expect(result.current.outgoing.data?.messages).toEqual([{ id: "old" }]);
  expect(axios.get).toHaveBeenCalledTimes(1);
  expect(axios.get).toHaveBeenCalledWith("/api/v2/site_messages/list_active", {
    params: {},
    headers: { "x-company-id": "current" },
  });
  expect(queryClient.getQueryState(outgoingOptions.queryKey)?.isInvalidated).toBe(true);
});
