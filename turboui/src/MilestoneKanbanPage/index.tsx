import React from "react";

import { DateField } from "../DateField";
import { PersonField } from "../PersonField";
import { PageNew } from "../Page";
import { KanbanBoard } from "../TaskBoard";
import * as Types from "../TaskBoard/types";
import type { KanbanBoardProps, KanbanState } from "../TaskBoard/KanbanView/types";
import { Navigation } from "../Page/Navigation";
import { IconMilestone, IconChevronRight } from "../icons";
import { BlackLink } from "../Link";
import { createTestId } from "../TestableElement";

export namespace MilestoneKanbanPage {
  export type Milestone = Types.Milestone;

  export type Task = Types.Task;

  export type StatusOption = Types.Status;

  export interface Props {
    projectName: string;

    navigation: Navigation.Item[];

    // Kanban data
    milestone: Milestone;
    tasks: Types.Task[];
    statuses: Types.Status[];
    kanbanState: KanbanState;

    canManageStatuses?: boolean;
    onStatusesChange?: (statuses: Types.Status[]) => void;

    // Callbacks
    assigneePersonSearch: PersonField.SearchData;
    onTaskKanbanChange: KanbanBoardProps["onTaskKanbanChange"];
    onTaskCreate: (task: Types.NewTaskPayload) => void;
    onTaskNameChange: (taskId: string, name: string) => void;
    onTaskAssigneeChange: (taskId: string, assignee: Types.Person | null) => void;
    onTaskDueDateChange: (taskId: string, dueDate: DateField.ContextualDate | null) => void;
    onTaskStatusChange: (taskId: string, status: Types.Status | null) => void;
    onTaskMilestoneChange: (taskId: string, milestone: Types.Milestone | null) => void;
    onTaskDelete: (taskId: string) => void | Promise<void>;

    // Milestone search
    milestones: Types.Milestone[];
    onMilestoneSearch: (query: string) => Promise<void>;

    // Description editing
    onTaskDescriptionChange?: (taskId: string, description: any) => Promise<boolean>;
    richTextHandlers?: KanbanBoardProps["richTextHandlers"];

    // Task slide-in
    getTaskPageProps: KanbanBoardProps["getTaskPageProps"];
  }
}

export function MilestoneKanbanPage(props: MilestoneKanbanPage.Props) {
  return (
    <PageNew
      title={props.projectName}
      size="fullwidth"
      testId={createTestId("milestone-kanban-page", props.milestone.id)}
    >
      <MilestoneKanbanPageHeader milestone={props.milestone} navigation={props.navigation} />

      <div className="flex-1 overflow-auto px-2 py-4">
        <KanbanBoard
          milestone={props.milestone}
          tasks={props.tasks}
          statuses={props.statuses}
          kanbanState={props.kanbanState}
          onTaskKanbanChange={props.onTaskKanbanChange}
          onTaskCreate={props.onTaskCreate}
          onTaskNameChange={props.onTaskNameChange}
          onTaskAssigneeChange={props.onTaskAssigneeChange}
          onTaskDueDateChange={props.onTaskDueDateChange}
          onTaskStatusChange={props.onTaskStatusChange}
          onTaskMilestoneChange={props.onTaskMilestoneChange}
          onTaskDelete={props.onTaskDelete}
          milestones={props.milestones}
          onMilestoneSearch={props.onMilestoneSearch}
          onTaskDescriptionChange={props.onTaskDescriptionChange}
          richTextHandlers={props.richTextHandlers}
          assigneePersonSearch={props.assigneePersonSearch}
          getTaskPageProps={props.getTaskPageProps}
          canManageStatuses={props.canManageStatuses ?? false}
          onStatusesChange={props.onStatusesChange}
          unstyled
        />
      </div>
    </PageNew>
  );
}

interface MilestoneKanbanPageHeaderProps {
  milestone: MilestoneKanbanPage.Milestone;
  navigation: Navigation.Item[];
}

function MilestoneKanbanPageHeader({ milestone, navigation }: MilestoneKanbanPageHeaderProps) {
  const title = milestone.name;

  return (
    <header className="mt-4 px-4 border-b border-surface-outline pb-3 flex items-center gap-3">
      <IconMilestone size={38} className="rounded-lg bg-blue-50 dark:bg-blue-900" />

      <div className="min-w-0 flex-1">
        <Breadcrumbs navigation={navigation} />

        <div className="flex items-center gap-2 mt-1">
          {milestone.link ? (
            <BlackLink
              to={milestone.link}
              className="text-sm sm:text-base font-semibold text-content-accent truncate hover:text-link-hover"
              underline="hover"
            >
              {title}
            </BlackLink>
          ) : (
            <h1 className="text-sm sm:text-base font-semibold text-content-accent truncate">{title}</h1>
          )}
        </div>
      </div>
    </header>
  );
}

function Breadcrumbs({ navigation }: { navigation: Navigation.Item[] }) {
  return (
    <div>
      <nav className="flex items-center space-x-0.5 mt-1">
        {navigation.map((item, index) => (
          <React.Fragment key={index}>
            <BlackLink to={item.to} className="text-xs text-content-dimmed leading-snug" underline="hover">
              {item.label}
            </BlackLink>
            {index < navigation.length - 1 && <IconChevronRight size={10} className="text-content-dimmed" />}
          </React.Fragment>
        ))}
      </nav>
    </div>
  );
}
