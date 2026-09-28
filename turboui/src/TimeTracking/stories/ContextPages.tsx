import React from "react";
import { ProjectPage } from "../../ProjectPage";
import { TaskPage } from "../../TaskPage";
import { SpaceKanbanPage } from "../../SpaceKanbanPage";
import type { Task } from "../../TaskBoard/types";
import { generatePermissions } from "../../utils/storybook/permissions";
import { createMockRichTextHandlers } from "../../utils/storybook/richEditor";
import { asRichText } from "../../utils/storybook/richContent";
import { demoPerson, demoTask, demoBuildTask } from "../mockData";
import type { TaskTimeSectionProps, ProjectTimeSectionProps } from "../types";

const noChange = () => undefined;
const search = { people: [demoPerson], onSearch: async () => undefined };
const childrenCount = { tasksCount: 2, discussionsCount: 0, checkInsCount: 0, docsAndFilesCount: 0 };
const inProgress = {
  id: "progress",
  value: "in_progress",
  label: "In progress",
  color: "blue" as const,
  icon: "circleDot" as const,
  index: 0,
};
const done = {
  id: "done",
  value: "done",
  label: "Done",
  color: "green" as const,
  icon: "circleCheck" as const,
  index: 1,
  closed: true,
};
const description = asRichText(
  "Make the value of Operately clear from the first visit. Explore the layout, review it with the team, and prepare the design for implementation.",
);

export function ProjectTimePreview({ timeTracking }: { timeTracking: ProjectTimeSectionProps }) {
  const tasks: Task[] = [demoTask, demoBuildTask].map((destination) => ({
    id: destination.id,
    title: destination.name,
    link: `/tasks/${destination.id}`,
    status: inProgress,
    assignees: [demoPerson],
    dueDate: null,
    milestone: null,
    hasDescription: true,
    description,
    type: "project",
  }));
  return (
    <ProjectPage
      project={{ id: "launch", name: "Website relaunch" }}
      homeLink="/projects/launch?tab=overview"
      closeLink="#"
      reopenLink="#"
      pauseLink="#"
      childrenCount={childrenCount}
      description={description}
      champion={demoPerson}
      status="on_track"
      state="active"
      closedAt={null}
      permissions={generatePermissions(false, { canView: true })}
      updateProjectName={async () => false}
      onDescriptionChange={async () => false}
      activityFeed={<p className="text-sm text-content-dimmed">No recent project activity.</p>}
      tasks={tasks}
      kanbanState={{ progress: tasks.map((task) => task.id), done: [] }}
      onTaskKanbanChange={noChange}
      milestones={[]}
      searchableMilestones={[]}
      onMilestoneSearch={async () => undefined}
      assigneePersonSearch={search}
      onTaskCreate={noChange}
      onTaskNameChange={noChange}
      onMilestoneCreate={noChange}
      onTaskAssigneeChange={noChange}
      onTaskDueDateChange={noChange}
      onTaskStatusChange={noChange}
      onTaskDelete={noChange}
      onTaskDescriptionChange={async () => false}
      getTaskPageProps={() => null}
      onMilestoneUpdate={noChange}
      onMilestoneReorder={async () => undefined}
      richTextHandlers={createMockRichTextHandlers()}
      formattedTimePreferences={timeTracking.formattedTimePreferences}
      statuses={[inProgress, done]}
      onSaveCustomStatuses={noChange}
      tasksView="list"
      onTasksViewChange={noChange}
      parentGoal={null}
      setParentGoal={noChange}
      parentGoalSearch={async () => []}
      contributors={[]}
      accessLevels={{ company: "view", space: "view" }}
      setAccessLevels={noChange}
      otherPeopleWithAccess={{ people: [], loading: false, onRequestLoad: noChange }}
      newCheckInLink="#"
      checkIns={[]}
      newDiscussionLink="#"
      currentUser={demoPerson}
      discussions={[]}
      onProjectDelete={noChange}
      subscriptions={{ hidden: true, isSubscribed: false, onToggle: noChange, entityType: "project" }}
      timeTracking={timeTracking}
    />
  );
}

