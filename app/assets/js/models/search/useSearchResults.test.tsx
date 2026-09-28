/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@/__tests__/renderHook";
import { useSearchResults } from "./useSearchResults";

let client: QueryClient;

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

afterEach(() => {
  client.clear();
  jest.restoreAllMocks();
});

function mount(fetch: (context: string, term: string) => Promise<string[]>) {
  return renderHook(
    ({ context }) =>
      useSearchResults((term) => ({
        queryKey: ["search", context, term],
        queryFn: () => fetch(context, term),
      })),
    {
      initialProps: { context: "one" },
      wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
    },
  );
}

it("loads initial results, reuses repeated terms, and recovers after a failed search", async () => {
  const fetch = jest.fn(async (_context, term) => [term || "initial"]);
  const hook = mount(fetch);

  await waitFor(() => expect(hook.result.current.data).toEqual(["initial"]));

  await act(async () => {
    await hook.result.current.onSearch("alice");
  });

  await waitFor(() => expect(hook.result.current.data).toEqual(["alice"]));

  await act(async () => {
    await hook.result.current.onSearch("");
  });

  expect(fetch).toHaveBeenCalledTimes(2);

  fetch.mockRejectedValueOnce(new Error("offline"));
  await act(async () => {
    await hook.result.current.onSearch("bob");
  });

  await waitFor(() => expect(hook.result.current.error).toBeTruthy());

  await act(async () => {
    await hook.result.current.onSearch("bob");
  });

  await waitFor(() => expect(hook.result.current.data).toEqual(["bob"]));
});

it("ignores old responses and clears results when the context changes", async () => {
  let resolveOld: (value: string[]) => void = () => {};
  const hook = mount(async (context, term) =>
    term === "old"
      ? new Promise((resolve) => {
          resolveOld = resolve;
        })
      : [context + term],
  );

  await waitFor(() => expect(hook.result.current.data).toEqual(["one"]));

  let pending: Promise<void>;

  act(() => {
    pending = hook.result.current.onSearch("old");
  });
  await act(async () => {
    await hook.result.current.onSearch("new");
  });

  await waitFor(() => expect(hook.result.current.data).toEqual(["onenew"]));

  hook.rerender({ context: "two" });

  expect(hook.result.current.data).toBeUndefined();
  await waitFor(() => expect(hook.result.current.data).toEqual(["two"]));

  await act(async () => {
    resolveOld(["stale"]);
    await pending;
  });

  expect(hook.result.current.data).toEqual(["two"]);
});

it("keeps the callback stable when equivalent options are recreated", async () => {
  const hook = mount(async () => []);
  const onSearch = hook.result.current.onSearch;

  await waitFor(() => expect(hook.result.current.data).toEqual([]));

  hook.rerender({ context: "one" });

  expect(hook.result.current.onSearch).toBe(onSearch);
});

it("reuses fresh initial results on remount and refreshes them after 30 seconds", async () => {
  const now = Date.now();
  const clock = jest.spyOn(Date, "now").mockReturnValue(now);
  const fetch = jest.fn(async () => ["initial"]);
  const first = mount(fetch);

  await waitFor(() => expect(first.result.current.data).toEqual(["initial"]));

  first.unmount();

  const second = mount(fetch);

  expect(second.result.current.data).toEqual(["initial"]);
  expect(fetch).toHaveBeenCalledTimes(1);

  second.unmount();
  clock.mockReturnValue(now + 30_000);

  let resolve: (value: string[]) => void = () => {};

  fetch.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );

  const third = mount(fetch);

  expect(third.result.current.data).toEqual(["initial"]);

  await act(async () => resolve(["fresh"]));

  await waitFor(() => expect(third.result.current.data).toEqual(["fresh"]));
});

it("reuses repeated searches for 30 seconds and respects invalidation", async () => {
  const now = Date.now();
  const clock = jest.spyOn(Date, "now").mockReturnValue(now);
  const fetch = jest.fn(async () => ["initial"]);
  const hook = mount(fetch);

  await waitFor(() => expect(hook.result.current.data).toEqual(["initial"]));

  clock.mockReturnValue(now + 29_999);
  await act(async () => hook.result.current.onSearch(""));

  expect(fetch).toHaveBeenCalledTimes(1);

  fetch.mockResolvedValueOnce(["fresh"]);
  clock.mockReturnValue(now + 30_000);
  await act(async () => hook.result.current.onSearch(""));

  await waitFor(() => expect(hook.result.current.data).toEqual(["fresh"]));
  expect(fetch).toHaveBeenCalledTimes(2);

  await act(async () => {
    await client.invalidateQueries({ queryKey: ["search"] });
  });

  expect(fetch).toHaveBeenCalledTimes(3);
});
