import React from "react";

import * as People from "@/models/people";
import * as Tasks from "@/models/tasks";
import { Space } from "@/models/spaces";
import { Title } from "../components";

import { PersonField, StatusSelector } from "turboui";

import { usePaths } from "@/routes/paths";

interface Props {
  space: Space;
  tasks: Tasks.Task[];
}

const MAX_TASKS = 7;

export function RegularState(props: Props) {
  return (
    <div className="flex flex-col h-full">
      <Title title="Tasks" />

      <div className="bg-surface-dimmed rounded mx-2 flex-1">
        <TasksList tasks={props.tasks} space={props.space} />
      </div>
    </div>
  );
}

function TasksList({ tasks, space }: { tasks: Tasks.Task[]; space: Space }) {
  const paths = usePaths();

  return (
    <div>
      {tasks.slice(0, MAX_TASKS).map((task) => (
        <TaskItem task={task} space={space} key={task.id} paths={paths} />
      ))}
    </div>
  );
}

interface TaskItemProps {
  task: Tasks.Task;
  space: Space;
  paths: ReturnType<typeof usePaths>;
}

function TaskItem({ task, space, paths }: TaskItemProps) {
  const statusOptions = Tasks.parseTaskStatusesForTurboUi(space.taskStatuses);
  const status = Tasks.parseTaskStatusForTurboUi(task.status);
  const assignee = People.parsePersonForTurboUi(paths, task.assignees?.[0]);

  return (
    <div className="flex items-center justify-between gap-2 py-2 px-2 border-b border-stroke-base last:border-b-0">
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex items-center h-6 flex-shrink-0">
          {status && statusOptions.length > 0 && (
            <StatusSelector statusOptions={statusOptions} status={status} onChange={() => {}} readonly={true} />
          )}
        </div>

        <div className="font-bold truncate">{task.name}</div>
      </div>

      {assignee && (
        <div className="flex items-center flex-shrink-0">
          <PersonField
            person={assignee}
            setPerson={() => {}}
            avatarSize={26}
            avatarOnly={true}
            readonly={true}
            emptyStateReadOnlyMessage=""
          />
        </div>
      )}
    </div>
  );
}
