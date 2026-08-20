import type { DateField } from "../DateField";
import type * as TaskBoardTypes from "../TaskBoard/types";

export type MilestoneListVariant = "project" | "project-template";

export interface ProjectMilestoneCreatePayload {
  name: string;
  dueDate: DateField.ContextualDate | null;
  status: "pending";
}

export interface ProjectMilestoneUpdatePayload {
  name: string;
  dueDate: DateField.ContextualDate | null;
}

export interface TemplateMilestone {
  id: string;
  title: string;
  link: string;
  dueOffsetDays: number | null;
}

export interface TemplateMilestoneCreatePayload {
  title: string;
  description: null;
  dueOffsetDays: number | null;
}

export interface TemplateMilestoneUpdatePayload {
  title: string;
  dueOffsetDays: number | null;
}

export type MilestoneCreationResult = { success: boolean };

export type ProjectMilestoneListProps = {
  variant: "project";
  milestones: TaskBoardTypes.Milestone[];
  canEdit: boolean;
  onMilestoneCreate?: (
    milestone: ProjectMilestoneCreatePayload,
  ) => void | MilestoneCreationResult | Promise<void | MilestoneCreationResult>;
  onMilestoneUpdate?: (milestoneId: string, updates: ProjectMilestoneUpdatePayload) => void;
  onMilestoneReorder?: (
    milestoneId: string,
    destinationIndex: number,
  ) => void | boolean | Promise<void | boolean>;
};

export type TemplateMilestoneListProps = {
  variant: "project-template";
  milestones: TemplateMilestone[];
  canEdit: boolean;
  onMilestoneCreate?: (milestone: TemplateMilestoneCreatePayload) => void;
  onMilestoneUpdate?: (milestoneId: string, updates: TemplateMilestoneUpdatePayload) => void;
  onMilestoneReorder?: (
    milestoneId: string,
    destinationIndex: number,
  ) => void | boolean | Promise<void | boolean>;
};

export type MilestoneListProps = ProjectMilestoneListProps | TemplateMilestoneListProps;

export type DisplayMilestone = {
  id: string;
  title: string;
  link: string;
  dueDate: DateField.ContextualDate | null;
  dueOffsetDays: number | null;
  status: "pending" | "done" | null;
  hasDescription: boolean;
  hasComments: boolean;
  commentCount: number | undefined;
};

export function isProjectVariant(props: MilestoneListProps): props is ProjectMilestoneListProps {
  return props.variant === "project";
}

export function filterProjectMilestones(milestones: TaskBoardTypes.Milestone[]): TaskBoardTypes.Milestone[] {
  return milestones.filter(
    (milestone) =>
      milestone.name !== "Empty Milestone" &&
      !milestone.name.toLowerCase().includes("empty") &&
      milestone.name.trim() !== "",
  );
}

export function toDisplayMilestones(props: MilestoneListProps): DisplayMilestone[] {
  if (isProjectVariant(props)) {
    return filterProjectMilestones(props.milestones).map((milestone) => ({
      id: milestone.id,
      title: milestone.name,
      link: milestone.link || "",
      dueDate: milestone.dueDate || null,
      dueOffsetDays: null,
      status: milestone.status,
      hasDescription: !!milestone.hasDescription,
      hasComments: !!milestone.hasComments,
      commentCount: milestone.commentCount,
    }));
  }

  return props.milestones.map((milestone) => ({
    id: milestone.id,
    title: milestone.title,
    link: milestone.link,
    dueDate: null,
    dueOffsetDays: milestone.dueOffsetDays,
    status: null,
    hasDescription: false,
    hasComments: false,
    commentCount: undefined,
  }));
}
