/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Pages from "@/components/Pages";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import { loader, useLoadedData } from "./loader";
import { useMarkAllNotificationsRead } from "@/models/notifications/notificationLifecycle";

jest.mock("axios");
jest.mock("react-router", () => ({}));
jest.mock("turboui", () => ({}));
jest.mock("@/components/Pages", () => ({ useLoadedData: jest.fn() }));

const response = { notifications: [] };
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
beforeEach(() => {
  queryClient.clear();
  jest.clearAllMocks();
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
  jest.mocked(axios.get).mockResolvedValue({ data: response });
});
afterEach(() => queryClient.clear());

it("reuses prefetched data on mount and route re-entry", async () => {
  const inputs = await loader();
  expect(inputs).not.toHaveProperty("notifications");
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);
  const { result, unmount } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(result.current.notifications).toEqual(response.notifications);
  unmount();
  await loader();
  renderHook(useLoadedData, { initialProps: undefined, wrapper });
  expect(axios.get).toHaveBeenCalledTimes(1);
});

it("refreshes mounted data after invalidation", async () => {
  jest.mocked(Pages.useLoadedData).mockReturnValue(await loader());
  const { result } = renderHook(useLoadedData, { initialProps: undefined, wrapper });
  const updated = [{ id: "notification1", read: false }];
  jest.mocked(axios.get).mockResolvedValue({ data: { ...response, notifications: updated } });
  await act(() => queryClient.invalidateQueries({ queryKey: Api.notifications.listQueryKeyPrefix() }));
  await waitFor(() => expect(result.current.notifications).toEqual(updated));
});

it("updates the list and invalidates the unread count after marking all notifications read", async () => {
  const notifications = [
    { id: "notification1", read: false },
    { id: "notification2", read: false },
  ];
  jest.mocked(axios.get).mockResolvedValue({ data: { notifications } });
  jest.mocked(Pages.useLoadedData).mockReturnValue(await loader());
  const countKey = Api.notifications.getUnreadCountQueryKey({});
  queryClient.setQueryData(countKey, { unread: 2 });
  const { result } = renderHook(() => ({ data: useLoadedData(), markAll: useMarkAllNotificationsRead() }), {
    initialProps: undefined,
    wrapper,
  });
  jest.mocked(axios.post).mockResolvedValue({ data: {} });
  jest
    .mocked(axios.get)
    .mockResolvedValue({ data: { notifications: notifications.map((item) => ({ ...item, read: true })) } });
  await act(() => result.current.markAll.mutateAsync({}));
  await waitFor(() => expect(result.current.data.notifications.every((item) => item.read)).toBe(true));
  expect(queryClient.getQueryState(countKey)?.isInvalidated).toBe(true);
});