interface TaskTimePreviewProps {
  timeTracking: TaskTimeSectionProps;
  onClosedChange: (closed: boolean) => void;
}

function useTaskPreviewProps({ timeTracking, onClosedChange }: TaskTimePreviewProps): TaskPage.ContentProps {
  const [name, setName] = React.useState(timeTracking.destination.name);
  return {
    variant: timeTracking.destination.kind === "space-task" ? "space-task" : "project-task",
    name,
    onNameChange: async (value) => {
      setName(value);
      return true;
    },
    description,
    onDescriptionChange: async () => false,
    status: timeTracking.destination.closed ? done : inProgress,
    statusOptions: [inProgress, done],
    onStatusChange: (status) => onClosedChange(status.value === "done"),
    onDueDateChange: noChange,
    reminders: [],
    onRemindersChange: noChange,
    assignees: [demoPerson],
    onAssigneesChange: noChange,
    milestone: null,
    onMilestoneChange: noChange,
    milestones: [],
    onMilestoneSearch: async () => undefined,
    subscriptions: { hidden: true, isSubscribed: false, onToggle: noChange, entityType: "project_task" },
    createdAt: new Date(`${timeTracking.today}T12:00:00Z`),
    createdBy: demoPerson,
    onDelete: async () => undefined,
    assigneePersonSearch: search,
    richTextHandlers: createMockRichTextHandlers(),
    canEdit: timeTracking.destination.canTrack,
    timelineItems: [],
    currentUser: { ...demoPerson, profileLink: "#" },
    canComment: false,
    onAddComment: noChange,
    onEditComment: noChange,
    onDeleteComment: noChange,
    formattedTimePreferences: timeTracking.formattedTimePreferences,
    timeTracking,
  };
}

export function TaskTimePreview(props: TaskTimePreviewProps) {
  const content = useTaskPreviewProps(props);
  return (
    <TaskPage
      {...content}
      variant="project-task"
      homeLink="/projects/launch?tab=overview"
      projectName={props.timeTracking.destination.scopeName}
      projectStatus="on_track"
      projectLink="/projects/launch"
      childrenCount={childrenCount}
      closedAt={props.timeTracking.destination.closed ? new Date() : null}
      updateProjectName={async () => false}
      permissions={generatePermissions(false, { canView: true })}
    />
  );
}

export function SpaceTaskTimePreview(props: TaskTimePreviewProps) {
  const content = useTaskPreviewProps(props);
  const destination = props.timeTracking.destination;
  const task: Task = {
    id: destination.id,
    title: content.name,
    link: `/spaces/${destination.scopeId}/kanban?taskId=${destination.id}`,
    status: destination.closed ? done : inProgress,
    assignees: [demoPerson],
    dueDate: null,
    milestone: null,
    hasDescription: true,
    description,
    type: "space",
  };

  return (
    <SpaceKanbanPage
      space={{ id: destination.scopeId, name: destination.scopeName, link: `/spaces/${destination.scopeId}/kanban` }}
      navigation={[{ label: destination.scopeName, to: `/spaces/${destination.scopeId}/kanban` }]}
      tasks={[task]}
      statuses={[inProgress, done]}
      kanbanState={{ progress: destination.closed ? [] : [task.id], done: destination.closed ? [task.id] : [] }}
      canEdit={destination.canTrack}
      assigneePersonSearch={search}
      onTaskKanbanChange={({ to }) => props.onClosedChange(to.status === done.id)}
      onTaskCreate={noChange}
      onTaskNameChange={(_id, name) => void content.onNameChange(name)}
      onTaskAssigneeChange={noChange}
      onTaskDueDateChange={noChange}
      onTaskStatusChange={(_id, status) => props.onClosedChange(status?.value === "done")}
      onTaskDelete={noChange}
      getTaskPageProps={(id) => (id === task.id ? content : null)}
    />
  );
}
