import * as api from "@/api";

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
