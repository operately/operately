import type { FormattedTimePreferences } from "../FormattedTime";
import type { PersonField } from "../PersonField";
import type { RichEditorHandlers } from "../RichEditor/useEditor";
import type { StatusSelector } from "../StatusSelector";
import type { NewTaskPayload, Milestone } from "../TaskBoard/types";
import type { TemplateProjectPage } from "../TemplateProjectPage";

export namespace TaskCreationModal {
  type Base = {
    isOpen: boolean;
    onClose: () => void;
  };

  export type ProjectProps = Base & {
    variant: "project";
    onCreateTask: (task: NewTaskPayload) => void;
    milestones?: Milestone[];
    currentMilestoneId?: string;
    assigneePersonSearch?: PersonField.SearchData;
    onMilestoneSearch: (query: string) => Promise<void>;
    milestoneReadOnly?: boolean;
    richTextHandlers?: RichEditorHandlers;
    formattedTimePreferences: FormattedTimePreferences;
  };

  export type TemplateProps = Base & {
    variant: "project-template";
    onCreateTask: (task: Omit<TemplateProjectPage.Task, "id">) => void;
    milestones: Pick<TemplateProjectPage.Milestone, "id" | "title">[];
    statuses: StatusSelector.StatusOption[];
    personSearch?: PersonField.SearchData;
    richTextHandlers: RichEditorHandlers;
  };

  export type Props = ProjectProps | TemplateProps;
}

export function isProjectTaskCreationProps(props: TaskCreationModal.Props): props is TaskCreationModal.ProjectProps {
  return props.variant === "project";
}

export function isTemplateTaskCreationProps(props: TaskCreationModal.Props): props is TaskCreationModal.TemplateProps {
  return props.variant === "project-template";
}
