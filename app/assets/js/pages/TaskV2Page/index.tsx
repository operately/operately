import * as React from "react";

import * as Tasks from "../../models/tasks";
import * as People from "../../models/people";
import { parseContextualDate } from "@/models/contextualDates";
import { parseMilestoneForTurboUi } from "@/models/milestones";

import { usePaths } from "../../routes/paths";
import { showErrorToast, TaskPage } from "turboui";
import { PageModule } from "../../routes/types";
import { PageCache } from "@/routes/PageCache";
import { fetchAll } from "@/utils/async";
import { assertPresent } from "@/utils/assertions";

type LoaderResult = {
  data: {
    task: Tasks.Task;
  };
  cacheVersion: number;
};

async function loader({ params, refreshCache = false }): Promise<LoaderResult> {
  return await PageCache.fetch({
    cacheKey: pageCacheKey(params.id),
    refreshCache,
    fetchFn: () =>
      fetchAll({
        task: Tasks.getTask({
          id: params.id,
          includeProject: true,
          includeMilestone: true,
          includeAssignees: true,
          includeCreator: true,
          includeSpace: true,
        }).then((d) => d.task!),
      }),
  });
}

function pageCacheKey(id: string): string {
  return `v3-TaskV2Page.task-${id}`;
}

export default { name: "TaskV2Page", loader, Page } as PageModule;

function Page() {
  const paths = usePaths();
  const { task } = PageCache.useData(loader).data;

  assertPresent(task.project, "Task must have a project");
  assertPresent(task.space, "Task must have a space");
  assertPresent(task.milestone, "Task must have a milestone");

  // Task name field
  const [name, setName] = usePageField({
    value: (data) => data.task.name!,
    update: () => Promise.resolve(true), // Placeholder for updateTaskName
    onError: (e: string) => showErrorToast(e, "Failed to update task name."),
    validations: [(v) => (v.trim() === "" ? "Task name cannot be empty" : null)],
  });

  // Task description field
  const [description, _setDescription] = usePageField({
    value: (data) => data.task.description && JSON.parse(data.task.description),
    update: () => {
      PageCache.invalidate(pageCacheKey(task.id!));
      return Promise.resolve(true); // Placeholder for updateTaskDescription
    },
    onError: () => showErrorToast("Error", "Failed to update task description."),
  });

  // Task status field
  const [status, setStatus] = usePageField({
    value: (data) => Tasks.parseTaskForTurboUi(paths, data.task).status || "pending", // Placeholder for parseTaskStatus
    update: () => Promise.resolve(true), // Placeholder for updateTaskStatus
    onError: () => showErrorToast("Error", "Failed to update task status."),
  });

  // Due date field
  const [dueDate, setDueDate] = usePageField({
    value: (data) => parseContextualDate(data.task.dueDate),
    update: () => Promise.resolve(true), // Placeholder for updateTaskDueDate
    onError: () => showErrorToast("Error", "Failed to update due date."),
  });

  // Assignees field - simplified placeholder
  const [assignees, setAssignees] = usePageField({
    value: (data) => data.task.assignees?.map((assignee) => People.parsePersonForTurboUi(paths, assignee)) ?? [],
    update: () => {
      return Promise.resolve(true); // Placeholder for updateTaskAssignees
    },
    onError: () => showErrorToast("Error", "Failed to update assignees."),
  });

  // Milestone field - simplified placeholder
  const [milestone, _setMilestone] = usePageField({
    value: (data) => (data.task.milestone ? parseMilestoneForTurboUi(paths, data.task.milestone) : null),
    update: () => Promise.resolve(true), // Placeholder for updateTaskMilestone
    onError: () => showErrorToast("Error", "Failed to update milestone."),
  });

  // Subscription status - placeholder
  const [isSubscribed, setIsSubscribed] = React.useState(true);

  // Handlers for task actions
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  const searchMilestones = async ({}: { query: string }) => {
    // Placeholder for milestone search
    return Promise.resolve([]) as Promise<TaskPage.Milestone[]>;
  };

  // Space and project info
  const spaceName = task.space.name;
  const spaceLink = paths.spacePath(task.space.id);
  const projectName = task.project.name;
  const projectLink = paths.projectPath(task.project.id);
  const milestoneLink = paths.projectMilestonePath(task.milestone.id);
  const milestoneName = task.milestone.title;
  const workmapLink = paths.spaceWorkMapPath(task.space.id, "projects" as const);

  // Prepare TaskPage props
  const props: TaskPage.Props = {
    spaceLink,
    spaceName,
    projectLink,
    projectName,
    milestoneLink,
    milestoneName,
    workmapLink,

    // Milestone selection
    milestone: milestone as TaskPage.Milestone | null,
    // onMilestoneChange: setMilestone,

    // Core task data
    name: name as string,
    onNameChange: (newName) => {
      setName(newName);
      return Promise.resolve(true);
    },

    description,
    onDescriptionChange: () => Promise.resolve(true),

    status,
    onStatusChange: setStatus,

    dueDate: dueDate || undefined,
    onDueDateChange: setDueDate,

    assignees: assignees as TaskPage.Person[],
    onAssigneesChange: setAssignees,

    onDelete: () => Promise.resolve(),

    // Metadata
    createdAt: new Date(task.insertedAt || Date.now()),
    createdBy: People.parsePersonForTurboUi(paths, task.creator) as TaskPage.Person,

    // Subscription
    isSubscribed,
    onSubscriptionToggle: (subscribed: boolean) => {
      setIsSubscribed(subscribed);
    },

    // Actions
    onCopyUrl: handleCopyUrl,

    // Search functionality
    searchMilestones,
    // Placeholder for person lookup functionality
    peopleSearch: () => Promise.resolve([]),
    mentionedPersonLookup: () => Promise.resolve(null),

    // Permissions - simplified placeholder
    canEdit: true,

    // Timeline/Comments - placeholder
    canComment: true,
  };

  return <TaskPage key={task.id!} {...props} />;
}

interface usePageFieldProps<T> {
  value: (LoaderResult) => T;
  update: (newValue: T) => Promise<{ success?: boolean | null } | boolean | null | undefined>;
  onError?: (error: any) => void;
  validations?: ((newValue: T) => string | null)[];
}

function usePageField<T>({ value, update, onError, validations }: usePageFieldProps<T>): [T, (v: T) => void] {
  const { data, cacheVersion } = PageCache.useData(loader, { refreshCache: false });

  const [state, setState] = React.useState<T>(() => value(data));
  const [stateVersion, setStateVersion] = React.useState<number | undefined>(cacheVersion);

  React.useEffect(() => {
    if (cacheVersion !== stateVersion) {
      setState(value(data));
      setStateVersion(cacheVersion);
    }
  }, [value, cacheVersion, stateVersion]);

  const updateState = (newVal: T): void => {
    if (validations) {
      for (const validation of validations) {
        const error = validation(newVal);
        if (error) {
          onError?.(error);
          return;
        }
      }
    }

    const oldVal = state;

    const successHandler = () => {
      PageCache.invalidate(pageCacheKey(data.task.id!));
    };

    const errorHandler = (error: any) => {
      setState(oldVal);
      onError?.(error);
    };

    setState(newVal);

    update(newVal)
      .then((res) => {
        if (res === false || (typeof res === "object" && res?.success === false)) {
          errorHandler("Update failed");
        } else {
          successHandler();
        }
      })
      .catch(errorHandler);
  };

  return [state, updateState];
}
