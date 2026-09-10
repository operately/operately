import { QueryClient } from "@tanstack/react-query";
import Api from "@/api";
import { invalidateGoalPageQueries } from "./goalPageQueries";

jest.mock("turboui", () => ({}));

beforeAll(() => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company-1" });
});

it("invalidates every input and name variant for one goal without touching another goal", async () => {
  const client = new QueryClient();
  const affected = [
    Api.goals.getQueryKey({ id: "old-name-goal1" }),
    Api.goals.getQueryKey({ id: "new-name-goal1", includeMarkdown: true }),
    Api.goals.countChildrenQueryKey({ id: "goal1" }),
  ];
  const unrelated = [
    Api.goals.getQueryKey({ id: "other-goal2" }),
    Api.goals.countChildrenQueryKey({ id: "goal2" }),
    Api.goals.listQueryKey({}),
  ];
  [...affected, ...unrelated].forEach((key) => client.setQueryData(key, {}));
  await invalidateGoalPageQueries(client, "goal1");
  affected.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
  unrelated.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
  client.clear();
});
