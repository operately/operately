import Api from "@/api";
import * as Pages from "@/components/Pages";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import * as People from "@/models/people";
import {
  content,
  createTaskOperations,
  mapTemplatePeople,
  serializeContent,
  toTask,
  toTemplateMilestone,
  type Mutate,
} from "@/models/projectTemplates";
import { useTemplateTaskSlideInProps } from "@/models/projectTemplates/useTemplateTaskSlideInProps";
import * as Tasks from "@/models/tasks";
import * as Time from "@/utils/time";
import { compareIds, usePaths } from "@/routes/paths";
import type { PageModule } from "@/routes/types";
import React from "react";
import { useNavigate } from "react-router";
import { MilestonePage, showErrorToast, TemplateProjectPage } from "turboui";
import { loader, type LoadedData } from "./loader";

export default { name: "ProjectTemplateMilestonePage", loader, Page } as PageModule;

function Page() {
  const { template, milestone } = Pages.useLoadedData<LoadedData>();
  const refresh = Pages.useRefresh();
  const paths = usePaths();
  const navigate = useNavigate();
  const richTextHandlers = useRichEditorHandlers({ scope: { type: "space", id: template.space.id } });
  const formattedTimePreferences = useFormattedTimePreferences();
  const { assigneesByTaskId } = mapTemplatePeople(template, (personId) => paths.profilePath(personId));
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

  const milestones = (template.milestones ?? []).map((item) =>
    toTemplateMilestone(item, paths.projectTemplateMilestonePath(template.id, item.id)),
  );
  const tasks = (template.tasks ?? [])
    .map((task) => toTask(task, assigneesByTaskId.get(task.id) ?? []))
    .filter((task): task is TemplateProjectPage.Task => task !== null)
    .filter((task) => compareIds(task.milestoneId, milestone.id));

  const { onTaskCreate, onTaskUpdate, onTaskDelete, onTaskReorder } = createTaskOperations({
    templateId: template.id,
    mutate,
  });
  const slideInModel = useTemplateTaskSlideInProps({
    canEdit: !Boolean(template.archivedAt) && Boolean(permissions.canEdit || permissions.hasFullAccess),
    formattedTimePreferences,
  });

  const handleTitleChange = (title: string) =>
    mutate("Milestone not updated", () =>
      Api.project_templates.updateMilestone({
        templateId: template.id,
        milestoneId: milestone.id,
        title,
      }),
    );

  const handleDescriptionChange = (description: unknown) =>
    mutate("Milestone not updated", () =>
      Api.project_templates.updateMilestone({
        templateId: template.id,
        milestoneId: milestone.id,
        description: serializeContent(description),
      }),
    );

  const handleDueOffsetDaysChange = (dueOffsetDays: number | null) => {
    void mutate("Milestone not updated", () =>
      Api.project_templates.updateMilestone({
        templateId: template.id,
        milestoneId: milestone.id,
        dueOffsetDays,
      }),
    );
  };

  const handleDelete = async () => {
    const deleted = await mutate("Milestone not deleted", () =>
      Api.project_templates.deleteMilestone({ templateId: template.id, milestoneId: milestone.id }),
    );

    if (deleted) {
      navigate(paths.projectTemplatePath(template.id, { tab: "tasks" }));
    }
  };

  const updateTemplateName = (name: string) =>
    mutate("Template not updated", () => Api.project_templates.update({ id: template.id, name }));

  return (
    <MilestonePage
      variant="project-template"
      template={{
        id: template.id,
        name: template.name,
        archived: Boolean(template.archivedAt),
      }}
      space={{ id: template.space.id, name: template.space.name, link: paths.spacePath(template.space.id) }}
      projectTemplatesLink={paths.spaceProjectTemplatesPath(template.space.id)}
      templateLink={paths.projectTemplatePath(template.id)}
      updateTemplateName={updateTemplateName}
      permissions={permissions}
      tasksCount={(template.tasks ?? []).length}
      discussionsCount={(template.discussions ?? []).length}
      docsAndFilesCount={(template.resourceNodes ?? []).length}
      milestoneId={milestone.id}
      title={milestone.title}
      onMilestoneTitleChange={handleTitleChange}
      description={content(milestone.description)}
      onDescriptionChange={handleDescriptionChange}
      dueOffsetDays={milestone.dueOffsetDays ?? null}
      onDueOffsetDaysChange={handleDueOffsetDaysChange}
      insertedAt={Time.parseDate(milestone.insertedAt) ?? undefined}
      onDelete={handleDelete}
      tasks={tasks}
      statuses={statuses}
      milestones={milestones}
      onTaskCreate={onTaskCreate}
      onTaskUpdate={onTaskUpdate}
      onTaskDelete={onTaskDelete}
      onTaskReorder={onTaskReorder}
      personSearch={personSearch}
      getTemplateTaskPageProps={slideInModel.getTemplateTaskPageProps}
      richTextHandlers={richTextHandlers}
      localDraftKeyBase={`template-milestone:${milestone.id}`}
      formattedTimePreferences={formattedTimePreferences}
    />
  );
}
