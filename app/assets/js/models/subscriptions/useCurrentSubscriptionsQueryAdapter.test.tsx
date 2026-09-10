/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Api, { type SubscriptionList } from "@/api";
import { useCurrentSubscriptionsQueryAdapter } from "./useCurrentSubscriptionsQueryAdapter";

jest.mock("turboui", () => ({}));

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
        type: "goal_update",
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
        ...(action !== "onUnsubscribe" ? { type: "goal_update" } : {}),
        ...(action === "onEditSubscribers" ? { subscriberIds: ["person1"] } : {}),
      });
    } finally {
      await act(async () => root.unmount());
      client.clear();
      jest.restoreAllMocks();
    }
  },
);
