import Api, { type AccessOptionsInt, type ProjectTemplateTask, type TaskReminder } from "@/api";
import * as Pages from "@/components/Pages";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import * as Tasks from "@/models/tasks";
import * as People from "@/models/people";
import { findFileSize, uploadFilesWithPreviews } from "@/models/blobs";
import { usePaths } from "@/routes/paths";
import type { PageModule } from "@/routes/types";
import { parseContent, showErrorToast, TemplateProjectPage, type AddFileUploadItem } from "turboui";
import React from "react";
import { loader, type LoadedData } from "./loader";
import { activePersonIds } from "./people";

export default { name: "ProjectTemplatePage", loader, Page } as PageModule;

type Mutate = (message: string, operation: () => Promise<unknown>) => Promise<boolean>;

function Page() {
  const { template } = Pages.useLoadedData<LoadedData>();
  const refresh = Pages.useRefresh();
  const paths = usePaths();
  const richTextHandlers = useRichEditorHandlers();
  const formattedTimePreferences = useFormattedTimePreferences();
  const { people, assigneesByTaskId } = useTemplatePeople(template);
  const statuses = Tasks.parseTaskStatusesForTurboUi(template.taskStatuses);
  const permissions = template.permissions ?? {
    canView: true,
    canComment: false,
    canEdit: false,
    hasFullAccess: false,
  };
  const transformPerson = React.useCallback(
    (person: People.Person) => People.parsePersonForTurboUi(paths, person)!,
    [paths],
  );
  const personSearch = People.usePersonFieldSearch({
    scope: { type: "space", id: template.space.id },
    transformResult: transformPerson,
  });

  const mutate: Mutate = async (message, operation) => {
    try {
      await operation();
      await refresh();
      return true;
    } catch (_error) {
      showErrorToast(message, "Your last confirmed template is still displayed. Try again.");
      return false;
    }
  };

  const tasks = (template.tasks ?? [])
    .map((task) => toTask(task, assigneesByTaskId.get(task.id) ?? []))
    .filter((task): task is TemplateProjectPage.Task => task !== null);
  const milestones = (template.milestones ?? []).map((milestone) => ({
    id: milestone.id,
    title: milestone.title,
    description: content(milestone.description),
    dueOffsetDays: milestone.dueOffsetDays ?? null,
    tasksOrderingState: milestone.tasksOrderingState,
    tasksKanbanState: parseJson(milestone.tasksKanbanState),
  }));
  const discussions = (template.discussions ?? []).map((discussion) => ({
    id: discussion.id,
    title: discussion.title,
    author: discussion.author ? People.parsePersonForTurboUi(paths, discussion.author) : null,
    date: new Date(discussion.insertedAt),
    link: paths.projectTemplateDiscussionPath(template.id, discussion.id),
    content: content(discussion.body),
  }));
  const resourceNodes = (template.resourceNodes ?? []).flatMap((node) =>
    toResourceNode(node, paths.projectTemplateResourcePath(template.id, node.id)),
  );

  async function onTemplateUpdate(updates: Partial<TemplateProjectPage.Props["template"]>) {
    return mutate("Template not updated", () =>
      Api.project_templates.update({
        id: template.id,
        name: updates.name,
        description: serializeContent(updates.description),
        durationDays: updates.durationDays,
        milestonesOrderingState: updates.milestonesOrderingState,
        tasksKanbanState: serializeJson(updates.tasksKanbanState),
      }),
    );
  }

  function onStatusesChange({
    nextStatuses,
    deletedStatusReplacements,
  }: {
    nextStatuses: TemplateProjectPage.Props["statuses"];
    deletedStatusReplacements: Record<string, string>;
  }) {
    return mutate("Workflow not updated", () =>
      Api.project_templates.update({
        id: template.id,
        taskStatuses: Tasks.serializeTaskStatuses(nextStatuses),
        deletedStatusReplacements: Object.entries(deletedStatusReplacements).map(
          ([deletedStatusId, replacementStatusId]) => ({ deletedStatusId, replacementStatusId }),
        ),
      }),
    );
  }

  const { onMilestoneCreate, onMilestoneUpdate, onMilestoneDelete, onMilestoneReorder } = useMilestoneOperations({
    templateId: template.id,
    milestonesOrderingState: template.milestonesOrderingState ?? milestones.map((item) => item.id),
    mutate,
  });

  const { onTaskCreate, onTaskUpdate, onTaskDelete, onTaskReorder } = createTaskOperations({
    templateId: template.id,
    mutate,
  });

  const { onPersonCreate, onPersonUpdate, onPersonDelete } = createPeopleOperations({
    templateId: template.id,
    mutate,
  });
  const onFolderCreate = createFolderOperation({ templateId: template.id, mutate });
  const onFilesUpload = createFilesUploadOperation({ templateId: template.id, parentFolderId: null, mutate });

  return (
    <TemplateProjectPage
      template={{
        id: template.id,
        name: template.name,
        description: content(template.description),
        durationDays: template.durationDays ?? null,
        milestonesOrderingState: template.milestonesOrderingState ?? [],
        tasksKanbanState: parseJson(template.tasksKanbanState),
      }}
      space={{ id: template.space.id, name: template.space.name, link: paths.spacePath(template.space.id) }}
      projectTemplatesLink={paths.spaceProjectTemplatesPath(template.space.id)}
      permissions={permissions}
      statuses={statuses}
      milestones={milestones}
      tasks={tasks}
      discussions={discussions}
      resourceNodes={resourceNodes}
      onFolderCreate={onFolderCreate}
      onFilesUpload={onFilesUpload}
      formatFileSize={findFileSize}
      newDiscussionLink={paths.projectTemplateDiscussionNewPath(template.id)}
      newDocumentLink={paths.projectTemplateNewDocumentPath(template.id)}
      people={people}
      personSearch={personSearch}
      richTextHandlers={richTextHandlers}
      formattedTimePreferences={formattedTimePreferences}
      onTemplateUpdate={onTemplateUpdate}
      onStatusesChange={onStatusesChange}
      onMilestoneCreate={onMilestoneCreate}
      onMilestoneUpdate={onMilestoneUpdate}
      onMilestoneDelete={onMilestoneDelete}
      onMilestoneReorder={onMilestoneReorder}
      onTaskCreate={onTaskCreate}
      onTaskUpdate={onTaskUpdate}
      onTaskDelete={onTaskDelete}
      onTaskReorder={onTaskReorder}
      onPersonCreate={onPersonCreate}
      onPersonUpdate={onPersonUpdate}
      onPersonDelete={onPersonDelete}
    />
  );
}

