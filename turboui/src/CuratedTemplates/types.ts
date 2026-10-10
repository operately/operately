import type { RichTextJSON } from "../RichContent";

export type TemplateType = "kpi" | "goal" | "project";

export type EditableNumber = number | string | null;

export interface TargetDefinition {
  editorKey?: string;
  name?: string | null;
  unit?: string | null;
  from?: EditableNumber;
  to?: EditableNumber;
}

export interface MilestoneDefinition {
  key: string;
  title?: string | null;
  due_offset_days?: EditableNumber;
}

export interface TaskDefinition {
  key: string;
  name?: string | null;
  description?: RichTextJSON | null;
  milestone_key?: string | null;
  due_offset_days?: EditableNumber;
}

export interface TemplateDefinition {
  name?: string | null;
  description?: RichTextJSON | null;
  unit?: string | null;
  cadence?: "weekly" | "monthly" | null;
  duration_days?: EditableNumber;
  targets?: TargetDefinition[];
  milestones?: MilestoneDefinition[];
  tasks?: TaskDefinition[];
}

export interface CuratedTemplate {
  id: string;
  type: TemplateType;
  state: "draft" | "published";
  title: string;
  summary?: string | null;
  category?: string | null;
  contentLanguage: string;
  definition?: string;
  publishedAt?: string | null;
  insertedAt: string;
  updatedAt: string;
}

export interface TemplateInput {
  title: string;
  type: TemplateType;
  summary: string;
  category: string;
  contentLanguage: string;
  definition: string;
}

export interface TemplateValidationError {
  path: string;
  message: string;
}

export interface TemplateMutationResult {
  template?: CuratedTemplate | null;
  errors: TemplateValidationError[];
}

export type TemplateSaveIntent = "draft" | "publish";
