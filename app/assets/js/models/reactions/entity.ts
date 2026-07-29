import * as api from "@/api";

type EntityType =
  | "project_check_in"
  | "project_retrospective"
  | "project_discussion"
  | "goal_update"
  | "goal_discussion"
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
