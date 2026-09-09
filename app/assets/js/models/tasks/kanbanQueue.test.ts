import { KanbanQueue, type KanbanSnapshot } from "./kanbanQueue";
import type { TaskBoard } from "turboui";

jest.mock("@/routes/paths", () => ({ compareIds: (a: string, b: string) => a === b }));

const pending = { id: "pending", value: "pending", label: "Pending", color: "gray", index: 0 } as TaskBoard.Status;
const done = { ...pending, id: "done", value: "done", label: "Done" };

const initial = (): KanbanSnapshot => ({
  board: { pending: ["a", "b"], done: [] },
  statuses: new Map([
    ["a", pending],
    ["b", pending],
  ]),
});

function deferred() {
  let resolve: (value: unknown) => void = () => {};
  let reject: (error: Error) => void = () => {};
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

it.each([true, false])(
  "serializes overlapping moves and replays newer intent after first success=%s",
  async (success) => {
    const error = jest.fn();
    const queue = new KanbanQueue(initial(), jest.fn(), error, jest.fn());
    const first = deferred();
    const saveFirst = jest.fn(() => first.promise);
    const saveSecond = jest.fn().mockResolvedValue({});
    const one = queue.enqueue({ taskId: "a", status: done, index: 0 }, saveFirst, async () => {});
    const two = queue.enqueue({ taskId: "b", status: done, index: 1 }, saveSecond, async () => {});
    expect(queue.snapshot.board).toEqual({ pending: [], done: ["a", "b"] });
    expect(saveSecond).not.toHaveBeenCalled();
    if (success) first.resolve({});
    else first.reject(new Error("failed"));
    expect(await one).toBe(success);
    expect(await two).toBe(true);
    expect(saveSecond.mock.calls[0][0].board).toEqual(
      success ? { pending: [], done: ["a", "b"] } : { pending: ["a"], done: ["b"] },
    );
    expect(queue.snapshot.statuses.get("a")).toEqual(success ? done : pending);
    expect(queue.snapshot.statuses.get("b")).toEqual(done);
    expect(error).toHaveBeenCalledTimes(success ? 0 : 1);
  },
);

it("preserves newer moves of the same task after an older failure", async () => {
  const queue = new KanbanQueue(initial(), jest.fn(), jest.fn(), jest.fn());
  const first = deferred();
  const one = queue.enqueue(
    { taskId: "a", status: done, index: 0 },
    () => first.promise,
    async () => {},
  );
  const two = queue.enqueue(
    { taskId: "a", status: pending, index: 1 },
    async () => ({}),
    async () => {},
  );
  first.reject(new Error("failed"));
  await Promise.all([one, two]);
  expect(queue.snapshot.board).toEqual({ pending: ["b", "a"], done: [] });
  expect(queue.snapshot.statuses.get("a")).toEqual(pending);
});

it("rolls back both order and status for an explicit failed response", async () => {
  const queue = new KanbanQueue(initial(), jest.fn(), jest.fn(), jest.fn());
  expect(
    await queue.enqueue(
      { taskId: "a", status: done, index: 0 },
      async () => ({ success: false }),
      async () => {},
    ),
  ).toBe(false);
  expect(queue.snapshot).toEqual(initial());
});

it("does not roll back a successful write when refresh fails", async () => {
  const refreshError = jest.fn();
  const queue = new KanbanQueue(initial(), jest.fn(), jest.fn(), refreshError);
  expect(
    await queue.enqueue(
      { taskId: "a", status: done, index: 0 },
      async () => ({}),
      async () => {
        throw new Error("offline");
      },
    ),
  ).toBe(true);
  expect(queue.snapshot.board.done).toEqual(["a"]);
  expect(refreshError).toHaveBeenCalledTimes(1);
});
