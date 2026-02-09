import React from "react";

import { DateField } from "../DateField";
import { PersonField } from "../PersonField";
import { PageNew } from "../Page";
import { KanbanBoard } from "../TaskBoard";
import * as Types from "../TaskBoard/types";
import type { KanbanBoardProps, KanbanState } from "../TaskBoard/KanbanView/types";
import { Navigation } from "../Page/Navigation";
import { IconChevronRight, IconLayoutKanban } from "../icons";
import { BlackLink } from "../Link";
import { createTestId } from "../TestableElement";

export namespace SpaceKanbanPage {
  export interface Space {
    id: string;
    name: string;
    link: string;
  }

  export type Task = Types.Task;

  export type StatusOption = Types.Status;

  export interface Props {
    space: Space;

    navigation: Navigation.Item[];

    // Kanban data
    tasks: Types.Task[];
    statuses: Types.Status[];
    kanbanState: KanbanState;

    canEdit: boolean;
    onStatusesChange?: (data: {
      nextStatuses: Types.Status[];
      deletedStatusReplacements: Record<string, string>;
    }) => void;

    // Callbacks
    assigneePersonSearch: PersonField.SearchData;
    onTaskKanbanChange: KanbanBoardProps["onTaskKanbanChange"];
    onTaskCreate: (task: Types.NewTaskPayload) => void;
    onTaskNameChange: (taskId: string, name: string) => void;
    onTaskAssigneeChange: (taskId: string, assignee: Types.Person | null) => void;
    onTaskDueDateChange: (taskId: string, dueDate: DateField.ContextualDate | null) => void;
    onTaskStatusChange: (taskId: string, status: Types.Status | null) => void;
    onTaskDelete: (taskId: string) => void | Promise<any>;

    // Description editing
    onTaskDescriptionChange?: (taskId: string, description: any) => Promise<boolean>;
    richTextHandlers?: KanbanBoardProps["richTextHandlers"];

    // Task slide-in
    getTaskPageProps: KanbanBoardProps["getTaskPageProps"];
  }
}

export function SpaceKanbanPage(props: SpaceKanbanPage.Props) {
  const title = `${props.space.name} Tasks`;

  return (
    <PageNew title={title} size="fullwidth" testId={createTestId("space-kanban-page", props.space.id)}>
      <SpaceKanbanPageHeader navigation={props.navigation} />

      <div className="flex-1 overflow-auto px-2 py-4">
        <KanbanBoard
          tasks={props.tasks}
          statuses={props.statuses}
          kanbanState={props.kanbanState}
          onTaskKanbanChange={props.onTaskKanbanChange}
          onTaskCreate={props.onTaskCreate}
          onTaskNameChange={props.onTaskNameChange}
          onTaskAssigneeChange={props.onTaskAssigneeChange}
          onTaskDueDateChange={props.onTaskDueDateChange}
          onTaskStatusChange={props.onTaskStatusChange}
          onTaskDelete={props.onTaskDelete}
          onTaskDescriptionChange={props.onTaskDescriptionChange}
          richTextHandlers={props.richTextHandlers}
          assigneePersonSearch={props.assigneePersonSearch}
          getTaskPageProps={props.getTaskPageProps}
          canEdit={props.canEdit}
          onStatusesChange={props.onStatusesChange}
          unstyled
        />
      </div>
    </PageNew>
  );
}

interface SpaceKanbanPageHeaderProps {
  navigation: Navigation.Item[];
}

function SpaceKanbanPageHeader({ navigation }: SpaceKanbanPageHeaderProps) {
  return (
    <header className="mt-4 px-4 border-b border-surface-outline pb-3 flex items-center gap-3">
      <IconLayoutKanban size={38} className="rounded-lg bg-blue-50 dark:bg-blue-900 p-1" />

      <div className="min-w-0 flex-1">
        <Breadcrumbs navigation={navigation} />

        <div className="flex items-center gap-2 mt-1">
          <h1 className="text-sm sm:text-base font-semibold text-content-accent truncate">Tasks</h1>
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
