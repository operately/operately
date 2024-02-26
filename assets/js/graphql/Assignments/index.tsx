import type { Project } from "@/models/projects";
import type { Milestone } from "@/models/milestones";

export interface Assignments {
  type: "milestone" | "project_status_update";
  due: string;
  resource: Project | Milestone;
}
