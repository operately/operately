/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import Api from "@/api";
import { projectContentInputs, useProjectContentQueries } from "./contentQueries";

jest.mock("axios");
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
let result: ReturnType<typeof useProjectContentQueries>;
let requests: Array<{ path: string; response: ReturnType<typeof deferred> }>;
function Harness({ id }: { id: string }) {
  result = useProjectContentQueries(projectContentInputs(id));
  return null;
}
async function render(id = "project-1") {
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
    "/api/v2/projects/list_check_ins",
    "/api/v2/projects/list_discussions",
    "/api/v2/tasks/list",
  ]);
  expect(result.checkInsLoading).toBe(true);
  expect(result.discussionsLoading).toBe(true);
  const emptyCheckIns = result.checkIns;
  const emptyDiscussions = result.discussions;
  await render();
  expect(result.checkIns).toBe(emptyCheckIns);
  expect(result.discussions).toBe(emptyDiscussions);
  await resolveAll({ projectCheckIns: [], discussions: [] });
  expect(result.checkInsLoading).toBe(false);
  expect(result.discussionsLoading).toBe(false);
  expect(result.discussionsError).toBe(false);
});

it("reuses loader-prefetched data without refetching on mount", async () => {
  const inputs = projectContentInputs("project-1");
  client.setQueryData(Api.projects.listCheckInsQueryKey(inputs.checkInsInput), {
    projectCheckIns: [{ id: "check-in-1" }],
  });
  client.setQueryData(Api.projects.listDiscussionsQueryKey(inputs.discussionsInput), {
    discussions: [{ id: "discussion-1" }],
  });
  client.setQueryData(Api.tasks.listQueryKey(inputs.tasksInput), { tasks: [{ id: "task-1" }] });
  await render();
  expect(result.backendTasks[0]?.id).toBe("task-1");
  expect(requests).toHaveLength(0);
  expect(result.checkIns[0]?.id).toBe("check-in-1");
  expect(result.discussions[0]?.id).toBe("discussion-1");
});

it("keeps cards visible during a refresh and refreshes all lists once", async () => {
  await render();
  await resolveAll({ projectCheckIns: [{ id: "check-in-1" }], discussions: [{ id: "discussion-1" }] });
  requests = [];
  let refreshed!: Promise<void>;
  await act(async () => {
    refreshed = result.refresh();
  });
  expect(requests).toHaveLength(3);
  expect(result.checkInsLoading).toBe(false);
  expect(result.discussionsLoading).toBe(false);
  expect(result.discussions[0]?.id).toBe("discussion-1");
  await resolveAll({ projectCheckIns: [], discussions: [] });
  await refreshed;
  expect(result.discussions).toEqual([]);
});

it("reports failure and retries only the affected query", async () => {
  await render();
  await act(async () => {
    requests.find(({ path }) => path.endsWith("list_discussions"))?.response.reject(new Error("Unavailable"));
    requests.find(({ path }) => path.endsWith("list_check_ins"))?.response.resolve({ data: { projectCheckIns: [] } });
  });
  await settle();
  expect(result.discussionsError).toBe(true);
  expect(result.discussionsLoading).toBe(false);
  expect(result.checkInsError).toBe(false);
  requests = [];
  await act(async () => result.retryDiscussions());
  expect(requests.map(({ path }) => path)).toEqual(["/api/v2/projects/list_discussions"]);
  await resolveAll({ discussions: [{ id: "recovered" }] });
  expect(result.discussionsError).toBe(false);
  expect(result.discussions[0]?.id).toBe("recovered");
});

it("never shows the previous project's data or late responses after switching projects", async () => {
  await render();
  const oldRequests = requests;
  requests = [];
  await render("project-2");
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
  await resolveAll({ discussions: [{ id: "old" }], projectCheckIns: [] });
  requests = [];
  let refresh!: Promise<void>;
  await act(async () => {
    refresh = client.invalidateQueries({ queryKey: Api.projects.listDiscussionsQueryKeyPrefix() });
  });
  expect(requests).toHaveLength(1);
  await resolveAll({ discussions: [{ id: "updated" }] });
  await refresh;
  expect(result.discussions[0]?.id).toBe("updated");
});

it("keeps tasks during refetch, retries failures, and follows task mutation invalidations", async () => {
  await render();
  expect(result.tasksLoading).toBe(true);
  const empty = result.backendTasks;
  await render();
  expect(result.backendTasks).toBe(empty);
  await resolveAll({ tasks: [{ id: "task-1" }] });
  requests = [];
  let refreshed!: Promise<void>;
  await act(async () => {
    refreshed = client.invalidateQueries({ queryKey: Api.tasks.listQueryKeyPrefix() });
  });
  expect(requests.map(({ path }) => path)).toEqual(["/api/v2/tasks/list"]);
  expect(result.tasksLoading).toBe(false);
  expect(result.backendTasks[0]?.id).toBe("task-1");
  await act(async () => {
    requests[0]?.response.reject(new Error("Unavailable"));
    await refreshed;
  });
  await settle();
  expect(result.tasksError).toBe(true);
  expect(result.backendTasks[0]?.id).toBe("task-1");
  requests = [];
  await act(async () => result.retryTasks());
  await resolveAll({ tasks: [] });
  expect(result.tasksError).toBe(false);
  expect(result.backendTasks).toEqual([]);
});

it("ignores late task responses from the previous project", async () => {
  await render();
  const previous = requests;
  requests = [];
  await render("project-2");
  await act(async () => previous.forEach(({ response }) => response.resolve({ data: { tasks: [{ id: "old" }] } })));
  await settle();
  expect(result.backendTasks).toEqual([]);
  expect(result.tasksLoading).toBe(true);
  await resolveAll({ tasks: [{ id: "new" }] });
  expect(result.backendTasks[0]?.id).toBe("new");
});
