import { useCreateReaction, useDeleteReaction } from "./reactionLifecycle";
import { useEffect, useMemo, useReducer, useRef } from "react";
import { type Reaction } from "@/api";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { usePaths } from "@/routes/paths";
import { parseReactionsForTurboUi } from "./parseReactionsForTurboUi";
import { type Entity } from "./entity";
import { showErrorToast } from "turboui";

type Change = (reactions: Reaction[]) => Reaction[];
const EMPTY_REACTIONS: Reaction[] = [];

interface UseOptimisticReactionsOptions {
  entity: Entity;
  initialReactions?: Reaction[];
  onRefresh: () => void | Promise<void>;
}

/**
 * Manages optimistic reactions for an entity, queuing saves and rolling back failed changes.
 * Calls onRefresh after successful changes once the queue drains so callers can refresh their cached data.
 */
export function useOptimisticReactions({
  entity,
  initialReactions: initial = EMPTY_REACTIONS,
  onRefresh,
}: UseOptimisticReactionsOptions) {
  const me = useMe();
  const paths = usePaths();
  const create = useCreateReaction();
  const remove = useDeleteReaction();
  const [, render] = useReducer((n) => n + 1, 0);

  const session = useMemo(
    () => ({
      confirmed: initial,
      pending: [] as Change[],
      queue: Promise.resolve(),
      ids: new Map<string, string>(),
      changed: false,
      refreshing: false,
    }),
    [entity.id, entity.type, entity.parentType],
  );
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const current = useRef(session);
  current.current = session;

  useEffect(() => {
    if (!session.pending.length && !session.refreshing) {
      session.confirmed = initial;
      render();
    }
  }, [initial, session]);

  const publish = () => {
    if (mounted.current && current.current === session) render();
  };

  const getReactions = () => session.pending.reduce((value, apply) => apply(value), session.confirmed);

  async function run(apply: Change, save: () => Promise<Change>) {
    session.pending.push(apply);
    publish();

    const result = session.queue.then(async () => {
      try {
        const commit = await save();
        session.confirmed = commit(session.confirmed);
        session.changed = true;
      } catch {
        if (mounted.current && current.current === session) showErrorToast("Error", "Failed to save reaction.");
      }
      session.pending = session.pending.filter((change) => change !== apply);
      publish();

      if (session.changed && !session.pending.length) {
        session.refreshing = true;
        try {
          await onRefresh();
        } finally {
          session.refreshing = false;
          session.changed = false;
        }
      }
    });

    session.queue = result.catch(() => {});

    await result;
  }

  async function onAddReaction(emoji: string) {
    if (!me) return;
    const id = `temp-${Date.now()}-${Math.random()}`;
    const optimistic: Reaction = { __typename: "reaction", id, emoji, person: me };

    await run(
      (reactions) => [...reactions, optimistic],
      async () => {
        const { reaction } = await create.mutateAsync({
          entityId: entity.id,
          entityType: entity.type,
          parentType: entity.parentType,
          emoji,
        });
        if (!reaction?.id) throw new Error("Created reaction is unavailable");
        session.ids.set(id, reaction.id);
        return (reactions) => [...reactions, { ...reaction, person: reaction.person ?? me }];
      },
    );
  }

  async function onRemoveReaction(id: string) {
    const apply: Change = (reactions) => reactions.filter((r) => r.id !== id && r.id !== session.ids.get(id));

    await run(apply, async () => {
      const savedId = session.ids.get(id) ?? id;
      if (!savedId.startsWith("temp-")) await remove.mutateAsync({ reactionId: savedId });
      return apply;
    });
  }

  return {
    reactions: parseReactionsForTurboUi(paths, getReactions()),
    currentPersonId: me?.id,
    onAddReaction,
    onRemoveReaction,
  };
}
