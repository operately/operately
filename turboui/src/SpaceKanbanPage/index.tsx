import { useTranslation } from "react-i18next";
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
    onTaskAssigneeChange: (taskId: string, assignees: Types.Person[]) => void;
    onTaskDueDateChange: (taskId: string, dueDate: DateField.ContextualDate | null) => void;
    onTaskRemindersChange?: KanbanBoardProps["onTaskRemindersChange"];
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
  const { t } = useTranslation();
  const title = t("{{space}} Tasks", { space: props.space.name });

  return (
    <PageNew title={title} size="fullwidth" testId={createTestId("space-kanban-page", props.space.id)}>
      <KanbanBoard
        renderHeader={(actions) => <SpaceKanbanPageHeader navigation={props.navigation} actions={actions} />}
        tasks={props.tasks}
        statuses={props.statuses}
        kanbanState={props.kanbanState}
        onTaskKanbanChange={props.onTaskKanbanChange}
        onTaskCreate={props.onTaskCreate}
        onTaskNameChange={props.onTaskNameChange}
        onTaskAssigneeChange={props.onTaskAssigneeChange}
        onTaskDueDateChange={props.onTaskDueDateChange}
        onTaskRemindersChange={props.onTaskRemindersChange}
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
    </PageNew>
  );
}

interface SpaceKanbanPageHeaderProps {
  navigation: Navigation.Item[];
  actions: React.ReactNode;
}

function SpaceKanbanPageHeader({ navigation, actions }: SpaceKanbanPageHeaderProps) {
  const { t } = useTranslation();
  return (
    <header className="mt-4 px-4 border-b border-surface-outline pb-3 flex items-center gap-3">
      <IconLayoutKanban size={38} className="rounded-lg bg-blue-50 dark:bg-blue-900 p-1" />

      <div className="min-w-0 flex-1">
        <Breadcrumbs navigation={navigation} />

        <div className="flex items-center gap-2 mt-1">
          <h1 className="text-sm sm:text-base font-semibold text-content-accent truncate">{t("Tasks")}</h1>
        </div>
      </div>

      <div className="shrink-0">{actions}</div>
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
