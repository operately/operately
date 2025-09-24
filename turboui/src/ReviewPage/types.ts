export type AssignmentType = "goal" | "project" | "goal_update" | "check_in";

export interface ReviewAssignment {
  resourceId: string;
  name: string;
  due: string;
  type: string;
  authorId: string | null;
  authorName: string | null;
  path: string;
}
