/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import { setImmediate } from "timers";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { renderHook, waitFor } from "@/__tests__/renderHook";
import { invalidateGoalPageQueries } from "@/models/goals/goalPageQueries";
import { loader, useLoadedData } from "./loader";
import { useGoalContentQueries } from "./contentQueries";

jest.mock("axios");
jest.mock("react-router", () => ({}));
jest.mock("turboui", () => ({}));
jest.mock("@/components/Pages", () => ({ useLoadedData: jest.fn() }));

const response = (name = "Before") => ({
  data: {
    goal: {
      id: "goal1",
      name,
      permissions: { can_edit: true },
      privacy: "private",
      access_levels: { public: 0, company: 10, space: 40 },
    },
    work_map: [],
    check_ins: [],
    discussions: [],
    children_count: { check_ins_count: 0, discussions_count: 0, docs_and_files_count: 0 },
  },
});
const visit = (tab?: string) =>
  loader({
    params: { id: "goal1" },
    request: { url: `https://operately.test/goals/goal1${tab === undefined ? "" : `?tab=${tab}`}` } as Request,
  });
const requestedPaths = () => jest.mocked(axios.get).mock.calls.map(([path]) => path);
const read = (inputs: Awaited<ReturnType<typeof loader>>) => {
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);
  return renderHook(useLoadedData, {
    initialProps: undefined,
    wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  });
};
beforeEach(() => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company1" });
  queryClient.clear();
  jest.clearAllMocks();
  jest.mocked(axios.get).mockResolvedValue(response());
});
afterEach(() => queryClient.clear());

it("prefetches every core query and reuses them on mount and re-entry without a resource hub", async () => {
  const inputs = await visit();
  expect(inputs).not.toHaveProperty("data");
  const { result } = read(inputs);
  expect(result.current.data.goal.name).toBe("Before");

  await visit();
  expect(axios.get).toHaveBeenCalledTimes(3);
});

it("refreshes all core data after invalidation and re-entry", async () => {
  await visit();
  await invalidateGoalPageQueries(queryClient, "renamed-goal1");
  jest.mocked(axios.get).mockResolvedValue(response("After"));
  const { result } = read(await visit());
  expect(result.current.data.goal.name).toBe("After");
  expect(axios.get).toHaveBeenCalledTimes(6);
});

it("rejects missing goal data", async () => {
  jest.mocked(axios.get).mockResolvedValue({ data: {} });
  await expect(visit()).rejects.toThrow(/Goal data is unavailable/);
});

it.each(["permissions", "privacy", "access_levels"])("rejects missing required %s", async (field) => {
  const res = response();
  jest.mocked(axios.get).mockResolvedValue({ data: { ...res.data, goal: { ...res.data.goal, [field]: null } } });
  const inputs = await visit();
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    expect(() => read(inputs)).toThrow(/Goal data is unavailable/);
  } finally {
    log.mockRestore();
  }
});

it("keeps docs failures local to the Docs & Files tab", async () => {
  jest.mocked(axios.get).mockImplementation(async (url) => {
    if (String(url).includes("resource_hubs")) throw new Error("Docs unavailable");
    const res = response();
    return { data: { ...res.data, goal: { ...res.data.goal, resource_hub: { id: "hub1" } } } };
  });
  const { result } = read(await visit("docs-and-files"));
  expect(result.current.data.goal.id).toBe("goal1");
  expect(axios.get).toHaveBeenCalledTimes(5);
});

it("rejects missing required child data instead of showing an incomplete page", async () => {
  const res = response();
  jest.mocked(axios.get).mockResolvedValue({ data: { ...res.data, children_count: undefined } });
  const inputs = await visit();
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    expect(() => read(inputs)).toThrow(/Goal content is unavailable/);
  } finally {
    log.mockRestore();
  }
});

it.each([
  [undefined, "/api/v2/companies/get_work_map"],
  ["", "/api/v2/companies/get_work_map"],
  ["overview", "/api/v2/companies/get_work_map"],
  ["activity", null],
  ["check-ins", "/api/v2/goals/list_check_ins"],
  ["discussions", "/api/v2/goals/list_discussions"],
])("%s requests only core data and selected content", async (tab, selectedPath) => {
  const res = response();
  jest
    .mocked(axios.get)
    .mockResolvedValue({ data: { ...res.data, goal: { ...res.data.goal, resource_hub: { id: "hub1" } } } });
  await visit(tab);
  expect(requestedPaths().sort()).toEqual(
    ["/api/v2/goals/get", "/api/v2/goals/count_children", ...(selectedPath ? [selectedPath] : [])].sort(),
  );
});

