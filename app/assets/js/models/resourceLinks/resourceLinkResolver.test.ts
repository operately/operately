/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import { QueryClient } from "@tanstack/react-query";
import { createResourceLinkResolver, getResourceLinkResolver } from "./resourceLinkResolver";

const mockFetch = jest.fn();
jest.mock("@/api", () => ({
  __esModule: true,
  default: {
    rich_content: {
      resolveLinksQueryKeyPrefix: () => ["api", "/api", { company: "acme" }, "/rich_content/resolve_links"],
      resolveLinksQueryOptions: (input: unknown) => ({
        queryKey: ["api", "/api", { company: "acme" }, "/rich_content/resolve_links", input],
        queryFn: ({ queryKey }: { queryKey: unknown[] }) => mockFetch(queryKey[4]),
      }),
    },
  },
}));

const origin = "https://app.operately.com";
const scope = { origin, companyId: "acme-0abc" };
function documentWithIds(ids: string[]) {
  return {
    type: "doc",
    content: ids.map((id) => {
      const href = `${origin}/${scope.companyId}/projects/${id}`;
      return { type: "text", text: href, marks: [{ type: "link", attrs: { href } }] };
    }),
  };
}
let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mockFetch.mockReset().mockImplementation(async ({ types, ids }) => ({
    links: ids.map((id: string, i: number) => ({ type: types[i], id, title: `Title ${id}` })),
  }));
});
afterEach(() => client.clear());

it("combines different readers, deduplicates IDs and reuses cached titles", async () => {
  const resolve = createResourceLinkResolver(client, scope, "viewer");
  const [first, second] = await Promise.all([
    resolve(documentWithIds(["old-name-abc", "another-def"])),
    resolve(documentWithIds(["renamed-abc", "third-ghi"])),
  ]);
  expect(mockFetch).toHaveBeenCalledTimes(1);
  expect(mockFetch).toHaveBeenCalledWith({ types: ["project", "project", "project"], ids: ["abc", "def", "ghi"] });
  expect(first.map((link) => link.id)).toEqual(["abc", "def"]);
  expect(second.map((link) => link.id)).toEqual(["abc", "ghi"]);
  await resolve(documentWithIds(["abc"]));
  expect(mockFetch).toHaveBeenCalledTimes(1);

  const mixed = await resolve(documentWithIds(["abc", "new-jkl"]));
  expect(mixed.map((link) => link.id)).toEqual(["abc", "jkl"]);
  expect(mockFetch).toHaveBeenCalledTimes(2);
  expect(mockFetch).toHaveBeenLastCalledWith({ types: ["project"], ids: ["jkl"] });
});

it("bounds requests and resolves links beyond the server's per-request limit", async () => {
  const resolve = createResourceLinkResolver(client, scope, "viewer");
  const ids = Array.from({ length: 250 }, (_, i) => `long-project-name-${String(i).padStart(22, "a")}`);
  const links = await resolve(documentWithIds(ids));
  expect(links).toHaveLength(250);
  expect(mockFetch.mock.calls.map(([input]) => input.ids.length)).toEqual([100, 100, 50]);
  expect(mockFetch.mock.calls.every(([input]) => input.ids.every((id: string) => id.length <= 22))).toBe(true);
});

it("fetches fresh titles after invalidating individual resource queries", async () => {
  const resolve = createResourceLinkResolver(client, scope, "viewer");
  const content = documentWithIds(["abc"]);
  await resolve(content);

  await client.invalidateQueries({ predicate: (query) => query.queryKey.includes("resource") });
  mockFetch.mockResolvedValueOnce({ links: [{ type: "project", id: "abc", title: "Updated title" }] });

  expect(await resolve(content)).toEqual([{ type: "project", id: "abc", title: "Updated title" }]);
  expect(mockFetch).toHaveBeenCalledTimes(2);
});

it("does not share results between viewers", async () => {
  const first = createResourceLinkResolver(client, scope, "first");
  const second = createResourceLinkResolver(client, scope, "second");
  await first(documentWithIds(["abc"]));
  mockFetch.mockResolvedValueOnce({ links: [] });
  expect(await second(documentWithIds(["abc"]))).toEqual([]);
  expect(mockFetch).toHaveBeenCalledTimes(2);
});

it("preserves canonical UUID links while removing slug prefixes", async () => {
  const resolve = createResourceLinkResolver(client, scope, "viewer");
  const id = "12345678-1234-4123-8123-123456789abc";
  expect(await resolve(documentWithIds([id]))).toEqual([{ type: "project", id, title: `Title ${id}` }]);
  expect(mockFetch).toHaveBeenCalledWith({ types: ["project"], ids: [id] });
});

it("caches missing titles but retries failed requests", async () => {
  const resolve = createResourceLinkResolver(client, scope, "viewer");
  mockFetch.mockResolvedValueOnce({ links: [] });
  expect(await resolve(documentWithIds(["missing"]))).toEqual([]);
  expect(await resolve(documentWithIds(["missing"]))).toEqual([]);
  expect(mockFetch).toHaveBeenCalledTimes(1);
  mockFetch.mockRejectedValueOnce(new Error("Offline"));
  await expect(resolve(documentWithIds(["abc"]))).rejects.toThrow("Offline");
  expect(await resolve(documentWithIds(["abc"]))).toHaveLength(1);
});

it("shares the queue between handler instances in the same scope", () => {
  expect(getResourceLinkResolver(client, scope, "viewer")).toBe(getResourceLinkResolver(client, scope, "viewer"));
  expect(getResourceLinkResolver(client, scope, "viewer")).not.toBe(getResourceLinkResolver(client, scope, "other"));
});
