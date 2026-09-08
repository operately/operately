/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Api, { SubscriptionList } from "@/api";
import { PageCache } from "@/routes/PageCache";
import { showErrorToast } from "turboui";
import { useSubscription } from "./useSubscription";

jest.mock("@/contexts/CurrentCompanyContext", () => ({ useMe: () => ({ id: "me" }) }));
jest.mock("@/routes/PageCache", () => ({ PageCache: { invalidate: jest.fn() } }));
jest.mock("turboui", () => ({ showErrorToast: jest.fn() }));

function deferred() {
  let resolve!: (value: object) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<object>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

function list(id: string, subscribed: boolean): SubscriptionList {
  return {
    __typename: "subscription_list",
    id,
    parentType: "project_task",
    sendToEveryone: false,
    subscriptions: [
      {
        __typename: "subscription",
        id: "sub-1",
        type: "joined",
        person: {
          __typename: "person",
          id: "me",
          fullName: "Test User",
          title: "",
          avatarUrl: null,
          email: "test@example.com",
          type: "human",
        },
        canceled: !subscribed,
      },
    ],
  };
}

describe("useSubscription", () => {
  let root: Root;
  let client: QueryClient;
  let props: Parameters<typeof useSubscription>[0];
  let hook: ReturnType<typeof useSubscription>;
  let subscribe: jest.Mock;
  let unsubscribe: jest.Mock;
  function Harness() {
    hook = useSubscription(props);
    return null;
  }
  async function render(changes = {}) {
    props = { ...props, ...changes };
    await act(async () => {
      root.render(
        <React.StrictMode>
          <QueryClientProvider client={client}>
            <Harness />
          </QueryClientProvider>
        </React.StrictMode>,
      );
    });
  }
  async function toggle(value: boolean) {
    let promise: Promise<void> = Promise.resolve();
    await act(async () => {
      promise = Promise.resolve(hook.onToggle(value));
    });
    return { promise };
  }
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    Api.default.setBasePath("/api/v2");
    Api.default.setHeaders({ "x-company-id": "company-1" });
    root = createRoot(document.createElement("div"));
    client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    props = {
      subscriptionList: list("list-1", false),
      entityType: "project_task",
      entityId: "task-1",
      cacheKey: "legacy",
      onRefresh: jest.fn().mockResolvedValue(undefined),
    };
    subscribe = jest.fn();
    unsubscribe = jest.fn();
    jest.spyOn(Api.notifications, "subscribe").mockImplementation(subscribe);
    jest.spyOn(Api.notifications, "unsubscribe").mockImplementation(unsubscribe);
    jest.spyOn(Api.notifications, "subscribeMutationOptions").mockReturnValue({ mutationFn: subscribe });
    jest.spyOn(Api.notifications, "unsubscribeMutationOptions").mockReturnValue({ mutationFn: unsubscribe });
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    client.clear();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("shows the toggle immediately and retains legacy refresh callbacks", async () => {
    const request = deferred();
    subscribe.mockReturnValue(request.promise);
    await render();
    const pending = await toggle(true);
    expect(hook.isSubscribed).toBe(true);
    await render({ subscriptionList: list("list-1", false) });
    expect(hook.isSubscribed).toBe(true);
    await act(async () => {
      request.resolve({});
      await pending.promise;
    });
    expect(hook.isSubscribed).toBe(true);
    expect(PageCache.invalidate).toHaveBeenCalledWith("legacy");
    expect(props.onRefresh).toHaveBeenCalledTimes(1);
    expect(client.getMutationCache().getAll()).toHaveLength(1);
  });

  it("ignores stale props after saving until the parent confirms the saved state", async () => {
    subscribe.mockResolvedValue({});
    await render();
    await act(async () => {
      await hook.onToggle(true);
    });
    await render({ subscriptionList: list("list-1", false) });
    expect(hook.isSubscribed).toBe(true);
    await render({ subscriptionList: list("list-1", true) });
    expect(hook.isSubscribed).toBe(true);
    // Once reconciled, later server-side changes can update the sidebar.
    await render({ subscriptionList: list("list-1", false) });
    expect(hook.isSubscribed).toBe(false);
  });

  it("accepts parent confirmation while a refresh callback is still running", async () => {
    subscribe.mockResolvedValue({});
    const refresh = deferred();
    await render({ onRefresh: () => refresh.promise });
    const pending = await toggle(true);
    await render({ subscriptionList: list("list-1", true) });
    await act(async () => {
      refresh.resolve({});
      await pending.promise;
    });
    await render({ subscriptionList: list("list-1", false) });
    expect(hook.isSubscribed).toBe(false);
  });

  it("serializes overlapping toggles and rolls both failures back to confirmed state", async () => {
    const a = deferred();
    const b = deferred();
    subscribe.mockReturnValue(a.promise);
    unsubscribe.mockReturnValue(b.promise);
    await render();
    const first = await toggle(true);
    const second = await toggle(false);
    expect(hook.isSubscribed).toBe(false);
    expect(unsubscribe).not.toHaveBeenCalled();
    await act(async () => {
      a.reject(new Error("offline"));
      await first.promise;
    });
    expect(hook.isSubscribed).toBe(false);
    await act(async () => {
      b.reject(new Error("offline"));
      await second.promise;
    });
    expect(hook.isSubscribed).toBe(false);
  });

  it("keeps the latest requested state while older toggles fail", async () => {
    const firstRequest = deferred();
    const secondRequest = deferred();
    const latestRequest = deferred();
    subscribe.mockReturnValueOnce(firstRequest.promise).mockReturnValueOnce(latestRequest.promise);
    unsubscribe.mockReturnValue(secondRequest.promise);
    await render();
    const first = await toggle(true);
    const second = await toggle(false);
    const latest = await toggle(true);
    expect(hook.isSubscribed).toBe(true);
    expect(subscribe).toHaveBeenCalledTimes(1);
    await act(async () => {
      firstRequest.reject(new Error("offline"));
      await first.promise;
    });
    expect(hook.isSubscribed).toBe(true);
    await act(async () => {
      secondRequest.reject(new Error("offline"));
      await second.promise;
    });
    expect(hook.isSubscribed).toBe(true);
    await act(async () => {
      latestRequest.resolve({});
      await latest.promise;
    });
    expect(hook.isSubscribed).toBe(true);
    expect(subscribe).toHaveBeenCalledTimes(2);
  });

  it("restores the last successful state when the latest toggle fails", async () => {
    const a = deferred();
    const b = deferred();
    subscribe.mockReturnValue(a.promise);
    unsubscribe.mockReturnValue(b.promise);
    await render();
    const first = await toggle(true);
    const second = await toggle(false);
    await act(async () => {
      a.resolve({});
      await first.promise;
    });
    expect(hook.isSubscribed).toBe(false);
    await act(async () => {
      b.reject(new Error("offline"));
      await second.promise;
    });
    expect(hook.isSubscribed).toBe(true);
  });

  it("does not roll back a saved toggle when the parent refresh fails", async () => {
    subscribe.mockResolvedValue({});
    await render({ onRefresh: jest.fn().mockRejectedValue(new Error("refresh failed")) });
    await act(async () => {
      await hook.onToggle(true);
    });
    expect(hook.isSubscribed).toBe(true);
    expect(showErrorToast).not.toHaveBeenCalled();
  });

  it("ignores old-resource UI updates and refresh callbacks", async () => {
    const request = deferred();
    subscribe.mockReturnValue(request.promise);
    const oldRefresh = jest.fn();
    await render({ onRefresh: oldRefresh });
    const pending = await toggle(true);
    await render({ entityId: "task-2", subscriptionList: list("list-2", false), onRefresh: jest.fn() });
    await act(async () => {
      request.resolve({});
      await pending.promise;
    });
    expect(hook.isSubscribed).toBe(false);
    expect(oldRefresh).not.toHaveBeenCalled();
  });

  it("does not refresh or update the UI after unmount", async () => {
    const request = deferred();
    subscribe.mockReturnValue(request.promise);
    await render();
    const pending = await toggle(true);
    await act(async () => root.unmount());
    await act(async () => {
      request.resolve({});
      await pending.promise;
    });
    expect(props.onRefresh).not.toHaveBeenCalled();
  });

  it("does nothing without a subscription list", async () => {
    await render({ subscriptionList: null });
    await act(async () => {
      await hook.onToggle(true);
    });
    expect(hook.hidden).toBe(true);
    expect(subscribe).not.toHaveBeenCalled();
  });
});
