import { act, renderHook, waitFor } from "@testing-library/react";
import { useAsyncSearch } from "./useAsyncSearch";

it("ignores old responses after typing, switching search context, and closing", async () => {
  let resolveOld: (value: string[]) => void = () => {};
  const search = jest.fn(({ query }: { query: string }) =>
    query === "old"
      ? new Promise<string[]>((resolve) => {
          resolveOld = resolve;
        })
      : Promise.resolve([query]),
  );
  const hook = renderHook(({ query, enabled, search }) => useAsyncSearch(search, query, enabled), {
    initialProps: { query: "old", enabled: true, search },
  });

  hook.rerender({ query: "new", enabled: true, search });

  await waitFor(() => expect(hook.result.current).toEqual(["new"]));

  await act(async () => resolveOld(["stale"]));

  expect(hook.result.current).toEqual(["new"]);

  const nextSearch = jest.fn<Promise<string[]>, [{ query: string }]>().mockResolvedValue(["other context"]);

  hook.rerender({ query: "new", enabled: true, search: nextSearch });

  await waitFor(() => expect(hook.result.current).toEqual(["other context"]));

  hook.rerender({ query: "old", enabled: true, search });
  hook.rerender({ query: "old", enabled: false, search });
  await act(async () => resolveOld(["stale"]));

  expect(hook.result.current).toEqual([]);
});

it("clears failed results and retries when reopened", async () => {
  const search = jest.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(["recovered"]);
  const hook = renderHook(({ enabled }) => useAsyncSearch(search, "term", enabled), {
    initialProps: { enabled: true },
  });

  await act(async () => {});

  expect(hook.result.current).toEqual([]);

  hook.rerender({ enabled: false });
  hook.rerender({ enabled: true });

  await waitFor(() => expect(hook.result.current).toEqual(["recovered"]));
});
