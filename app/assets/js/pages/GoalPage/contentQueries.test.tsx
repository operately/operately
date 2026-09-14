/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import Api from "@/api";
import { invalidateGoalPageQueries } from "@/models/goals/goalPageQueries";
import { goalContentInputs, useGoalContentQueries } from "./contentQueries";

jest.mock("axios");
jest.mock("react-router", () => ({}));
jest.mock("turboui", () => ({}));

function deferred() {
  let resolve!: (response: { data: object }) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<{ data: object }>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

let client: QueryClient;
let root: Root;
let result: ReturnType<typeof useGoalContentQueries>;
let requests: Array<{ path: string; response: ReturnType<typeof deferred> }>;
function Harness({ id }: { id: string }) {
  result = useGoalContentQueries(goalContentInputs(id));
  return null;
}
async function render(id = "goal-1") {
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <Harness id={id} />
      </QueryClientProvider>,
    ),
  );
}
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}
async function resolveAll(data: object) {
  await act(async () => {
    requests.forEach(({ response }) => response.resolve({ data }));
  });
  await settle();
}

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company-1" });
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  root = createRoot(document.createElement("div"));
  requests = [];
  jest.mocked(axios.get).mockImplementation((path) => {
    const response = deferred();
    requests.push({ path, response });
    return response.promise;
  });
});
afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
  jest.clearAllMocks();
});

it("starts all queries on mount and uses stable empty lists while pending", async () => {
  await render();
  expect(requests.map(({ path }) => path).sort()).toEqual([
    "/api/v2/companies/get_work_map",
    "/api/v2/goals/list_check_ins",
    "/api/v2/goals/list_discussions",
  ]);
  expect(result.checkInsLoading).toBe(true);
  expect(result.discussionsLoading).toBe(true);
  const emptyCheckIns = result.checkIns;
  const emptyDiscussions = result.discussions;
  await render();
  expect(result.checkIns).toBe(emptyCheckIns);
  expect(result.discussions).toBe(emptyDiscussions);
  await resolveAll({ checkIns: [], discussions: [] });
  expect(result.checkInsLoading).toBe(false);
  expect(result.discussionsLoading).toBe(false);
  expect(result.discussionsError).toBe(false);
});

it("reuses loader-prefetched data without refetching on mount", async () => {
  const inputs = goalContentInputs("goal-1");
  client.setQueryData(Api.goals.listCheckInsQueryKey(inputs.checkInsInput), {
    checkIns: [{ id: "check-in-1" }],
  });
  client.setQueryData(Api.goals.listDiscussionsQueryKey(inputs.discussionsInput), {
    discussions: [{ id: "discussion-1" }],
  });
  client.setQueryData(Api.companies.getWorkMapQueryKey(inputs.workMapInput), { workMap: [{ id: "child-1" }] });
  await render();
  expect(result.workMap[0]?.id).toBe("child-1");
  expect(requests).toHaveLength(0);
  expect(result.checkIns[0]?.id).toBe("check-in-1");
  expect(result.discussions[0]?.id).toBe("discussion-1");
});

it("keeps cards visible during a refresh and refreshes all lists once", async () => {
  await render();
  await resolveAll({ checkIns: [{ id: "check-in-1" }], discussions: [{ id: "discussion-1" }] });
  requests = [];
  let refreshed!: Promise<void>;
  await act(async () => {
    refreshed = invalidateGoalPageQueries(client, "goal-1");
  });
  expect(requests).toHaveLength(3);
  expect(result.checkInsLoading).toBe(false);
  expect(result.discussionsLoading).toBe(false);
  expect(result.discussions[0]?.id).toBe("discussion-1");
  await resolveAll({ checkIns: [], discussions: [] });
  await refreshed;
  expect(result.discussions).toEqual([]);
});

