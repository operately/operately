import * as React from "react";
import Api, { type Comment, type CommentParentType } from "@/api";
import { useQueryClient } from "@tanstack/react-query";
import { showErrorToast } from "turboui";
import { invalidateCommentQueries } from "./commentLifecycle";

export type CommentUpdate = (comments: Comment[]) => Comment[];

type PendingUpdate = { apply: CommentUpdate };

/**
 * Shows pending changes on top of confirmed comments while saving writes in order.
 * Successful writes update the confirmed data; failed writes remove only their
 * pending change. Once the queue settles, TanStack refreshes the server data.
 * The reducer counter triggers the calling component to rerender visible comments,
 * since changing the session object alone does not rerender it.
 * Each task has its own session so late responses cannot update another task's UI.
 */
export function useOptimisticCommentUpdates({
  taskId,
  parentType,
  initialComments,
  onAfterMutation,
}: {
  taskId: string | null;
  parentType: CommentParentType;
  initialComments: Comment[];
  onAfterMutation?: () => void | Promise<void>;
}) {
  const queryClient = useQueryClient();
  const [, render] = React.useReducer((version: number) => version + 1, 0);

  const session = React.useMemo(
    () => ({
      confirmed: initialComments,
      pending: [] as PendingUpdate[],
      queue: Promise.resolve(),
      revision: 0,
      refreshing: false,
      changed: false,
      reactionIds: new Map<string, string>(),
    }),
    // Each task owns its outstanding writes, including when the slide-in switches tasks.
    [taskId, parentType],
  );

  const currentSession = React.useRef(session);
  currentSession.current = session;
  const mounted = React.useRef(false);

  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  React.useEffect(() => {
    if (session.pending.length === 0 && !session.refreshing) {
      session.confirmed = initialComments;
      render();
    }
  }, [initialComments, session]);

  const isCurrent = () => mounted.current && currentSession.current === session;
  const publish = () => {
    if (isCurrent()) render();
  };
  const getComments = () => session.pending.reduce((comments, update) => update.apply(comments), session.confirmed);

  async function refresh() {
    if (!taskId || !session.changed) return;
    const revision = session.revision;
    session.refreshing = true;
    session.changed = false;

    try {
      const options =
        parentType === "milestone"
          ? undefined
          : Api.comments.listQueryOptions({ entityId: taskId, entityType: parentType });

      if (options) await queryClient.cancelQueries({ queryKey: options.queryKey });

      await invalidateCommentQueries(queryClient);

      if (options) {
        const data = await queryClient.fetchQuery({ ...options, staleTime: Infinity });

        if (session.revision === revision) {
          session.confirmed = data.comments;
          session.reactionIds.clear();
          publish();
        }
      }

      if (isCurrent()) await onAfterMutation?.();
    } catch (error) {
      // A refresh failure must not roll back a write the server already accepted.
      console.error("Failed to refresh comments after saving", error);
    } finally {
      session.refreshing = false;
    }
  }

  function run(apply: CommentUpdate, save: () => Promise<CommentUpdate>, errorMessage: string): Promise<boolean> {
    const update = { apply };
    session.pending.push(update);
    session.revision += 1;
    publish();

    const result = session.queue.then(async () => {
      let saved = false;
      try {
        const commit = await save();
        session.confirmed = commit(session.confirmed);
        session.changed = true;
        saved = true;
      } catch {
        if (isCurrent()) showErrorToast("Error", errorMessage);
      }
      session.pending = session.pending.filter((pending) => pending !== update);
      publish();
      if (session.pending.length === 0) await refresh();
      return saved;
    });
    session.queue = result.then(() => undefined);
    return result;
  }

  return { comments: getComments(), getComments, run, reactionIds: session.reactionIds };
}
