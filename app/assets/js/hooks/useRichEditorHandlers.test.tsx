/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import { renderHook } from "@/__tests__/renderHook";
import { queryClient } from "@/api/queryClient";
import { useRichEditorHandlers } from "./useRichEditorHandlers";

let mockViewerId: string | undefined = "viewer-1";
let mockCompanyPath: string | undefined = "/acme";
const mockQuery = jest.fn().mockResolvedValue({ links: [{ url: "/acme/projects/site", title: "Website" }] });
const mockSearchQuery = jest.fn();

jest.mock("@/api/queryErrors", () => ({ reportQueryError: jest.fn() }));

jest.mock("@/api", () => ({
  __esModule: true,
  default: {
    rich_content: {
      resolveLinksQueryOptions: (input: { urls: string[] }) => ({
        queryKey: ["lookup", input],
        queryFn: mockQuery,
      }),
    },
    companies: {
      quickSearchQueryOptions: (input: { query: string; includeCompleted?: boolean }) => ({
        queryKey: ["quick-search", input],
        queryFn: mockSearchQuery,
      }),
    },
  },
}));
jest.mock("@/contexts/CurrentCompanyContext", () => ({
  useMe: () => (mockViewerId ? { id: mockViewerId } : null),
  useMentionedPersonLookupFn: () => jest.fn(),
}));
jest.mock("@/routes/paths", () => ({
  useOptionalPaths: () =>
    mockCompanyPath
      ? {
          homePath: () => mockCompanyPath,
          goalPath: (id: string) => `${mockCompanyPath}/goals/${id}`,
          projectPath: (id: string) => `${mockCompanyPath}/projects/${id}`,
          taskPath: (id: string) => `${mockCompanyPath}/tasks/${id}`,
          spaceKanbanPath: (spaceId: string, boardId: string, options: { taskId: string }) =>
            `${mockCompanyPath}/spaces/${spaceId}/boards/${boardId}?taskId=${options.taskId}`,
        }
      : null,
}));
jest.mock("@/models/people", () => ({ useMentionedPersonSearch: () => jest.fn() }));
jest.mock("@/models/blobs", () => ({ uploadFile: jest.fn() }));

beforeEach(() => {
  queryClient.clear();
  mockQuery.mockClear();
  mockSearchQuery.mockReset();
  mockViewerId = "viewer-1";
  mockCompanyPath = "/acme";
});

it("maps only work results, preserves ranking, and omits tasks without destinations", async () => {
  mockSearchQuery.mockResolvedValue({
    goals: [{ id: "g", name: "Goal", space: { name: "Planning" } }],
    projects: [{ id: "p", name: "Project", space: { name: "Delivery" } }],
    tasks: [
      { id: "pt", name: "Project task", type: "project", project: { id: "p", name: "Project" } },
      { id: "st", name: "Space task", type: "space", space: { id: "s", name: "Planning" }, boardId: "b" },
      { id: "missing", name: "Missing board", type: "space", space: { id: "s" }, boardId: null },
    ],
    people: [{ id: "person" }],
    milestones: [{ id: "milestone" }],
  });
  const { result } = renderHook(() => useRichEditorHandlers(), { initialProps: undefined });
  expect(await result.current.resourceSearch?.("Launch")).toEqual([
    { id: "g", title: "Goal", type: "goal", context: "Planning", url: "/acme/goals/g" },
    { id: "p", title: "Project", type: "project", context: "Delivery", url: "/acme/projects/p" },
    { id: "pt", title: "Project task", type: "task", context: "Project", url: "/acme/tasks/pt" },
    { id: "st", title: "Space task", type: "task", context: "Planning", url: "/acme/spaces/s/boards/b?taskId=st" },
  ]);
  expect(mockSearchQuery.mock.calls[0][0].queryKey).toEqual([
    "quick-search",
    { query: "Launch", includeCompleted: true },
  ]);
});

it("keeps resource searches isolated by viewer and company", async () => {
  mockSearchQuery.mockResolvedValue({ goals: [], projects: [], tasks: [] });
  const { result, rerender } = renderHook(() => useRichEditorHandlers(), { initialProps: undefined });
  await result.current.resourceSearch?.("Launch");
  mockViewerId = "viewer-2";
  rerender(undefined);
  await result.current.resourceSearch?.("Launch");
  mockCompanyPath = "/other";
  rerender(undefined);
  await result.current.resourceSearch?.("Launch");
  expect(mockSearchQuery).toHaveBeenCalledTimes(3);
});

it("does not search resources without a viewer or company", async () => {
  mockViewerId = undefined;
  const noViewer = renderHook(() => useRichEditorHandlers(), { initialProps: undefined });
  expect(await noViewer.result.current.resourceSearch?.("Launch")).toEqual([]);
  noViewer.unmount();
  mockCompanyPath = undefined;
  const noCompany = renderHook(() => useRichEditorHandlers(), { initialProps: undefined });
  expect(noCompany.result.current.resourceSearch).toBeUndefined();
  expect(mockSearchQuery).not.toHaveBeenCalled();
});

it("resolves through TanStack Query and separates viewer and company caches", async () => {
  const { result, rerender } = renderHook(() => useRichEditorHandlers(), { initialProps: undefined });
  const resolve = result.current.resolveResourceLinks;
  expect(await resolve?.(["/acme/projects/site"])).toEqual([{ url: "/acme/projects/site", title: "Website" }]);
  rerender(undefined);
  expect(result.current.resolveResourceLinks).toBe(resolve);
  mockViewerId = "viewer-2";
  rerender(undefined);
  await result.current.resolveResourceLinks?.(["/acme/projects/site"]);
  mockCompanyPath = "/other";
  rerender(undefined);
  await result.current.resolveResourceLinks?.(["/acme/projects/site"]);
  expect(mockQuery).toHaveBeenCalledTimes(3);
  expect(
    queryClient
      .getQueryCache()
      .getAll()
      .map((query) => query.queryKey.slice(-2)),
  ).toEqual([
    ["/acme", "viewer-1"],
    ["/acme", "viewer-2"],
    ["/other", "viewer-2"],
  ]);
});

it("does not request titles without a viewer", async () => {
  mockViewerId = undefined;
  const { result } = renderHook(() => useRichEditorHandlers(), { initialProps: undefined });
  expect(await result.current.resolveResourceLinks?.(["/acme/projects/site"])).toEqual([]);
  expect(mockQuery).not.toHaveBeenCalled();
});

it("does not provide editor requests without a company", () => {
  mockCompanyPath = undefined;
  const { result } = renderHook(() => useRichEditorHandlers(), { initialProps: undefined });
  expect(result.current.resolveResourceLinks).toBeNull();
});