it("reports failure and retries only the affected query", async () => {
  await render();
  await act(async () => {
    requests.find(({ path }) => path.endsWith("list_discussions"))?.response.reject(new Error("Unavailable"));
    requests.find(({ path }) => path.endsWith("list_check_ins"))?.response.resolve({ data: { checkIns: [] } });
  });
  await settle();
  expect(result.discussionsError).toBe(true);
  expect(result.discussionsLoading).toBe(false);
  expect(result.checkInsError).toBe(false);
  requests = [];
  await act(async () => result.retryDiscussions());
  expect(requests.map(({ path }) => path)).toEqual(["/api/v2/goals/list_discussions"]);
  await resolveAll({ discussions: [{ id: "recovered" }] });
  expect(result.discussionsError).toBe(false);
  expect(result.discussions[0]?.id).toBe("recovered");
});

it("never shows the previous goal's data or late responses after switching goals", async () => {
  await render();
  const oldRequests = requests;
  requests = [];
  await render("goal-2");
  expect(result.discussions).toEqual([]);
  expect(result.discussionsLoading).toBe(true);
  await act(async () =>
    oldRequests.forEach(({ response }) => response.resolve({ data: { discussions: [{ id: "old" }] } })),
  );
  await settle();
  expect(result.discussions).toEqual([]);
  await resolveAll({ discussions: [{ id: "new" }] });
  expect(result.discussions[0]?.id).toBe("new");
});

it("responds to existing mutation invalidation prefixes", async () => {
  await render();
  await resolveAll({ discussions: [{ id: "old" }], checkIns: [] });
  requests = [];
  let refresh!: Promise<void>;
  await act(async () => {
    refresh = client.invalidateQueries({ queryKey: Api.goals.listDiscussionsQueryKeyPrefix() });
  });
  expect(requests).toHaveLength(1);
  await resolveAll({ discussions: [{ id: "updated" }] });
  await refresh;
  expect(result.discussions[0]?.id).toBe("updated");
});

it("keeps related work during refetch, retries failures, and follows work map mutation invalidations", async () => {
  await render();
  expect(result.relatedWorkLoading).toBe(true);
  const empty = result.workMap;
  await render();
  expect(result.workMap).toBe(empty);
  await resolveAll({ workMap: [{ id: "child-1" }] });
  requests = [];
  let refreshed!: Promise<void>;
  await act(async () => {
    refreshed = client.invalidateQueries({ queryKey: Api.companies.getWorkMapQueryKeyPrefix() });
  });
  expect(requests.map(({ path }) => path)).toEqual(["/api/v2/companies/get_work_map"]);
  expect(result.relatedWorkLoading).toBe(false);
  expect(result.workMap[0]?.id).toBe("child-1");
  await act(async () => {
    requests[0]?.response.reject(new Error("Unavailable"));
    await refreshed;
  });
  await settle();
  expect(result.relatedWorkError).toBe(true);
  expect(result.workMap[0]?.id).toBe("child-1");
  requests = [];
  await act(async () => result.retryRelatedWork());
  await resolveAll({ workMap: [] });
  expect(result.relatedWorkError).toBe(false);
  expect(result.workMap).toEqual([]);
});

it("ignores late work map responses from the previous goal", async () => {
  await render();
  const previous = requests;
  requests = [];
  await render("goal-2");
  await act(async () => previous.forEach(({ response }) => response.resolve({ data: { workMap: [{ id: "old" }] } })));
  await settle();
  expect(result.workMap).toEqual([]);
  expect(result.relatedWorkLoading).toBe(true);
  await resolveAll({ workMap: [{ id: "new" }] });
  expect(result.workMap[0]?.id).toBe("new");
});

it("reads the goal-specific discussion payload used by the serializer", async () => {
  await render();
  await resolveAll({
    discussions: [
      {
        id: "discussion-1",
        activity_id: "activity-1",
        comment_count: 2,
        content: "{}",
        author: { id: "person-1" },
      },
    ],
  });
  expect(result.discussions[0]).toMatchObject({ activityId: "activity-1", commentCount: 2, content: "{}" });
});