function useTemplatePeople(template: LoadedData["template"]) {
  const paths = usePaths();
  const people = (template.people ?? []).map((templatePerson) => ({
    id: templatePerson.id,
    person: templatePerson.person
      ? {
          id: templatePerson.person.id,
          fullName: templatePerson.person.fullName,
          avatarUrl: templatePerson.person.avatarUrl ?? null,
          title: templatePerson.person.title ?? undefined,
          profileLink: paths.profilePath(templatePerson.person.id),
        }
      : null,
    role: templatePerson.role,
    responsibility: templatePerson.responsibility ?? null,
    accessLevel: templatePerson.accessLevel,
    active: templatePerson.active,
  }));
  const peopleById = new Map(people.map((person) => [person.id, person]));
  const assigneesByTaskId = new Map<string, TemplateProjectPage.TemplatePerson[]>();

  for (const assignment of template.taskAssignments ?? []) {
    const person = peopleById.get(assignment.projectTemplatePersonId);
    if (!person) continue;

    const taskAssignees = assigneesByTaskId.get(assignment.projectTemplateTaskId) ?? [];
    assigneesByTaskId.set(assignment.projectTemplateTaskId, [...taskAssignees, person]);
  }

  return { people, assigneesByTaskId };
}

function useMilestoneOperations({
  templateId,
  milestonesOrderingState,
  mutate,
}: {
  templateId: string;
  milestonesOrderingState: string[];
  mutate: Mutate;
}) {
  function onMilestoneCreate(
    milestone: Omit<TemplateProjectPage.Milestone, "id" | "tasksOrderingState" | "tasksKanbanState">,
  ) {
    void mutate("Milestone not created", () =>
      Api.project_templates.createMilestone({
        templateId,
        title: milestone.title,
        description: serializeContent(milestone.description),
        dueOffsetDays: milestone.dueOffsetDays,
      }),
    );
  }

  function onMilestoneUpdate(milestoneId: string, updates: Partial<TemplateProjectPage.Milestone>) {
    return mutate("Milestone not updated", () =>
      Api.project_templates.updateMilestone({
        templateId,
        milestoneId,
        title: updates.title,
        description: serializeContent(updates.description),
        dueOffsetDays: updates.dueOffsetDays,
        tasksOrderingState: updates.tasksOrderingState,
        tasksKanbanState: serializeJson(updates.tasksKanbanState),
      }),
    ).then(() => undefined);
  }

  function onMilestoneDelete(milestoneId: string) {
    return mutate("Milestone not deleted", () =>
      Api.project_templates.deleteMilestone({ templateId, milestoneId }),
    ).then(() => undefined);
  }

  function onMilestoneReorder(milestoneId: string, destinationIndex: number) {
    return mutate("Milestones not reordered", () =>
      Api.project_templates.update({
        id: templateId,
        milestonesOrderingState: reorder(milestonesOrderingState, milestoneId, destinationIndex),
      }),
    ).then(() => undefined);
  }

  return { onMilestoneCreate, onMilestoneUpdate, onMilestoneDelete, onMilestoneReorder };
}

