import Api from "@/api";
import * as Pages from "@/components/Pages";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import * as People from "@/models/people";
import {
  content,
  persistAndRefreshTemplate,
  persistPersonCreate,
  persistPersonDelete,
  persistPersonUpdate,
  persistTemplateChange,
  serializeContent,
  type Mutate,
} from "@/models/projectTemplates";
import { useTemplateTasksForTurboUi } from "@/models/projectTemplates/useTemplateTasksForTurboUi";
import { useTemplateTaskSlideInProps } from "@/models/projectTemplates/useTemplateTaskSlideInProps";
import { findFileSize, uploadFilesWithPreviews } from "@/models/blobs";
import { usePaths, type Paths } from "@/routes/paths";
import type { PageModule } from "@/routes/types";
import { showErrorToast, TemplateProjectPage, type AddFileUploadItem } from "turboui";
import React from "react";
import { useNavigate } from "react-router";
import { loader, type LoadedData } from "./loader";

export default { name: "ProjectTemplatePage", loader, Page } as PageModule;

function Page() {
  const { template } = Pages.useLoadedData<LoadedData>();
  const refresh = Pages.useRefresh();
  const paths = usePaths();
  const navigate = useNavigate();
  const richTextHandlers = useRichEditorHandlers();
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
  const slideInModel = useTemplateTaskSlideInProps({ canEdit, formattedTimePreferences });
  const mutate: Mutate = (message, operation) => persistAndRefreshTemplate(refresh, message, operation);
  const [overview, setOverview] = React.useState(() => templateOverview(template));
  React.useEffect(() => {
    setOverview(templateOverview(template));
  }, [template]);

  const {
    people,
    tasks,
    milestones,
    milestonesOrderingState,
    statuses,
    onTaskCreate,
    onTaskUpdate,
    onTaskDelete,
    onTaskReorder,
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
    mutate: persistTemplateChange,
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
    const saved = await persistTemplateChange("Template not updated", () =>
      Api.project_templates.update({
        id: template.id,
        name: updates.name,
        description: serializeContent(updates.description),
        durationDays: updates.durationDays,
        milestonesOrderingState: updates.milestonesOrderingState,
      }),
    );
    if (!saved) setOverview(snapshot);
    return saved;
  }

  const onFolderCreate = createFolderOperation({ templateId: template.id, mutate });
  const onFolderRename = createFolderRenameOperation({ templateId: template.id, mutate });
  const onResourceDelete = createResourceDeleteOperation({ templateId: template.id, mutate });
  const onResourceMove = createResourceMoveOperation({ templateId: template.id, mutate });
  const onFilesUpload = createFilesUploadOperation({ templateId: template.id, mutate });
  const lifecycleHandlers = createProjectTemplateEditorLifecycleHandlers({
    navigate,
    refresh,
    paths,
    spaceId: template.space.id,
  });

  return (
    <TemplateProjectPage
      template={{
        id: template.id,
        name: overview.name,
        description: overview.description,
        durationDays: overview.durationDays,
        milestonesOrderingState,
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
      onFolderCreate={onFolderCreate}
      onFolderRename={onFolderRename}
      onResourceDelete={onResourceDelete}
      onResourceMove={onResourceMove}
      onFilesUpload={onFilesUpload}
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
      getTemplateTaskPageProps={slideInModel.getTemplateTaskPageProps}
      onPersonCreate={onPersonCreate}
      onPersonUpdate={onPersonUpdate}
      onPersonDelete={onPersonDelete}
      {...lifecycleHandlers}
    />
  );
}

function createProjectTemplateEditorLifecycleHandlers({
  navigate,
  refresh,
  paths,
  spaceId,
}: {
  navigate: (path: string) => void;
  refresh: () => Promise<unknown>;
  paths: Pick<Paths, "projectTemplatePath" | "spaceProjectTemplatesPath">;
  spaceId: string;
}): Pick<TemplateProjectPage.Props, "onDuplicate" | "onArchive" | "onRestore" | "onDelete"> {
  async function onDuplicate(id: string, name: string) {
    let result;

    try {
      result = await Api.project_templates.duplicate({ id, name });
    } catch (_error) {
      showErrorToast("Template not duplicated", "Restore archived templates before duplicating them, then try again.");
      return { success: false, error: "The template could not be duplicated. Refresh the page and try again." };
    }

    navigate(paths.projectTemplatePath(result.template.id));
    return { success: true };
  }

  async function onLifecycleChange(message: string, operation: () => Promise<unknown>) {
    try {
      await operation();
      await refresh();
      return { success: true };
    } catch (_error) {
      showErrorToast(message, "The template may have changed. Refresh the page and try again.");
      return { success: false, error: "The template could not be changed. Refresh the page and try again." };
    }
  }

  async function onDelete(id: string) {
    try {
      await Api.project_templates.delete({ id });
      navigate(paths.spaceProjectTemplatesPath(spaceId));
      return { success: true };
    } catch (_error) {
      showErrorToast("Template not deleted", "The template may have changed. Refresh the page and try again.");
      return { success: false, error: "The template could not be deleted. Refresh the page and try again." };
    }
  }

  return {
    onDuplicate,
    onArchive: (id) => onLifecycleChange("Template not archived", () => Api.project_templates.archive({ id })),
    onRestore: (id) => onLifecycleChange("Template not restored", () => Api.project_templates.restore({ id })),
    onDelete,
  };
}

export function createPeopleOperations({ templateId, mutate }: { templateId: string; mutate: Mutate }) {
  function onPersonCreate(person: Omit<TemplateProjectPage.TemplatePerson, "id" | "active">) {
    const selectedPerson = person.person;
    if (!selectedPerson) return false;

    return mutate("Contributor not added", () => persistPersonCreate(templateId, person));
  }

  function onPersonUpdate(
    templatePersonId: string,
    updates: Partial<Omit<TemplateProjectPage.TemplatePerson, "id" | "active">>,
  ) {
    return mutate("Contributor not updated", () => persistPersonUpdate(templateId, templatePersonId, updates));
  }

  function onPersonDelete(templatePersonId: string) {
    return mutate("Contributor not removed", () => persistPersonDelete(templateId, templatePersonId));
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

export function createFolderRenameOperation({ templateId, mutate }: { templateId: string; mutate: Mutate }) {
  return (folderId: string, name: string) =>
    mutate("Folder not renamed", () => Api.project_templates.updateFolder({ templateId, folderId, name }));
}

export function createResourceDeleteOperation({ templateId, mutate }: { templateId: string; mutate: Mutate }) {
  return (nodeId: string) =>
    mutate("Resource not deleted", () => Api.project_templates.deleteResource({ templateId, nodeId }));
}

export function createResourceMoveOperation({ templateId, mutate }: { templateId: string; mutate: Mutate }) {
  return (nodeId: string, parentFolderId: string | null) =>
    mutate("Resource not moved", () => Api.project_templates.moveResource({ templateId, nodeId, parentFolderId }));
}

export function createFilesUploadOperation({ templateId, mutate }: { templateId: string; mutate: Mutate }) {
  return (items: AddFileUploadItem[], setProgress: (progress: number) => void, parentFolderId: string | null) =>
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
