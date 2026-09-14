import { useCallback, useMemo, useReducer, useRef } from "react";

type Update<T> = (value: T) => T;

// Keep pending edits separate from server data, so refetches and failed saves
// cannot overwrite other edits. Writes to the same field/list run in order.
export function useOptimisticGoalState<T>(goalId: string, serverValue: T) {
  const [, render] = useReducer((version: number) => version + 1, 0);
  const scope = useMemo(
    () => ({
      base: serverValue,
      server: serverValue,
      pending: [] as { update: Update<T> }[],
      queue: Promise.resolve(),
    }),
    [goalId],
  );
  const activeScope = useRef(scope);
  activeScope.current = scope;

  if (scope.server !== serverValue) {
    scope.server = serverValue;
    if (scope.pending.length === 0) scope.base = serverValue;
  }

  const run = useCallback(
    <Result>(
      update: Update<T>,
      request: () => Promise<Result>,
      commit: (value: T, result: Result) => T = (value) => update(value),
    ): Promise<Result> => {
      // Show the edit immediately, even if an earlier save is still running.
      const operation = { update };
      const initialServer = scope.server;
      const queued = scope.pending.length > 0;
      scope.pending.push(operation);
      render();

      const saving = scope.queue.then(async () => {
        // Queued saves start with any server refresh from earlier saves.
        const serverAtStart = queued ? scope.server : initialServer;
        try {
          const result = await request();
          // Commit accepted changes; creation can replace temporary IDs here.
          scope.base = commit(scope.base, result);
          return result;
        } finally {
          // Removing a failed edit rolls it back while preserving later edits.
          scope.pending = scope.pending.filter((pending) => pending !== operation);
          // Reconcile refreshed server data only after all pending edits settle.
          if (scope.pending.length === 0 && scope.server !== serverAtStart) scope.base = scope.server;
          // A save for a previous goal must not trigger the current goal's render.
          if (activeScope.current === scope) render();
        }
      });
      // Keep the queue moving after failures; the returned promise still rejects.
      scope.queue = saving.then(
        () => undefined,
        () => undefined,
      );
      return saving;
    },
    [scope],
  );

  return { value: scope.pending.reduce((value, operation) => operation.update(value), scope.base), run };
}
