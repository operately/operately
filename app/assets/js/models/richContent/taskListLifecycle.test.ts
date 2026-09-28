import Api from "@/api";
import { QueryClient } from "@tanstack/react-query";
import { invalidateTaskListQueries } from "./taskListLifecycle";

it("refreshes documents and history without invalidating unrelated resources", async () => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company-1" });
  const client = new QueryClient();
  const keys = [Api.documents.getQueryKey({ id: "doc" }), Api.documents.listVersionsQueryKey({ documentId: "doc" })];
  const unrelated = Api.projects.getQueryKey({ id: "project" });
  [...keys, unrelated].forEach((key) => client.setQueryData(key, {}));
  await invalidateTaskListQueries(client, "document");
  keys.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
  expect(client.getQueryState(unrelated)?.isInvalidated).toBe(false);
  client.clear();
});

it("refreshes comment lists and embedded milestone comments", async () => {
  Api.default.setBasePath("/api/v2");
  const client = new QueryClient();
  const keys = [
    Api.comments.listQueryKey({ entityId: "task", entityType: "project_task" }),
    Api.projects.getMilestoneQueryKey({ id: "milestone", includeComments: true }),
  ];
  keys.forEach((key) => client.setQueryData(key, {}));
  await invalidateTaskListQueries(client, "comment");
  keys.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
  client.clear();
});
