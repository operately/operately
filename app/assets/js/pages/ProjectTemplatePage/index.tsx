import * as Templates from "@/models/projectTemplates/projectTemplateEditorLifecycle";
import { useRichTextHandlers } from "@/hooks/useRichTextHandlers";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import * as People from "@/models/people";
import { content, serializeContent, serializeJson } from "@/models/projectTemplates";
import { useTemplateTasksForTurboUi } from "@/models/projectTemplates/useTemplateTasksForTurboUi";
import { useTemplateTaskSlideInProps } from "@/models/projectTemplates/useTemplateTaskSlideInProps";
import { findFileSize, uploadFilesWithPreviews } from "@/models/blobs";
import { usePaths, type Paths } from "@/routes/paths";
import type { PageModule } from "@/routes/types";
import { showErrorToast, TemplateProjectPage, type AddFileUploadItem } from "turboui";
import React from "react";
import { useNavigate } from "react-router";
import { loader, useLoadedData, useRefresh, type LoadedData } from "./loader";

export default { name: "ProjectTemplatePage", loader, Page } as PageModule;

function Page() {
  const { template } = useLoadedData();
  const scope = { templateId: template.id, spaceId: template.space.id };
  const updateTemplate = Templates.useUpdateTemplate(scope);
  const refresh = useRefresh();
  const paths = usePaths();
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

  const canEdit = !template.archivedAt && Boolean(permissions.canEdit || permissions.hasFullAccess);
  const richTextHandlers = useRichTextHandlers({
    taskList: { resourceType: "project_template", resourceId: template.id, field: "description", canEdit },
  });
  const slideInModel = useTemplateTaskSlideInProps({ canEdit, formattedTimePreferences });
  const [overview, setOverview] = React.useState(() => templateOverview(template));
  React.useEffect(() => {
    setOverview(templateOverview(template));
  }, [template]);

  const {
    people,
    tasks,
    milestones,
    milestonesOrderingState,
    tasksKanbanState,
    statuses,
    onTaskCreate,
    onTaskUpdate,
    onTaskDelete,
    onTaskReorder,
    onTaskKanbanChange,
    onMilestoneCreate,
    onMilestoneUpdate,
    onMilestoneDelete,
    onMilestoneReorder,
    onPersonCreate,
    onPersonUpdate,
    onPersonDelete,
    onStatusesChange,
  } = useTemplateTasksForTurboUi({
    template,
    profilePath,
    milestoneLink,
  });
  const templatePersonIds = React.useMemo(
    () => people.flatMap((templatePerson) => (templatePerson.person?.id ? [templatePerson.person.id] : [])),
    [people],
  );
  const contributorPersonSearch = People.usePersonFieldSearch({
    scope: { type: "space", id: template.space.id },
    transformResult: transformPerson,
    ignoredIds: templatePersonIds,
  });

  const discussions = (template.discussions ?? []).map((discussion) => ({
    id: discussion.id,
    title: discussion.title,
    author: discussion.author ? People.parsePersonForTurboUi(paths, discussion.author) : null,
    date: new Date(discussion.insertedAt),
    link: paths.projectTemplateDiscussionPath(template.id, discussion.id),
    content: content(discussion.body),
  }));
  const resourceNodes = (template.resourceNodes ?? []).flatMap((node) =>
    toResourceNode(node, resourceNodeLink(node, template.id, paths)),
  );

  async function onTemplateUpdate(updates: Partial<TemplateProjectPage.Props["template"]>) {
    const snapshot = overview;
    setOverview({
      name: updates.name ?? overview.name,
      description: updates.description !== undefined ? updates.description : overview.description,
      durationDays: updates.durationDays !== undefined ? updates.durationDays : overview.durationDays,
    });
    try {
      await updateTemplate.mutateAsync({
        id: template.id,
        name: updates.name,
        description: serializeContent(updates.description),
        durationDays: updates.durationDays,
        milestonesOrderingState: updates.milestonesOrderingState,
        tasksKanbanState: serializeJson(updates.tasksKanbanState),
      });
      await refresh();
      return true;
    } catch {
      setOverview(snapshot);
      showErrorToast("Template not updated", "Your last confirmed template is still displayed. Try again.");
      return false;
    }
  }

  const resources = useTemplateResources(template);
  const lifecycle = useTemplateLifecycle(template);

  return (
    <TemplateProjectPage
      template={{
        id: template.id,
        name: overview.name,
        description: overview.description,
        durationDays: overview.durationDays,
        milestonesOrderingState,
        tasksKanbanState,
        archived: Boolean(template.archivedAt),
      }}
      space={{ id: template.space.id, name: template.space.name, link: paths.spacePath(template.space.id) }}
      projectTemplatesLink={paths.spaceProjectTemplatesPath(template.space.id)}
      permissions={permissions}
      statuses={statuses}
      milestones={milestones}
      tasks={tasks}
      discussions={discussions}
      resourceNodes={resourceNodes}
      formatFileSize={findFileSize}
      newDiscussionLink={paths.projectTemplateDiscussionNewPath(template.id)}
      newDocumentLink={paths.projectTemplateNewDocumentPath(template.id)}
      newLinkLink={paths.projectTemplateNewLinkPath(template.id)}
      people={people}
      personSearch={personSearch}
      contributorPersonSearch={contributorPersonSearch}
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
      onTaskKanbanChange={onTaskKanbanChange}
      getTemplateTaskPageProps={slideInModel.getTemplateTaskPageProps}
      onPersonCreate={onPersonCreate}
      onPersonUpdate={onPersonUpdate}
      onPersonDelete={onPersonDelete}
      {...resources}
      {...lifecycle}
    />
  );
}

