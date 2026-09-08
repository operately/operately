import Api from "@/api";
import { QueryClient } from "@tanstack/react-query";
import { invalidateCommentQueries } from "./commentLifecycle";

it("invalidates comment lists, task subscriptions, and activity feeds across cached inputs", async () => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company-1" });
  const client = new QueryClient();
  const keys = [
    Api.comments.listQueryKey({ entityId: "task-1", entityType: "project_task" }),
    Api.comments.listQueryKey({ entityId: "task-2", entityType: "space_task" }),
    Api.tasks.getQueryKey({ id: "task-1", includeSubscriptionList: true }),
    Api.companies.listActivitiesQueryKey({ scopeId: "task-1", scopeType: "task", actions: [] }),
  ];
  const unrelated = Api.projects.listQueryKey({});
  [...keys, unrelated].forEach((key) => client.setQueryData(key, {}));
  await invalidateCommentQueries(client);
  keys.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
  expect(client.getQueryState(unrelated)?.isInvalidated).toBe(false);
  client.clear();
});
