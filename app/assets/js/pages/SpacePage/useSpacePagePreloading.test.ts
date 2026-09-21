/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import type { SpaceTools } from "@/api";
import { renderHook } from "@/__tests__/renderHook";
import { usePredictivePreloading } from "@/routes/preloading/PagePreloading";
import { useSpacePagePreloading } from "./useSpacePagePreloading";

jest.mock("@/routes/preloading/PagePreloading", () => ({ usePredictivePreloading: jest.fn() }));
jest.mock("@/routes/paths", () => ({
  usePaths: () => ({
    spaceWorkMapPath: (id: string) => `/spaces/${id}/work-map`,
    discussionsPath: (id: string) => `/spaces/${id}/discussions`,
    resourceHubPath: (id: string) => `/hubs/${id}`,
    spaceKanbanPath: (id: string) => `/spaces/${id}/kanban`,
    spaceKpisPath: (id: string) => `/spaces/${id}/kpis`,
    spaceProjectTemplatesPath: (id: string) => `/spaces/${id}/templates`,
  }),
}));

const tools: SpaceTools = {
  __typename: "space_tools",
  tasksEnabled: true,
  discussionsEnabled: true,
  resourceHubEnabled: true,
  kpisEnabled: true,
  templatesEnabled: true,
  projects: [],
  goals: [],
  tasks: [],
  kpis: [],
  templates: [],
  messagesBoards: [{ __typename: "messages_board", id: "board" }],
  resourceHubs: [
    { __typename: "resource_hub", id: "docs", name: "Docs" },
    { __typename: "resource_hub", id: "files", name: "Files" },
  ],
};

it("queues all enabled tool landing pages, including each resource hub", () => {
  renderHook(() => useSpacePagePreloading({ spaceId: "one", tools }), { initialProps: undefined });

  expect(usePredictivePreloading).toHaveBeenLastCalledWith([
    "/spaces/one/work-map",
    "/spaces/one/discussions",
    "/hubs/docs",
    "/hubs/files",
    "/spaces/one/kanban",
    "/spaces/one/kpis",
    "/spaces/one/templates",
  ]);
});

it("excludes disabled tools even when their data is present", () => {
  const disabled = {
    ...tools,
    tasksEnabled: false,
    discussionsEnabled: false,
    resourceHubEnabled: false,
    kpisEnabled: false,
    templatesEnabled: false,
  };
  renderHook(() => useSpacePagePreloading({ spaceId: "one", tools: disabled }), { initialProps: undefined });

  expect(usePredictivePreloading).toHaveBeenLastCalledWith(["/spaces/one/work-map"]);
});

it("does not invent missing discussion boards or resource hubs", () => {
  renderHook(
    () => useSpacePagePreloading({ spaceId: "one", tools: { ...tools, messagesBoards: null, resourceHubs: null } }),
    { initialProps: undefined },
  );

  expect(usePredictivePreloading).toHaveBeenLastCalledWith([
    "/spaces/one/work-map",
    "/spaces/one/kanban",
    "/spaces/one/kpis",
    "/spaces/one/templates",
  ]);
});
