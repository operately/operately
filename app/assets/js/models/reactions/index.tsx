import * as api from "@/api";

export type Reaction = api.Reaction;

export { useAddReaction } from "@/api";

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

// Which entity the reactions are for
export type Entity = {
  id: string;
  type: EntityType;
  parentType?: string;
};

export function entity(id: string, type: EntityType, parentType?: string): Entity {
  return { id, type, parentType };
}