function createTaskOperations({ templateId, mutate }: { templateId: string; mutate: Mutate }) {
  function onTaskCreate(task: Omit<TemplateProjectPage.Task, "id">) {
    void mutate("Task not created", () => Api.project_templates.createTask(taskInput(templateId, task)));
  }

  function onTaskUpdate(taskId: string, updates: Partial<TemplateProjectPage.Task>) {
    return mutate("Task not updated", async () => {
      const { assignees, ...taskFields } = updates;

      if (Object.keys(taskFields).length > 0) {
        await Api.project_templates.updateTask({ templateId, taskId, ...taskUpdates(taskFields) });
      }

      if (assignees) {
        await Api.project_templates.updateTaskAssignees({
          templateId,
          taskId,
          assigneeIds: activePersonIds(assignees),
        });
      }
    });
  }

  function onTaskDelete(taskId: string) {
    return mutate("Task not deleted", () => Api.project_templates.deleteTask({ templateId, taskId })).then(
      () => undefined,
    );
  }

  const onTaskReorder = createTaskMove({ templateId, mutate });

  return { onTaskCreate, onTaskUpdate, onTaskDelete, onTaskReorder };
}

export function createTaskMove({ templateId, mutate }: { templateId: string; mutate: Mutate }) {
  return (taskId: string, milestoneId: string | null, destinationIndex: number) =>
    mutate("Tasks not reordered", () =>
      Api.project_templates.updateTask({
        templateId,
        taskId,
        milestoneId,
        index: destinationIndex,
      }),
    );
}

export function createPeopleOperations({ templateId, mutate }: { templateId: string; mutate: Mutate }) {
  function onPersonCreate(person: Omit<TemplateProjectPage.TemplatePerson, "id" | "active">) {
    const selectedPerson = person.person;
    if (!selectedPerson) return false;

    return mutate("Contributor not added", () =>
      Api.project_templates.createPerson({
        templateId,
        personId: selectedPerson.id,
        role: person.role,
        responsibility: person.responsibility,
        accessLevel: person.accessLevel as AccessOptionsInt,
      }),
    );
  }

  function onPersonUpdate(
    templatePersonId: string,
    updates: Partial<Omit<TemplateProjectPage.TemplatePerson, "id" | "active">>,
  ) {
    return mutate("Contributor not updated", () =>
      Api.project_templates.updatePerson({
        templateId,
        templatePersonId,
        personId: updates.person?.id,
        role: updates.role,
        responsibility: updates.responsibility,
        accessLevel: updates.accessLevel as AccessOptionsInt | undefined,
      }),
    );
  }

  function onPersonDelete(templatePersonId: string) {
    return mutate("Contributor not removed", () =>
      Api.project_templates.deletePerson({ templateId, templatePersonId }),
    );
  }

  return { onPersonCreate, onPersonUpdate, onPersonDelete };
}

export function createFolderOperation({ templateId, mutate }: { templateId: string; mutate: Mutate }) {
  return (parentFolderId: string | null, name: string) =>
    mutate("Folder not created", () =>
      Api.project_templates.createFolder({
        templateId,
        parentFolderId,
        name,
      }),
    );
}

export function createFilesUploadOperation({
  templateId,
  parentFolderId,
  mutate,
}: {
  templateId: string;
  parentFolderId: string | null;
  mutate: Mutate;
}) {
  return (items: AddFileUploadItem[], setProgress: (progress: number) => void) =>
    mutate("Files not uploaded", () =>
      uploadFilesWithPreviews({
        items,
        setProgress,
        persist: (files) =>
          Api.project_templates.createFiles({
            templateId,
            parentFolderId,
            files: files.map((file) => ({ ...file, description: JSON.stringify(file.description) })),
          }),
      }),
    );
}

