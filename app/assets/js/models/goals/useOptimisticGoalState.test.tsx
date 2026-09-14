/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import { act, renderHook } from "@/__tests__/renderHook";
import { useOptimisticGoalState } from "./useOptimisticGoalState";

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  let reject: (error: Error) => void = () => {};
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const setup = () =>
  renderHook(({ id, value }) => useOptimisticGoalState(id, value), { initialProps: { id: "goal1", value: ["one"] } });

it("keeps pending edits visible through a background refresh and then reconciles server data", async () => {
  const { result, rerender } = setup();
  const request = deferred<void>();
  let saving: Promise<void>;
  act(() => {
    saving = result.current.run(
      (items) => [...items, "two"],
      () => request.promise,
    );
  });
  expect(result.current.value).toEqual(["one", "two"]);
  rerender({ id: "goal1", value: ["one", "server"] });
  expect(result.current.value).toEqual(["one", "two"]);
  rerender({ id: "goal1", value: ["one", "server", "two"] });
  await act(async () => {
    request.resolve();
    await saving;
  });
  expect(result.current.value).toEqual(["one", "server", "two"]);
});

it("rolls back only the failed operation and preserves a later edit", async () => {
  const { result } = setup();
  const request = deferred<void>();
  let first: Promise<unknown>;
  let second: Promise<void>;
  act(() => {
    first = result.current
      .run(
        (items) => [...items, "bad"],
        () => request.promise,
      )
      .catch(() => undefined);
    second = result.current.run(
      (items) => [...items, "good"],
      async () => {},
    );
  });
  expect(result.current.value).toEqual(["one", "bad", "good"]);
  await act(async () => {
    request.reject(new Error("failed"));
    await first;
    await second;
  });
  expect(result.current.value).toEqual(["one", "good"]);
});

it("replaces temporary IDs on success", async () => {
  const { result } = setup();
  await act(async () => {
    await result.current.run(
      (items) => [...items, "temp"],
      async () => "saved",
      (items, id) => [...items, id],
    );
  });
  expect(result.current.value).toEqual(["one", "saved"]);
});

it("resets on goal navigation and ignores completion from the old goal", async () => {
  const { result, rerender } = setup();
  const request = deferred<void>();
  let saving: Promise<void>;
  act(() => {
    saving = result.current.run(
      (items) => [...items, "old"],
      () => request.promise,
    );
  });
  rerender({ id: "goal2", value: ["new"] });
  expect(result.current.value).toEqual(["new"]);
  await act(async () => {
    request.resolve();
    await saving;
  });
  expect(result.current.value).toEqual(["new"]);
});
