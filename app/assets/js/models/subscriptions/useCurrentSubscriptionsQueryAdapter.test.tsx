/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Api, { type SubscriptionList } from "@/api";
import { useCurrentSubscriptionsQueryAdapter } from "./useCurrentSubscriptionsQueryAdapter";

jest.mock("turboui", () => ({}));

it.each(["onSubscribe", "onUnsubscribe", "onEditSubscribers"] as const)(
  "%s skips missing lists and waits for refresh when a list becomes available",
  async (action) => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const save = jest.fn().mockResolvedValue({});
    for (const name of [
      "subscribeMutationOptions",
      "unsubscribeMutationOptions",
      "updateSubscriptionsListMutationOptions",
    ] as const) {
      jest.spyOn(Api.notifications, name).mockReturnValue({ mutationFn: save });
    }

    let finishRefresh: () => void = () => {};
    const refreshPromise = new Promise<void>((resolve) => {
      finishRefresh = resolve;
    });
    const refresh = jest.fn(() => refreshPromise);
    const client = new QueryClient();
    let hook: ReturnType<typeof useCurrentSubscriptionsQueryAdapter>;
    function Harness({ subscriptionList }: { subscriptionList?: SubscriptionList | null }) {
      hook = useCurrentSubscriptionsQueryAdapter({
        potentialSubscribers: [],
        subscriptionList,
        resourceName: "check-in",
        type: "project_check_in",
        onRefresh: refresh,
      });
      return null;
    }
    const root = createRoot(document.createElement("div"));
    const render = (subscriptionList?: SubscriptionList | null) =>
      root.render(
        <QueryClientProvider client={client}>
          <Harness subscriptionList={subscriptionList} />
        </QueryClientProvider>,
      );
    try {
      for (const missing of [undefined, null]) {
        await act(async () => render(missing));
        await act(async () => {
          await hook[action](["person1"]);
        });
      }
      expect(save).not.toHaveBeenCalled();
      expect(refresh).not.toHaveBeenCalled();

      await act(async () => render({ id: "list1" } as SubscriptionList));
      let finished = false;
      let pending: Promise<void> | undefined;
      await act(async () => {
        pending = hook[action](["person1"]).then(() => {
          finished = true;
        });
      });
      expect(refresh).toHaveBeenCalledTimes(1);
      expect(finished).toBe(false);
      await act(async () => {
        finishRefresh();
        await pending;
      });
      expect(finished).toBe(true);
      await act(async () => render(null));
      await act(async () => {
        await hook[action](["person1"]);
      });
      expect(save).toHaveBeenCalledTimes(1);
    } finally {
      finishRefresh();
      await act(async () => root.unmount());
      client.clear();
      jest.restoreAllMocks();
    }
  },
);

describe.each(["goal_update", "project_check_in", "comment_thread", "project_retrospective"] as const)(
  "%s subscriptions",
  (type) => {
    it.each(["onSubscribe", "onUnsubscribe", "onEditSubscribers"] as const)(
      "%s refreshes only after success",
      async (action) => {
        (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

        const save = jest.fn().mockRejectedValueOnce(new Error("failed")).mockResolvedValue({});
        const refresh = jest.fn().mockResolvedValue(undefined);

        for (const name of [
          "subscribeMutationOptions",
          "unsubscribeMutationOptions",
          "updateSubscriptionsListMutationOptions",
        ] as const) {
          jest.spyOn(Api.notifications, name).mockReturnValue({ mutationFn: save });
        }

        const client = new QueryClient();
        let hook: ReturnType<typeof useCurrentSubscriptionsQueryAdapter>;

        function Harness() {
          hook = useCurrentSubscriptionsQueryAdapter({
            potentialSubscribers: [],
            subscriptionList: { id: "list1" } as SubscriptionList,
            resourceName: "check-in",
            type,
            onRefresh: refresh,
          });

          return null;
        }

        const root = createRoot(document.createElement("div"));

        try {
          await act(async () =>
            root.render(
              <QueryClientProvider client={client}>
                <Harness />
              </QueryClientProvider>,
            ),
          );

          await act(async () => {
            await expect(hook[action](["person1"])).rejects.toThrow("failed");
          });

          expect(refresh).not.toHaveBeenCalled();

          await act(async () => {
            await hook[action](["person1"]);
          });

          expect(refresh).toHaveBeenCalledTimes(1);
          expect(save.mock.calls[1]?.[0]).toEqual({
            subscriptionListId: "list1",
            ...(action !== "onUnsubscribe" ? { type } : {}),
            ...(action === "onEditSubscribers" ? { subscriberIds: ["person1"] } : {}),
          });
        } finally {
          await act(async () => root.unmount());
          client.clear();
          jest.restoreAllMocks();
        }
      },
    );
  },
);
