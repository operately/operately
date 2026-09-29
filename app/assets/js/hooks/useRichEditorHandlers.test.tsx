/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import { renderHook } from "@/__tests__/renderHook";
import { queryClient } from "@/api/queryClient";
import { useRichEditorHandlers } from "./useRichEditorHandlers";

let mockViewerId: string | undefined = "viewer-1";
let mockCompanyPath: string | undefined = "/acme";
const mockQuery = jest.fn().mockResolvedValue({ links: [{ url: "/acme/projects/site", title: "Website" }] });

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
  },
}));
jest.mock("@/contexts/CurrentCompanyContext", () => ({
  useMe: () => (mockViewerId ? { id: mockViewerId } : null),
  useMentionedPersonLookupFn: () => jest.fn(),
}));
jest.mock("@/routes/paths", () => ({
  useOptionalPaths: () => (mockCompanyPath ? { homePath: () => mockCompanyPath } : null),
}));
jest.mock("@/models/people", () => ({ useMentionedPersonSearch: () => jest.fn() }));
jest.mock("@/models/blobs", () => ({ uploadFile: jest.fn() }));

beforeEach(() => {
  queryClient.clear();
  mockQuery.mockClear();
  mockViewerId = "viewer-1";
  mockCompanyPath = "/acme";
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
