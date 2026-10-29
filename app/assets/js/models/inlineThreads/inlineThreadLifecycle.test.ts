import Api from "@/api";
import { QueryClient } from "@tanstack/react-query";
import { invalidateInlineThreadQueries } from "./inlineThreadLifecycle";
import { invalidateResourceHubQueries } from "../resourceHubs/resourceHubLifecycle";
import { invalidateTaskListQueries } from "../richContent/taskListLifecycle";

beforeEach(() => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company-1" });
});

it.each(["thread", "document", "checkbox"])("refreshes thread data after %s changes", async (action) => {
  const client = new QueryClient();
  const threads = Api.inline_threads.listQueryKey({ resourceType: "resource_hub_document", resourceId: "doc-1" });
  const unrelated = Api.projects.getQueryKey({ id: "project-1" });
  [threads, unrelated].forEach((key) => client.setQueryData(key, {}));
  if (action === "thread") await invalidateInlineThreadQueries(client);
  if (action === "document") await invalidateResourceHubQueries(client, { documentId: "doc-1" });
  if (action === "checkbox") await invalidateTaskListQueries(client, "document");
  expect(client.getQueryState(threads)?.isInvalidated).toBe(true);
  expect(client.getQueryState(unrelated)?.isInvalidated).toBe(false);
  client.clear();
});
