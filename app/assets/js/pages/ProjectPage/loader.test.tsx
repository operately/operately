/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setImmediate } from "timers";
import * as Pages from "@/components/Pages";
import { projectContentInputs } from "./contentQueries";
import axios from "axios";
import Api from "@/api";
import { queryClient } from "@/api/queryClient";
import { loader, projectQueryInput, useLoadedData } from "./loader";
import { projectDocsInputs, prefetchProjectDocs } from "./docsQueries";

jest.mock("axios");
jest.mock("turboui", () => ({}));
jest.mock("@/components/Pages", () => ({ useLoadedData: jest.fn() }));

const project = { id: "project-1", spaceId: "space-1", resourceHub: { id: "hub-1" } };
const response = (path: string) => ({
  data: path.endsWith("/projects/get")
    ? { project }
    : path.endsWith("/spaces/get")
      ? { space: { id: "space-1" } }
      : path.endsWith("/resource_hubs/get")
        ? { resourceHub: { id: "hub-1" } }
        : path.endsWith("/projects/count_children")
          ? { childrenCount: {} }
          : {},
});
const visit = (tab?: string) =>
  loader({
    params: { id: project.id },
    request: { url: `https://operately.test/projects/project-1${tab ? `?tab=${tab}` : ""}` } as Request,
  });
const requestedPaths = () => jest.mocked(axios.get).mock.calls.map(([path]) => path);

beforeEach(() => {
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company-1" });
  queryClient.clear();
  jest.clearAllMocks();
  jest.mocked(axios.get).mockImplementation(async (path) => response(path));
});
afterEach(() => queryClient.clear());

it.each([undefined, "overview", "activity"])("%s waits only for core queries", async (tab) => {
  const result = await visit(tab);
  expect(result.projectInput).toEqual(projectQueryInput(project.id));
  expect(result).not.toHaveProperty("data");
  expect(requestedPaths().sort()).toEqual([
    "/api/v2/projects/count_children",
    "/api/v2/projects/get",
    "/api/v2/spaces/get",
  ]);
});

it.each([
  ["check-ins", "/api/v2/projects/list_check_ins"],
  ["discussions", "/api/v2/projects/list_discussions"],
  ["tasks", "/api/v2/tasks/list"],
  ["docs-and-files", "/api/v2/resource_hubs/list_nodes"],
])("%s waits for its content even with cached core queries", async (tab, path) => {
  await visit("overview");
  jest.mocked(axios.get).mockClear();
  let finish!: (value: { data: object }) => void;
  jest.mocked(axios.get).mockImplementation((url) =>
    url === path
      ? new Promise((resolve) => {
          finish = resolve;
        })
      : Promise.resolve(response(url)),
  );
  let finished = false;
  const pending = visit(tab).then(() => {
    finished = true;
  });
  await new Promise(setImmediate);
  expect(finished).toBe(false);
  expect(requestedPaths()).toContain(path);
  expect(requestedPaths()).not.toContain("/api/v2/projects/get");
  expect(requestedPaths().filter((p) => p.includes("list_") || p.endsWith("/tasks/list"))).toEqual([path]);
  finish({ data: {} });
  await pending;
});

it.each(["tasks", "check-ins", "discussions", "docs-and-files"])("%s reuses cached content", async (tab) => {
  await visit(tab);
  jest.mocked(axios.get).mockClear();
  await visit(tab);
  expect(axios.get).not.toHaveBeenCalled();
});

it("joins in-flight docs queries and awaits both hub and nodes", async () => {
  const resolvers: Array<() => void> = [];
  jest.mocked(axios.get).mockImplementation((path) =>
    path.includes("/resource_hubs/")
      ? new Promise((resolve) => {
          resolvers.push(() => resolve(response(path)));
        })
      : Promise.resolve(response(path)),
  );
  const docs = prefetchProjectDocs(projectDocsInputs("hub-1"));
  let finished = false;
  const page = visit("docs-and-files").then(() => {
    finished = true;
  });
  await new Promise(setImmediate);
  expect(resolvers).toHaveLength(2);
  resolvers[0]?.();
  await new Promise(setImmediate);
  expect(finished).toBe(false);
  resolvers[1]?.();
  await Promise.all([docs, page]);
  expect(requestedPaths().filter((p) => p.includes("/resource_hubs/"))).toHaveLength(2);
});

it("does not request docs for a project without a resource hub", async () => {
  queryClient.setQueryData(Api.projects.getQueryKey(projectQueryInput(project.id)), { project: { id: project.id } });
  await visit("docs-and-files");
  expect(requestedPaths().some((p) => p.includes("/resource_hubs/"))).toBe(false);
});

it("propagates selected docs errors and tolerates optional space failures", async () => {
  jest
    .mocked(axios.get)
    .mockImplementation((path) =>
      path.endsWith("/spaces/get") || path.endsWith("/resource_hubs/list_nodes")
        ? Promise.reject(new Error("Unavailable"))
        : Promise.resolve(response(path)),
    );
  await expect(visit("overview")).resolves.toBeDefined();
  await expect(visit("docs-and-files")).rejects.toThrow("Unavailable");
});

it("supports calls without a request and refreshes invalidated core queries", async () => {
  await loader({ params: { id: project.id } });
  await queryClient.invalidateQueries({ queryKey: Api.projects.getQueryKeyPrefix() });
  jest.mocked(axios.get).mockClear();
  await visit("overview");
  expect(requestedPaths()).toEqual(["/api/v2/projects/get"]);
});

it("subscribes to cached core data and follows space changes without old space placeholders", async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const inputs = {
    projectInput: projectQueryInput("project-1"),
    childrenInput: { id: "project-1" },
    ...projectContentInputs("project-1"),
  };
  jest.mocked(Pages.useLoadedData).mockReturnValue(inputs);
  const key = Api.projects.getQueryKey(inputs.projectInput);
  client.setQueryData(key, { project: { id: "project-1", name: "Original", spaceId: "space-1" } });
  client.setQueryData(Api.projects.countChildrenQueryKey(inputs.childrenInput), { childrenCount: { tasksCount: 1 } });
  client.setQueryData(Api.spaces.getQueryKey({ id: "space-1", includePermissions: true }), {
    space: { id: "space-1" },
  });
  let finish!: (response: { data: object }) => void;
  jest.mocked(axios.get).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  let result!: ReturnType<typeof useLoadedData>;
  function Harness() {
    result = useLoadedData();
    return null;
  }
  const root = createRoot(document.createElement("div"));
  try {
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Harness />
        </QueryClientProvider>,
      ),
    );
    expect(axios.get).not.toHaveBeenCalled();
    expect(result.data.project.name).toBe("Original");
    await act(async () => {
      client.setQueryData(key, { project: { id: "project-1", name: "Renamed", spaceId: "space-2" } });
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(result.data.project.name).toBe("Renamed");
    expect(result.data.space).toBeNull();
    await act(async () => {
      finish({ data: { space: { id: "space-2" } } });
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(result.data.space?.id).toBe("space-2");
  } finally {
    await act(async () => root.unmount());
    client.clear();
  }
});
