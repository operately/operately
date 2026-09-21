import { QueryClient, QueryObserver } from "@tanstack/react-query";
import Api from "@/api";
import { invalidateProjectInteractionQueries } from "./projectInteractionQueries";

jest.mock("turboui", () => ({}));
jest.mock("@/routes/paths", () => ({ compareIds: jest.requireActual("@/routes/paths").compareIds }));

beforeEach(() => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
});

it.each(["project_check_in", "project_discussion", "project_retrospective"] as const)(
  "invalidates %s variants and related project data, leaving other resources intact",
  async (resourceType) => {
    const client = new QueryClient();
    const subscriptionType = resourceType === "project_discussion" ? "comment_thread" : resourceType;
    const resourceKeys =
      resourceType === "project_check_in"
        ? [
            Api.projects.getCheckInQueryKey({ id: "old-resource1" }),
            Api.projects.getCheckInQueryKey({ id: "resource1", includeProject: true }),
            Api.projects.listCheckInsQueryKey({ projectId: "old-project1" }),
          ]
        : resourceType === "project_discussion"
          ? [
              Api.projects.getDiscussionQueryKey({ id: "old-resource1" }),
              Api.projects.getDiscussionQueryKey({ id: "resource1", includeProject: true }),
              Api.projects.listDiscussionsQueryKey({ projectId: "old-project1" }),
            ]
          : [
              Api.projects.getRetrospectiveQueryKey({ projectId: "old-project1" }),
              Api.projects.getRetrospectiveQueryKey({ projectId: "project1", includeProject: true }),
            ];
    const affected = [
      ...resourceKeys,
      Api.comments.listQueryKey({ entityId: "old-resource1", entityType: resourceType }),
      Api.notifications.isSubscribedQueryKey({ resourceId: "old-resource1", resourceType: subscriptionType }),
      Api.projects.getQueryKey({ id: "old-project1" }),
      Api.companies.listActivitiesQueryKey({ actions: [], scopeType: "space", scopeId: "space1" }),
      Api.companies.getActivityQueryKey({ id: "old-activity1" }),
      Api.companies.listActivitiesQueryKey({ actions: [], scopeType: "project", scopeId: "old-project1" }),
      [...Api.companies.listActivitiesQueryKey({ actions: [], scopeType: "company", scopeId: "company1" }), "infinite"],
    ];
    const unrelated = [
      Api.comments.listQueryKey({ entityId: "resource2", entityType: resourceType }),
      Api.comments.listQueryKey({ entityId: "resource1", entityType: "project_task" }),
      Api.notifications.isSubscribedQueryKey({ resourceId: "resource2", resourceType: subscriptionType }),
      Api.projects.getQueryKey({ id: "project2" }),
      Api.projects.getCheckInQueryKey({ id: "resource2" }),
      Api.projects.getDiscussionQueryKey({ id: "resource2" }),
      Api.projects.getRetrospectiveQueryKey({ projectId: "project2" }),
      Api.companies.getActivityQueryKey({ id: "activity2" }),
      Api.companies.listActivitiesQueryKey({ actions: [], scopeType: "project", scopeId: "project2" }),
      Api.tasks.listQueryKey({ projectId: "project1" }),
      Api.companies.listActivitiesQueryKey({ actions: [], scopeType: "space", scopeId: "space2" }),
      Api.companies.listActivitiesQueryKey({ actions: [], scopeType: "goal", scopeId: "goal1" }),
    ];
    [...affected, ...unrelated].forEach((key) => client.setQueryData(key, {}));
    Api.default.setHeaders({ "x-company-id": "company2" });
    const otherCompany = Api.comments.listQueryKey({ entityId: "resource1", entityType: resourceType });
    client.setQueryData(otherCompany, {});
    Api.default.setHeaders({ "x-company-id": "company1" });

    await invalidateProjectInteractionQueries(
      client,
      { projectId: "project1", resourceId: "resource1", resourceType, activityId: "activity1", spaceId: "space1" },
      "none",
    );

    affected.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
    [...unrelated, otherCompany].forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
    client.clear();
  },
);

it.each([
  ["project_check_in", { checkIn: { id: "old-resource1" } }],
  ["project_check_in", { checkInId: "resource1" }],
  ["project_check_in", { activity: { content: { checkInId: "resource1" } } }],
  ["project_discussion", { discussion: { id: "resource1" } }],
  ["project_retrospective", { retrospectiveId: "resource1" }],
  ["project_retrospective", { __typename: "activity_content_project_closed", project: { id: "project1" } }],
] as const)("finds related %s activities and invalidates all their cached variants", async (resourceType, content) => {
  const client = new QueryClient();
  const activity = Api.companies.getActivityQueryKey({ id: "activity1" });
  const variant = Api.companies.getActivityQueryKey({ id: "old-activity1", includePermissions: true });
  const unrelated = Api.companies.getActivityQueryKey({ id: "activity2" });
  client.setQueryData(activity, { activity: { id: "activity1", content } });
  client.setQueryData(variant, {});
  client.setQueryData(unrelated, { activity: { id: "activity2", content: { project: { id: "project2" } } } });

  await invalidateProjectInteractionQueries(client, { projectId: "project1", resourceId: "resource1", resourceType });

  expect(client.getQueryState(activity)?.isInvalidated).toBe(true);
  expect(client.getQueryState(variant)?.isInvalidated).toBe(true);
  expect(client.getQueryState(unrelated)?.isInvalidated).toBe(false);
  client.clear();
});

it("matches activity threads and honors none versus active refetch modes", async () => {
  const client = new QueryClient();
  const queryKey = Api.companies.getActivityQueryKey({ id: "activity1" });
  const data = { activity: { id: "activity1", commentThread: { id: "old-resource1" } } };
  client.setQueryData(queryKey, data);
  const queryFn = jest.fn(async () => data);
  const observer = new QueryObserver(client, { queryKey, queryFn, staleTime: Infinity });
  const unsubscribe = observer.subscribe(() => {});
  const context = { projectId: "project1", resourceId: "resource1", resourceType: "project_discussion" as const };

  await invalidateProjectInteractionQueries(client, context, "none");
  expect(queryFn).not.toHaveBeenCalled();
  await invalidateProjectInteractionQueries(client, context, "active");
  expect(queryFn).toHaveBeenCalledTimes(1);

  unsubscribe();
  client.clear();
});
