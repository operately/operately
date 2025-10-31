import * as api from "@/api";
import * as People from "@/models/people";
import { Paths } from "@/routes/paths";

export type Reaction = api.Reaction;

export { useAddReaction, useRemoveReaction } from "@/api";
export { useReactionHandlers } from "./useReactionHandlers";

type EntityType =
  | "project_check_in"
  | "project_retrospective"
  | "comment_thread"
  | "goal_update"
  | "message"
  | "comment"
  | "resource_hub_document"
  | "resource_hub_file"
  | "resource_hub_link";

type ParentType = api.CommentParentType;

// Which entity the reactions are for
export type Entity = {
  id: string;
  type: EntityType;
  parentType?: ParentType;
};

export function entity(id: string, type: EntityType, parentType?: ParentType): Entity {
  return { id, type, parentType };
}

/**
 * Parses backend Reaction objects to the format expected by TurboUI
 */
export function parseReactionsForTurboUi(
  paths: Paths,
  reactions: api.Reaction[] | null | undefined,
) {
  if (!reactions) return [];

  return reactions
    .map((reaction) => {
      if (!reaction?.id || !reaction.emoji) return null;

      const person = People.parsePersonForTurboUi(paths, reaction.person);
      if (!person) return null;

      return {
        id: reaction.id,
        emoji: reaction.emoji,
        person,
      };
    })
    .filter(
      (reaction): reaction is {
        id: string;
        emoji: string;
        person: NonNullable<ReturnType<typeof People.parsePersonForTurboUi>>;
      } => reaction !== null,
    );
}
