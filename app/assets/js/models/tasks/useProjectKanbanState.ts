import { useLayoutEffect, useMemo, useReducer, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ProjectsUpdateKanbanInput } from "@/api";
import { showErrorToast, type TaskBoard } from "turboui";
import { KanbanQueue, type KanbanMove } from "./kanbanQueue";
import { parseKanbanState } from "./parseKanbanState";
import { serializeTaskStatus } from "./index";

interface Options {
  projectId: string;
  initialRawState: unknown;
  statuses: TaskBoard.Status[];
  tasks: TaskBoard.Task[];
  setTasks?: Dispatch<SetStateAction<TaskBoard.Task[]>>;
  updateKanban: (input: ProjectsUpdateKanbanInput) => Promise<unknown>;
  onSuccess?: () => Promise<void> | void;
}

export function useProjectKanbanState(options: Options | null) {
  // Queue changes happen outside React state; this triggers the consuming component to render.
  const [, render] = useReducer((value) => value + 1, 0);
  const mounted = useRef(false);
  const current = useRef<KanbanQueue | null>(null);

  // Queue callbacks need current options without recreating the queue on every render.
  const latest = useRef(options);
  latest.current = options;

  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Keep one queue per project session and ignore late UI updates from previous sessions.
  const session = useMemo(() => {
    const isCurrent = () => mounted.current && current.current === queue;

    const publish = () => {
      if (!isCurrent()) return;

      // Apply optimistic or rolled-back statuses while preserving other task fields.
      const statuses = queue.snapshot.statuses;

      latest.current?.setTasks?.((tasks) => {
        // React can execute the updater after navigation.
        if (!isCurrent()) return tasks;

        let changed = false;
        const next = tasks.map((task) => {
          const status = statuses.get(task.id);
          if (status === undefined || status === task.status) return task;
          changed = true;
          return { ...task, status };
        });
        return changed ? next : tasks;
      });
      render();
    };

    const queue = new KanbanQueue(
      {
        board: parseKanbanState(options?.initialRawState, options?.statuses ?? [], options?.tasks),
        statuses: new Map(options?.tasks.map((task) => [task.id, task.status]) ?? []),
      },
      publish,
      (error) => {
        if (isCurrent()) {
          console.error("Failed to update Kanban state", error);
          showErrorToast("Error", "Failed to update task position");
        }
      },
      (error) => {
        if (isCurrent()) console.error("Failed to refresh Kanban state", error);
      },
    );
    return { queue, publish, isCurrent, raw: options?.initialRawState };
  }, [options?.projectId]);

  current.current = session.queue;

  useLayoutEffect(() => {
    if (!options) return;

    const rawChanged = session.raw !== options.initialRawState;
    session.raw = options.initialRawState;

    if (session.queue.isPending) {
      // Incoming props must not overwrite moves that are still being saved.
      session.publish();
    } else {
      // Reconcile tasks and columns, retaining confirmed ordering unless the raw board changed.
      const snapshot = session.queue.snapshot;
      session.queue.replaceConfirmed({
        board: parseKanbanState(rawChanged ? options.initialRawState : snapshot.board, options.statuses, options.tasks),
        statuses: new Map(options.tasks.map((task) => [task.id, task.status])),
      });
      render();
    }
  }, [session, options?.initialRawState, options?.statuses, options?.tasks, session.queue.isPending]);

  function move(intent: KanbanMove) {
    if (!options || !session.isCurrent()) return Promise.resolve(false);
    const status = serializeTaskStatus(intent.status);

    if (!status) return Promise.resolve(false);
    const { projectId, updateKanban, onSuccess } = options;

    // Show the move immediately; the queue serializes saves and handles rollback.
    return session.queue.enqueue(
      intent,
      (snapshot) => {
        const { "unknown-status": _, ...board } = snapshot.board;
        return updateKanban({ projectId, taskId: intent.taskId, status, kanbanState: JSON.stringify(board) });
      },
      async () => {
        if (session.isCurrent()) await onSuccess?.();
      },
    );
  }

  return { kanbanState: session.queue.snapshot.board, move };
}