function useTemplateLifecycle(template: LoadedData["template"]) {
  const scope = { templateId: template.id, spaceId: template.space.id };
  const duplicate = Templates.useDuplicateTemplate(scope);
  const archive = Templates.useArchiveTemplate(scope);
  const restore = Templates.useRestoreTemplate(scope);
  const remove = Templates.useDeleteTemplate(scope);
  const navigate = useNavigate();
  const paths = usePaths();
  const refresh = useRefresh();

  async function onDuplicate(id: string, name: string) {
    try {
      const { template: created } = await duplicate.mutateAsync({ id, name });
      navigate(paths.projectTemplatePath(created.id));
      return { success: true };
    } catch {
      showErrorToast("Template not duplicated", "Restore archived templates before duplicating them, then try again.");
      return { success: false, error: "The template could not be duplicated. Refresh the page and try again." };
    }
  }

  async function onArchive(id: string) {
    try {
      await archive.mutateAsync({ id });
      await refresh();
      return { success: true };
    } catch {
      showErrorToast("Template not archived", "The template may have changed. Refresh the page and try again.");
      return { success: false, error: "The template could not be changed. Refresh the page and try again." };
    }
  }

  async function onRestore(id: string) {
    try {
      await restore.mutateAsync({ id });
      await refresh();
      return { success: true };
    } catch {
      showErrorToast("Template not restored", "The template may have changed. Refresh the page and try again.");
      return { success: false, error: "The template could not be changed. Refresh the page and try again." };
    }
  }

  async function onDelete(id: string) {
    try {
      await remove.mutateAsync({ id });
      navigate(paths.spaceProjectTemplatesPath(template.space.id));
      return { success: true };
    } catch {
      showErrorToast("Template not deleted", "The template may have changed. Refresh the page and try again.");
      return { success: false, error: "The template could not be deleted. Refresh the page and try again." };
    }
  }

  return { onDuplicate, onArchive, onRestore, onDelete };
}

export function useTemplateResources(template: LoadedData["template"]) {
  const templateId = template.id;
  const scope = { templateId, spaceId: template.space.id };
  const createFolder = Templates.useCreateTemplateFolder(scope);
  const renameFolder = Templates.useUpdateTemplateFolder(scope);
  const deleteResource = Templates.useDeleteTemplateResource(scope);
  const moveResource = Templates.useMoveTemplateResource(scope);
  const createFiles = Templates.useCreateTemplateFiles(scope);
  const refresh = useRefresh();

  async function onFolderCreate(parentFolderId: string | null, name: string) {
    try {
      await createFolder.mutateAsync({ templateId, parentFolderId, name });
      await refresh();
      return true;
    } catch {
      showErrorToast("Folder not created", "Your last confirmed template is still displayed. Try again.");
      return false;
    }
  }

  async function onFolderRename(folderId: string, name: string) {
    try {
      await renameFolder.mutateAsync({ templateId, folderId, name });
      await refresh();
      return true;
    } catch {
      showErrorToast("Folder not renamed", "Your last confirmed template is still displayed. Try again.");
      return false;
    }
  }

  async function onResourceDelete(nodeId: string) {
    try {
      await deleteResource.mutateAsync({ templateId, nodeId });
      await refresh();
      return true;
    } catch {
      showErrorToast("Resource not deleted", "Your last confirmed template is still displayed. Try again.");
      return false;
    }
  }

  async function onResourceMove(nodeId: string, parentFolderId: string | null) {
    try {
      await moveResource.mutateAsync({ templateId, nodeId, parentFolderId });
      await refresh();
      return true;
    } catch {
      showErrorToast("Resource not moved", "Your last confirmed template is still displayed. Try again.");
      return false;
    }
  }

  async function onFilesUpload(
    items: AddFileUploadItem[],
    setProgress: (progress: number) => void,
    parentFolderId: string | null,
  ) {
    try {
      await uploadFilesWithPreviews({
        items,
        setProgress,
        persist: (files) =>
          createFiles.mutateAsync({
            templateId,
            parentFolderId,
            files: files.map((file) => ({ ...file, description: JSON.stringify(file.description) })),
          }),
      });
      await refresh();
      return true;
    } catch {
      showErrorToast("Files not uploaded", "Your last confirmed template is still displayed. Try again.");
      return false;
    }
  }

  return { onFolderCreate, onFolderRename, onResourceDelete, onResourceMove, onFilesUpload };
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
      folderId: node.folder?.id ?? null,
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

function resourceNodeLink(
  node: NonNullable<LoadedData["template"]["resourceNodes"]>[number],
  templateId: string,
  paths: Paths,
): string {
  switch (node.type) {
    case "document":
      return paths.projectTemplateDocumentPath(templateId, node.id);
    case "link":
      return paths.projectTemplateLinkPath(templateId, node.id);
    case "file":
      return paths.projectTemplateFilePath(templateId, node.id);
    case "folder":
      return "#";
  }
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

function templateOverview(template: LoadedData["template"]) {
  return {
    name: template.name,
    description: content(template.description),
    durationDays: template.durationDays ?? null,
  };
}
