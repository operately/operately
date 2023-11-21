import { Project } from "@/graphql/Projects";
import { Milestone } from "@/graphql/Projects/milestones";

export interface Assignments {
  type: "milestone" | "project_status_update";
  due: string;
  resource: Project | Milestone;
}
