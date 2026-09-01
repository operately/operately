import { PageCache } from "./PageCache";

const mockStorage = new Map<string, string>();

jest.mock("@/utils/safeLocalStorage", () => ({
  getLocalStorage: () => ({ length: mockStorage.size, key: () => null }),
  safeGetItem: (_storage: unknown, key: string) => mockStorage.get(key) ?? null,
  safeSetItem: (_storage: unknown, key: string, value: string) => {
    mockStorage.set(key, value);
    return { success: true, quotaExceeded: false };
  },
  safeRemoveItem: (_storage: unknown, key: string) => mockStorage.delete(key),
}));

describe("PageCache.fetch", () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it("marks the initial request as a network fetch and later reads as a cache hit", async () => {
    const fetchFn = jest.fn().mockResolvedValue({ name: "Project" });

    const first = await PageCache.fetch({ cacheKey: "page-cache-test-network", fetchFn, refreshCache: false });
    const second = await PageCache.fetch({ cacheKey: "page-cache-test-network", fetchFn, refreshCache: false });

    expect(first.cacheSource).toBe("network");
    expect(second.cacheSource).toBe("cache");
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("deduplicates simultaneous forced refreshes for the same key", async () => {
    let resolveFetch: (value: { name: string }) => void = () => undefined;
    const fetchFn = jest.fn(
      () =>
        new Promise<{ name: string }>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const first = PageCache.fetch({ cacheKey: "page-cache-test-dedup", fetchFn, refreshCache: true });
    const second = PageCache.fetch({ cacheKey: "page-cache-test-dedup", fetchFn, refreshCache: true });
    resolveFetch({ name: "Project" });

    await expect(Promise.all([first, second])).resolves.toEqual([
      expect.objectContaining({ cacheSource: "network" }),
      expect.objectContaining({ cacheSource: "network" }),
    ]);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("allows a later retry after an in-flight request fails", async () => {
    const fetchFn = jest
      .fn()
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({ name: "Project" });

    await expect(PageCache.fetch({ cacheKey: "page-cache-test-retry", fetchFn, refreshCache: true })).rejects.toThrow(
      "Network error",
    );
    await expect(PageCache.fetch({ cacheKey: "page-cache-test-retry", fetchFn, refreshCache: true })).resolves.toEqual(
      expect.objectContaining({ cacheSource: "network" }),
    );
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("does not reuse or cache a request that was invalidated while in flight", async () => {
    let resolveStaleFetch: (value: { name: string }) => void = () => undefined;
    const staleFetch = jest.fn(
      () =>
        new Promise<{ name: string }>((resolve) => {
          resolveStaleFetch = resolve;
        }),
    );
    const freshFetch = jest.fn().mockResolvedValue({ name: "Fresh" });

    const staleRequest = PageCache.fetch({ cacheKey: "page-cache-test-invalidation", fetchFn: staleFetch, refreshCache: true });
    PageCache.invalidate("page-cache-test-invalidation");
    const freshRequest = PageCache.fetch({ cacheKey: "page-cache-test-invalidation", fetchFn: freshFetch, refreshCache: true });

    resolveStaleFetch({ name: "Stale" });

    await expect(freshRequest).resolves.toEqual(expect.objectContaining({ data: { name: "Fresh" } }));
    await staleRequest;

    await expect(
      PageCache.fetch({ cacheKey: "page-cache-test-invalidation", fetchFn: freshFetch, refreshCache: false }),
    ).resolves.toEqual(expect.objectContaining({ cacheSource: "cache", data: { name: "Fresh" } }));
    expect(staleFetch).toHaveBeenCalledTimes(1);
    expect(freshFetch).toHaveBeenCalledTimes(1);
  });

  it("keeps in-flight work for different keys independent", async () => {
    const firstFetch = jest.fn().mockResolvedValue({ name: "First" });
    const secondFetch = jest.fn().mockResolvedValue({ name: "Second" });

    await Promise.all([
      PageCache.fetch({ cacheKey: "page-cache-test-first", fetchFn: firstFetch, refreshCache: true }),
      PageCache.fetch({ cacheKey: "page-cache-test-second", fetchFn: secondFetch, refreshCache: true }),
    ]);

    expect(firstFetch).toHaveBeenCalledTimes(1);
    expect(secondFetch).toHaveBeenCalledTimes(1);
  });
});