it.each([
  ["overview", "/api/v2/companies/get_work_map"],
  ["check-ins", "/api/v2/goals/list_check_ins"],
  ["discussions", "/api/v2/goals/list_discussions"],
])("%s awaits selected content even with cached core data", async (tab, selectedPath) => {
  await visit("activity");
  jest.mocked(axios.get).mockClear();
  let finish: (value: ReturnType<typeof response>) => void = () => {
    throw new Error("Request not started");
  };
  jest.mocked(axios.get).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  let finished = false;
  const pending = visit(tab).then(() => {
    finished = true;
  });
  await new Promise(setImmediate);
  expect(finished).toBe(false);
  expect(requestedPaths()).toEqual([selectedPath]);
  finish(response());
  await pending;
  await visit(tab);
  expect(axios.get).toHaveBeenCalledTimes(1);
});

it("awaits and deduplicates all docs requests on a direct visit", async () => {
  const resolvers: Array<() => void> = [];
  jest.mocked(axios.get).mockImplementation((path) => {
    if (path.includes("resource_hubs"))
      return new Promise((resolve) => {
        resolvers.push(() => resolve({ data: {} }));
      });
    const res = response();
    return Promise.resolve({ data: { ...res.data, goal: { ...res.data.goal, resource_hub: { id: "hub1" } } } });
  });
  let finished = false;
  const first = visit("docs-and-files").then(() => {
    finished = true;
  });
  const second = visit("docs-and-files");
  await new Promise(setImmediate);
  expect(resolvers).toHaveLength(3);
  resolvers[0]?.();
  resolvers[1]?.();
  await new Promise(setImmediate);
  expect(finished).toBe(false);
  resolvers[2]?.();
  await Promise.all([first, second]);
  expect(requestedPaths()).toHaveLength(5);
  await visit("docs-and-files");
  expect(requestedPaths()).toHaveLength(5);
});

it("loads overview content when docs are requested without a resource hub", async () => {
  await visit("docs-and-files");
  expect(requestedPaths().sort()).toEqual([
    "/api/v2/companies/get_work_map",
    "/api/v2/goals/count_children",
    "/api/v2/goals/get",
  ]);
});

it.each(["/api/v2/goals/get", "/api/v2/goals/count_children"])(
  "propagates required request failures: %s",
  async (failedPath) => {
    jest
      .mocked(axios.get)
      .mockImplementation((path) =>
        path === failedPath ? Promise.reject(new Error("Unavailable")) : Promise.resolve(response()),
      );
    await expect(visit("check-ins")).rejects.toThrow("Unavailable");
  },
);

it("renders core data without subscribing to inactive content", async () => {
  const inputs = await visit("activity");
  const { result } = read(inputs);
  expect(result.current.data.goal.id).toBe("goal1");
  expect(requestedPaths().sort()).toEqual(["/api/v2/goals/count_children", "/api/v2/goals/get"]);
});

it("supports loader calls without a request", async () => {
  await loader({ params: { id: "goal1" } });
  expect(requestedPaths()).toContain("/api/v2/companies/get_work_map");
  expect(requestedPaths()).toHaveLength(3);
});

it.each([
  [undefined, "/api/v2/companies/get_work_map", "relatedWorkError", "retryRelatedWork"],
  ["overview", "/api/v2/companies/get_work_map", "relatedWorkError", "retryRelatedWork"],
  ["check-ins", "/api/v2/goals/list_check_ins", "checkInsError", "retryCheckIns"],
  ["discussions", "/api/v2/goals/list_discussions", "discussionsError", "retryDiscussions"],
  ["docs-and-files", "/api/v2/companies/get_work_map", "relatedWorkError", "retryRelatedWork"],
] as const)(
  "mounts after a %s content failure and recovers through Retry",
  async (tab, failedPath, errorField, retryField) => {
    const error = new Error("Content unavailable");
    jest
      .mocked(axios.get)
      .mockImplementation((path) => (path === failedPath ? Promise.reject(error) : Promise.resolve(response())));

    const inputs = await visit(tab);
    const failedQueries = queryClient
      .getQueryCache()
      .getAll()
      .filter((query) => query.state.status === "error");
    expect(failedQueries).toHaveLength(1);
    expect(failedQueries[0]?.state.error).toBe(error);
    jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);

    const { result } = renderHook(
      () => {
        const loaded = useLoadedData();
        const content = useGoalContentQueries(loaded);
        return { goal: loaded.data.goal, content };
      },
      {
        initialProps: undefined,
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      },
    );
    await waitFor(() => expect(result.current.content[errorField]).toBe(true));
    expect(result.current.goal.id).toBe("goal1");

    jest.mocked(axios.get).mockClear();
    jest.mocked(axios.get).mockResolvedValue(response());
    act(() => result.current.content[retryField]());
    await waitFor(() => expect(failedQueries[0]?.state.status).toBe("success"));
    await waitFor(() => expect(result.current.content[errorField]).toBe(false));
    expect(requestedPaths()).toEqual([failedPath]);
  },
);