export function toResourceNode(
  node: NonNullable<LoadedData["template"]["resourceNodes"]>[number],
  link: string,
): TemplateProjectPage.ResourceNode[] {
  const resource = node.folder ?? node.document ?? node.file ?? node.link;
  if (!resource) return [];

  const contentType = node.file?.blob?.contentType ?? null;
  const thumbnailBlob = node.file?.previewBlob ?? node.file?.blob;

  return [
    {
      id: node.id,
      parentFolderId: node.parentFolderId ?? null,
      type: node.type,
      position: node.position,
      name: resource.name,
      link,
      insertedAt: node.insertedAt,
      updatedAt: node.updatedAt,
      fileKind: fileKind(contentType),
      thumbnail:
        contentType?.includes("image") && thumbnailBlob?.url
          ? {
              url: thumbnailBlob.url,
              alt: resource.name,
              width: thumbnailBlob.width,
              height: thumbnailBlob.height,
            }
          : null,
    },
  ];
}

function fileKind(contentType: string | null): TemplateProjectPage.ResourceNode["fileKind"] {
  if (!contentType) return undefined;
  if (contentType.includes("image")) return "image";
  if (contentType.includes("pdf")) return "pdf";
  if (contentType.includes("quicktime") || contentType.includes("mov")) return "mov";
  if (contentType.includes("video")) return "video";
  if (contentType.includes("audio")) return "audio";
  if (contentType.includes("zip")) return "zip";
  return "default";
}

function content(value?: string | null) {
  try {
    return parseContent(value || "{}");
  } catch {
    return null;
  }
}

function serializeContent(value: unknown) {
  return value === undefined ? undefined : value === null ? null : JSON.stringify(value);
}

function serializeJson(value: unknown) {
  return value === undefined ? undefined : JSON.stringify(value);
}

function parseJson(value?: string | null): unknown {
  try {
    return JSON.parse(value || "{}");
  } catch {
    return {};
  }
}

function toTask(
  task: ProjectTemplateTask,
  assignees: TemplateProjectPage.TemplatePerson[],
): TemplateProjectPage.Task | null {
  const status = Tasks.parseTaskStatusForTurboUi(task.taskStatus);
  if (!status) return null;
  return {
    id: task.id,
    name: task.name,
    description: content(task.description),
    milestoneId: task.projectTemplateMilestoneId ?? null,
    priority: task.priority ?? null,
    size: task.size ?? null,
    dueOffsetDays: task.dueOffsetDays ?? null,
    reminders: task.reminders.flatMap(toReminder),
    status,
    assignees,
  };
}

function taskInput(templateId: string, task: Omit<TemplateProjectPage.Task, "id">) {
  return {
    templateId,
    milestoneId: task.milestoneId,
    name: task.name,
    description: serializeContent(task.description),
    priority: task.priority,
    size: task.size,
    dueOffsetDays: task.dueOffsetDays,
    reminders: task.reminders.map(toApiReminder),
    taskStatus: serializeTaskStatus(task.status),
    assigneeIds: activePersonIds(task.assignees),
  };
}

function taskUpdates(updates: Partial<TemplateProjectPage.Task>) {
  return {
    milestoneId: updates.milestoneId,
    name: updates.name,
    description: serializeContent(updates.description) as string | undefined,
    priority: updates.priority,
    size: updates.size,
    dueOffsetDays: updates.dueOffsetDays,
    reminders: updates.reminders?.map(toApiReminder),
    taskStatus: updates.status ? serializeTaskStatus(updates.status) : undefined,
  };
}

function toReminder(reminder: TaskReminder): TemplateProjectPage.Reminder[] {
  return reminder.type === "on_date" ? [] : [{ type: reminder.type, days: reminder.days ?? null }];
}

function toApiReminder(reminder: TemplateProjectPage.Reminder): TaskReminder {
  return { __typename: "task_reminder", type: reminder.type, days: reminder.days ?? null };
}

function serializeTaskStatus(status: TemplateProjectPage.Task["status"]) {
  const serialized = Tasks.serializeTaskStatus(status);
  if (!serialized) throw new Error("A template task must have a workflow status");
  return serialized;
}

function reorder(ids: string[], id: string, destination: number) {
  const next = ids.filter((item) => item !== id);
  next.splice(Math.max(0, Math.min(destination, next.length)), 0, id);
  return next;
}
