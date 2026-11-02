import { QueryClient, QueryObserver } from "@tanstack/react-query";
import Api from "@/api";
import { invalidateProjectPageQueries, invalidateProjectResourceHubQueries } from "./projectPageQueries";

jest.mock("turboui", () => ({}));
beforeAll(() => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company-1" });
});

it("refetches active project queries when requested", async () => {
  const client = new QueryClient();
  const queryKey = Api.projects.getQueryKey({ id: "project-1" });
  client.setQueryData(queryKey, { project: { name: "Before" } });
  const queryFn = jest.fn().mockResolvedValue({ project: { name: "After" } });
  const observer = new QueryObserver(client, { queryKey, queryFn, staleTime: Infinity });
  const unsubscribe = observer.subscribe(() => {});
  await invalidateProjectPageQueries(client, "project-1", "active");
  expect(queryFn).toHaveBeenCalledTimes(1);
  expect(client.getQueryData(queryKey)).toEqual({ project: { name: "After" } });
  unsubscribe();
  client.clear();
});

it("invalidates all hub variants while isolating other hubs and companies", async () => {
  const client = new QueryClient();
  const keys = [
    Api.resource_hubs.getQueryKey({ id: "hub-1" }),
    Api.resource_hubs.getQueryKey({ id: "hub-1", includeProject: true }),
    Api.resource_hubs.listNodesQueryKey({ resourceHubId: "hub-1" }),
    Api.resource_hubs.listNodesQueryKey({ resourceHubId: "hub-1", includeCommentsCount: true }),
    Api.resource_hubs.listDraftsQueryKey({ resourceHubId: "hub-1" }),
  ];
  const otherHub = Api.resource_hubs.listNodesQueryKey({ resourceHubId: "hub-2" });
  Api.default.setHeaders({ "x-company-id": "company-2" });
  const otherCompany = Api.resource_hubs.getQueryKey({ id: "hub-1" });
  Api.default.setHeaders({ "x-company-id": "company-1" });
  [...keys, otherHub, otherCompany].forEach((key) => client.setQueryData(key, {}));
  await invalidateProjectResourceHubQueries(client, "hub-1");
  keys.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
  [otherHub, otherCompany].forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
  client.clear();
});
jest.mock("@/routes/paths", () => ({ compareIds: (a: string, b: string) => a === b }));

it("invalidates all query variants for the changed project without touching other projects", async () => {
  const client = new QueryClient();
  const keys = [
    Api.projects.getQueryKey({ id: "project-1" }),
    Api.projects.getQueryKey({ id: "project-1", includeMilestones: true }),
    Api.projects.countChildrenQueryKey({ id: "project-1" }),
    Api.tasks.listQueryKey({ projectId: "project-1" }),
    Api.projects.listCheckInsQueryKey({ projectId: "project-1" }),
    Api.projects.listDiscussionsQueryKey({ projectId: "project-1" }),
  ];
  const unrelated = Api.projects.getQueryKey({ id: "project-2" });
  [...keys, unrelated].forEach((key) => client.setQueryData(key, {}));
  await invalidateProjectPageQueries(client, "project-1");
  keys.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
  expect(client.getQueryState(unrelated)?.isInvalidated).toBe(false);
  client.clear();
});
