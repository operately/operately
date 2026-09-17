import Api from "@/api";
import { QueryClient } from "@tanstack/react-query";
import { invalidateResourceHubInteractionQueries } from "./resourceHubInteractionQueries";

jest.mock("turboui", () => ({}));
jest.mock("react-router", () => ({}));

beforeEach(() => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({});
});

it.each(["resource_hub_document", "resource_hub_file", "resource_hub_link"] as const)(
  "invalidates only the matching %s, its comments, subscription, and parent lists",
  async (type) => {
    const client = new QueryClient();
    const endpoint =
      type === "resource_hub_document" ? Api.documents : type === "resource_hub_file" ? Api.files : Api.links;
    const affected = [
      endpoint.getQueryKey({ id: "resource1" }),
      endpoint.getQueryKey({ id: "renamed-resource1", includeReactions: true }),
      Api.comments.listQueryKey({ entityId: "old-resource1", entityType: type }),
      Api.notifications.isSubscribedQueryKey({ resourceId: "resource1", resourceType: type }),
      Api.resource_hubs.listNodesQueryKey({ resourceHubId: "hub1" }),
      Api.resource_hubs.listNodesQueryKey({ folderId: "folder1" }),
    ];
    const unrelated = [
      endpoint.getQueryKey({ id: "other" }),
      Api.comments.listQueryKey({ entityId: "resource1", entityType: "message" }),
      Api.comments.listQueryKey({ entityId: "other", entityType: type }),
      Api.notifications.isSubscribedQueryKey({ resourceId: "resource1", resourceType: "message" }),
      Api.notifications.isSubscribedQueryKey({ resourceId: "other", resourceType: type }),
      Api.resource_hubs.listNodesQueryKey({ resourceHubId: "other" }),
      Api.resource_hubs.listNodesQueryKey({ folderId: "other" }),
      Api.spaces.getQueryKey({ id: "space1" }),
    ];
    [...affected, ...unrelated].forEach((key) => client.setQueryData(key, {}));

    await invalidateResourceHubInteractionQueries(client, {
      id: "resource1",
      type,
      resourceHubId: "hub1",
      parentFolderId: "folder1",
    });

    affected.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
    unrelated.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
    client.clear();
  },
);

it("can mark data stale without refetching during optimistic changes or notification clearing", async () => {
  const client = new QueryClient();
  const invalidate = jest.spyOn(client, "invalidateQueries");

  await invalidateResourceHubInteractionQueries(
    client,
    {
      id: "doc1",
      type: "resource_hub_document",
      resourceHubId: "hub1",
      parentFolderId: "folder1",
    },
    "none",
  );

  expect(invalidate.mock.calls.length).toBeGreaterThan(0);
  invalidate.mock.calls.forEach(([filters]) => expect(filters?.refetchType).toBe("none"));
  client.clear();
});
