import { useUpdateTemplate } from "@/models/projectTemplates/projectTemplateEditorLifecycle";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useRichTextHandlers } from "@/hooks/useRichTextHandlers";
import * as People from "@/models/people";
import { useTemplateTaskSlideInProps } from "@/models/projectTemplates/useTemplateTaskSlideInProps";
import { useTemplateTasksForTurboUi } from "@/models/projectTemplates/useTemplateTasksForTurboUi";
import { compareIds, usePaths } from "@/routes/paths";
import type { PageModule } from "@/routes/types";
import React from "react";
import { useNavigate } from "react-router";
import { MilestonePage, showErrorToast } from "turboui";
import { loader, useLoadedData, useRefresh } from "./loader";

export default { name: "ProjectTemplateMilestonePage", loader, Page } as PageModule;

function Page() {
  const { template, milestone } = useLoadedData();
  const scope = { templateId: template.id, spaceId: template.space.id };
  const updateTemplate = useUpdateTemplate(scope);
  const refresh = useRefresh();
  const paths = usePaths();
  const navigate = useNavigate();
  const richTextHandlers = useRichTextHandlers({
    scope: { type: "space", id: template.space.id },
    taskList: {
      resourceType: "template_milestone",
      resourceId: milestone.id,
      field: "description",
      canEdit: !template.archivedAt && Boolean(template.permissions?.canEdit || template.permissions?.hasFullAccess),
    },
  });
  const formattedTimePreferences = useFormattedTimePreferences();
  const profilePath = React.useCallback((personId: string) => paths.profilePath(personId), [paths]);
  const milestoneLink = React.useCallback(
    (milestoneId: string) => paths.projectTemplateMilestonePath(template.id, milestoneId),
    [paths, template.id],
  );
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

  const {
    tasks: templateTasks,
    milestones,
    statuses,
    onTaskCreate,
    onTaskUpdate,
    onTaskDelete,
    onTaskReorder,
    onMilestoneUpdate,
    onMilestoneDelete,
  } = useTemplateTasksForTurboUi({
    template,
    profilePath,
    milestoneLink,
  });
  const currentMilestone = milestones.find((item) => compareIds(item.id, milestone.id));
  const tasks = templateTasks.filter((task) => compareIds(task.milestoneId, milestone.id));
  const slideInModel = useTemplateTaskSlideInProps({
    canEdit: !Boolean(template.archivedAt) && Boolean(permissions.canEdit || permissions.hasFullAccess),
    formattedTimePreferences,
  });

  const handleDelete = async () => {
    const deleted = await onMilestoneDelete(milestone.id);
    if (deleted) {
      navigate(paths.projectTemplatePath(template.id, { tab: "tasks" }));
    }
  };

  async function updateTemplateName(name: string) {
    try {
      await updateTemplate.mutateAsync({ id: template.id, name });
      await refresh();
      return true;
    } catch {
      showErrorToast("Template not updated", "Your last confirmed template is still displayed. Try again.");
      return false;
    }
  }

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
      tasksCount={templateTasks.length}
      discussionsCount={(template.discussions ?? []).length}
      docsAndFilesCount={(template.resourceNodes ?? []).length}
      milestoneId={milestone.id}
      title={currentMilestone?.title ?? milestone.title}
      onMilestoneTitleChange={(title) => onMilestoneUpdate(milestone.id, { title })}
      description={currentMilestone?.description}
      onDescriptionChange={(description) => onMilestoneUpdate(milestone.id, { description })}
      dueOffsetDays={currentMilestone?.dueOffsetDays ?? null}
      onDueOffsetDaysChange={(dueOffsetDays) => {
        void onMilestoneUpdate(milestone.id, { dueOffsetDays });
      }}
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
