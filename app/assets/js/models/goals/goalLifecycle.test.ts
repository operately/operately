import Api from "@/api";
import { QueryClient } from "@tanstack/react-query";
import {
  invalidateGoalRetrospectiveQueries,
  invalidateGoalLifecycleQueries,
  invalidateClosedGoalQueries,
} from "./goalLifecycle";

jest.mock("turboui", () => ({}));

beforeAll(() => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company-1" });
});

it("acknowledges only the specified goal and activity, including URL name variants", async () => {
  const client = new QueryClient();
  const affected = [
    Api.companies.getActivityQueryKey({ id: "old-name-activity1" }),
    Api.companies.getActivityQueryKey({ id: "activity1", includePermissions: true }),
    Api.goals.getQueryKey({ id: "goal1" }),
    Api.goals.getQueryKey({ id: "goal1", includeRetrospective: true }),
  ];
  const unrelated = [
    Api.companies.getActivityQueryKey({ id: "activity2" }),
    Api.goals.getQueryKey({ id: "goal2" }),
    Api.goals.listQueryKey({}),
  ];
  [...affected, ...unrelated].forEach((key) => client.setQueryData(key, {}));
  await invalidateGoalRetrospectiveQueries(client, "goal1", "activity1");
  affected.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
  unrelated.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
  client.clear();
});

it.each([
  ["creation", invalidateGoalLifecycleQueries, false],
  ["closing/reopening", invalidateClosedGoalQueries, true],
] as const)(
  "invalidates affected goals and shared collections after %s",
  async (_name, invalidate, includesActivity) => {
    const client = new QueryClient();
    const affected = [
      Api.goals.getQueryKey({ id: "goal1" }),
      Api.goals.getQueryKey({ id: "renamed-goal1", includeMarkdown: true }),
      Api.goals.getQueryKey({ id: "parent1" }),
      Api.goals.countChildrenQueryKey({ id: "goal1" }),
      Api.goals.countChildrenQueryKey({ id: "parent1" }),
      Api.goals.listQueryKey({}),
      Api.goals.listQueryKey({ includeSpace: true }),
      Api.companies.getWorkMapQueryKey({}),
      Api.companies.getWorkMapQueryKey({ spaceId: "space1" }),
      Api.companies.listActivitiesQueryKey({ scopeType: "goal", scopeId: "goal1", actions: [] }),
    ];
    const unrelated = [
      Api.goals.getQueryKey({ id: "goal2" }),
      Api.goals.countChildrenQueryKey({ id: "goal2" }),
      Api.projects.listQueryKey({}),
    ];
    [...affected, ...unrelated].forEach((key) => client.setQueryData(key, {}));
    const activity = Api.companies.getActivityQueryKey({ id: "activity1" });
    const otherActivity = Api.companies.getActivityQueryKey({ id: "activity2" });
    client.setQueryData(activity, { activity: { content: { goal: { id: "old-name-goal1" } } } });
    client.setQueryData(otherActivity, { activity: { content: { goal: { id: "goal2" } } } });
    await invalidate(client, "goal1", "parent1");
    affected.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
    unrelated.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
    expect(client.getQueryState(activity)?.isInvalidated).toBe(includesActivity);
    expect(client.getQueryState(otherActivity)?.isInvalidated).toBe(false);
    client.clear();
  },
);

it("does not invalidate other goal details when creation has no parent or returned goal", async () => {
  const client = new QueryClient();
  const key = Api.goals.getQueryKey({ id: "goal2" });
  client.setQueryData(key, {});
  await invalidateGoalLifecycleQueries(client, undefined);
  expect(client.getQueryState(key)?.isInvalidated).toBe(false);
  client.clear();
});
