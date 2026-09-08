import { QueryClient } from "@tanstack/react-query";
import Api from "@/api";
import { invalidateProjectPageQueries } from "./projectPageQueries";

jest.mock("turboui", () => ({}));
beforeAll(() => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company-1" });
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
