/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Api, { type Notification } from "@/api";
import { useReadNotifications } from "./notificationLifecycle";
import { publish } from "@/signals";

jest.mock("@/signals", () => ({ publish: jest.fn(), LocalSignal: { RefreshNotificationCount: "refresh" } }));
jest.mock("react-router", () => ({}));
jest.mock("turboui", () => ({}));

it("reads only unread IDs once, updates unread caches and permits retry after failure", async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({});

  const save = jest.fn().mockRejectedValueOnce(new Error("failed")).mockResolvedValue({});
  jest.spyOn(Api.notifications, "markManyAsReadMutationOptions").mockReturnValue({ mutationFn: save });

  const client = new QueryClient();
  const key = Api.notifications.getUnreadCountQueryKey({});
  client.setQueryData(key, { unread: 1 });

  const invalidateResourceQueries = jest.fn().mockResolvedValue(undefined);
  let read: ReturnType<typeof useReadNotifications>;

  function Harness() {
    read = useReadNotifications(invalidateResourceQueries);

    return null;
  }

  const root = createRoot(document.createElement("div"));
  const notifications = [
    { id: "unread", read: false },
    { id: "read", read: true },
  ] as Notification[];

  try {
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Harness />
        </QueryClientProvider>,
      ),
    );

    await act(async () => {
      await expect(read(notifications)).rejects.toThrow("failed");
    });

    expect(client.getQueryState(key)?.isInvalidated).toBe(false);
    expect(publish).not.toHaveBeenCalled();
    expect(invalidateResourceQueries).not.toHaveBeenCalled();

    await act(async () => {
      await read(notifications);
      await read(notifications);
    });

    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls[1]?.[0]).toEqual({ ids: ["unread"] });
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    expect(publish).toHaveBeenCalledTimes(1);
    expect(invalidateResourceQueries).toHaveBeenCalledTimes(1);
    expect(invalidateResourceQueries).toHaveBeenCalledWith(client);
  } finally {
    await act(async () => root.unmount());
    client.clear();
    jest.restoreAllMocks();
  }
});

it("invalidates the original resource when a notification read finishes after navigation", async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

  let finish: () => void = () => {};
  const save = jest.fn(
    () =>
      new Promise<{}>((resolve) => {
        finish = () => resolve({});
      }),
  );
  jest.spyOn(Api.notifications, "markManyAsReadMutationOptions").mockReturnValue({ mutationFn: save });

  const client = new QueryClient();
  const originalKey = Api.comments.listQueryKey({ entityId: "first", entityType: "project_check_in" });
  const nextKey = Api.comments.listQueryKey({ entityId: "second", entityType: "project_check_in" });
  client.setQueryData(originalKey, { comments: [] });
  client.setQueryData(nextKey, { comments: [] });

  let resourceKey = originalKey;
  let read: ReturnType<typeof useReadNotifications>;

  function Harness() {
    const key = resourceKey;
    read = useReadNotifications((queryClient) => queryClient.invalidateQueries({ queryKey: key, refetchType: "none" }));

    return null;
  }

  const root = createRoot(document.createElement("div"));
  const render = () =>
    root.render(
      <QueryClientProvider client={client}>
        <Harness />
      </QueryClientProvider>,
    );

  try {
    await act(async () => render());

    let pending: Promise<void> | undefined;

    await act(async () => {
      pending = read([{ id: "notification1", read: false } as Notification]);
    });

    expect(save).toHaveBeenCalledTimes(1);

    resourceKey = nextKey;
    await act(async () => render());

    await act(async () => {
      finish();
      await pending;
    });

    expect(client.getQueryState(originalKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(nextKey)?.isInvalidated).toBe(false);
  } finally {
    await act(async () => root.unmount());
    client.clear();
    jest.restoreAllMocks();
  }
});
