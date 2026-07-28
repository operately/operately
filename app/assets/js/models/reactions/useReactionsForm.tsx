import * as React from "react";
import Api from "@/api";
import * as api from "@/api";
import { Reactions } from "turboui";

import { useMe } from "@/contexts/CurrentCompanyContext";
import * as People from "@/models/people";
import { usePaths } from "@/routes/paths";

import { Entity, parseReactionsForTurboUi } from "./index";

interface ReactionsFormState {
  reactions: Reactions.Reaction[];
  currentPersonId: string | null | undefined;
  onAddReaction: (emoji: string) => Promise<void>;
  onRemoveReaction: (reactionId: string) => Promise<void>;
}

export function useReactionsForm(entity: Entity, initial: api.Reaction[]): ReactionsFormState {
  const me = useMe();
  const paths = usePaths();
  const [add] = Api.reactions.useCreate();
  const [removeReaction] = Api.reactions.useDelete();

  const [reactions, setReactions] = React.useState<Reactions.Reaction[]>(() => {
    return parseReactionsForTurboUi(paths, initial);
  });

  const onAddReaction = async (emoji: string) => {
    const person = People.parsePersonForTurboUi(paths, me);
    if (!person) return;

    const tempId = `temp-${emoji}-${Date.now()}`;

    setReactions((prev) => {
      return [...prev, { id: tempId, emoji, person }];
    });

    try {
      const res = await add({
        entityId: entity.id,
        entityType: entity.type,
        parentType: entity.parentType,
        emoji: emoji,
      });

      setReactions((prev) => {
        return prev.map((r) => {
          if (r.id === tempId) {
            return { ...r, id: res.reaction!.id! };
          } else {
            return r;
          }
        });
      });
    } catch (error) {
      setReactions((prev) => {
        return prev.filter((r) => r.id !== tempId);
      });
    }
  };

  const onRemoveReaction = async (id: string) => {
    const reactionToRemove = reactions.find((r) => r.id === id);

    setReactions((prev) => {
      return prev.filter((r) => r.id !== id);
    });

    try {
      await removeReaction({
        reactionId: id,
      });
    } catch (error) {
      if (reactionToRemove) {
        setReactions((prev) => [...prev, reactionToRemove]);
      }
    }
  };

  return {
    reactions,
    currentPersonId: me?.id,
    onAddReaction,
    onRemoveReaction,
  };
}
