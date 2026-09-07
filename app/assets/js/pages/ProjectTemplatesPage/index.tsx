import type { Space } from "@/api";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import * as ProjectTemplateModel from "@/models/projectTemplates";
import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";
import { Paths, usePaths } from "@/routes/paths";
import type { PageModule } from "@/routes/types";
import { ProjectTemplatesPage, showErrorToast } from "turboui";
import React from "react";
import { useNavigate, useSearchParams } from "react-router";
import { loader, useLoadedData } from "./loader";

export default { name: "ProjectTemplatesPage", loader, Page } as PageModule;

function Page() {
  const data = useLoadedData();
  const paths = usePaths();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const createTemplate = ProjectTemplateModel.useCreateProjectTemplate();
  const duplicateTemplate = ProjectTemplateModel.useDuplicateProjectTemplate();
  const archiveTemplate = ProjectTemplateModel.useArchiveProjectTemplate();
  const restoreTemplate = ProjectTemplateModel.useRestoreProjectTemplate();
  const deleteTemplate = ProjectTemplateModel.useDeleteProjectTemplate();
  const { billingAccessState } = useCompanyLoaderData();
  const fixedSpace = data.fixedSpace ? toSpace(data.fixedSpace, paths) : undefined;
  const editableSpaces = data.spaces
    .filter((space) => space.permissions?.canEdit)
    .map((space) => toSpace(space, paths));
  const readOnly = billingAccessState?.accessState === "read_only";
  const editableSpaceIds = new Set(editableSpaces.map((space) => space.id));
  const libraryPath = fixedSpace ? paths.spaceProjectTemplatesPath(fixedSpace.id) : paths.projectTemplatesPath();
  const lifecycleHandlers = createProjectTemplateLifecycleHandlers({
    navigate,
    paths,
    mutations: {
      duplicate: duplicateTemplate.mutateAsync,
      archive: archiveTemplate.mutateAsync,
      restore: restoreTemplate.mutateAsync,
      delete: deleteTemplate.mutateAsync,
    },
  });

  async function onCreate({ name, spaceId }: ProjectTemplatesPage.CreateInput) {
    try {
      const result = await createTemplate.mutateAsync({ name, spaceId });
      navigate(paths.projectTemplatePath(result.template.id));
      return { success: true };
    } catch (_error) {
      showErrorToast("Template not created", "Check the name and Space, then try again.");
      return {
        success: false,
        error: "The template could not be created. Check the name and Space, then try again.",
      };
    }
  }

  return (
    <ProjectTemplatesPage
      scope={fixedSpace ? "space" : "company"}
      navigation={
        fixedSpace
          ? [{ to: paths.spacePath(fixedSpace.id), label: fixedSpace.name }]
          : [{ to: paths.homePath(), label: "Home" }]
      }
      templates={data.templates}
      spaces={data.spaces.map((space) => toSpace(space, paths))}
      editableSpaces={editableSpaces}
      fixedSpace={fixedSpace}
      templatePath={(id) => paths.projectTemplatePath(id)}
      projectCreationPath={(template) =>
        !template.archivedAt && !readOnly && editableSpaceIds.has(template.space.id)
          ? paths.newProjectPath({
              templateId: template.id,
              spaceId: template.space.id,
              backPath: libraryPath,
              backPathName: "Project Templates",
            })
          : null
      }
      spaceTemplatesPath={(id) => paths.spaceProjectTemplatesPath(id)}
      formattedTimePreferences={useFormattedTimePreferences()}
      canCreate={!readOnly && (fixedSpace ? Boolean(data.fixedSpace?.permissions?.canEdit) : editableSpaces.length > 0)}
      onCreate={onCreate}
      canEdit={(template) => !readOnly && editableSpaceIds.has(template.space.id)}
      startCreating={searchParams.get("new") === "true"}
      {...lifecycleHandlers}
    />
  );
}

function createProjectTemplateLifecycleHandlers({
  navigate,
  paths,
  mutations,
}: {
  navigate: (path: string) => void;
  paths: Pick<Paths, "projectTemplatePath">;
  mutations: {
    duplicate: (input: { id: string; name: string }) => Promise<{ template: { id: string } }>;
    archive: (input: { id: string }) => Promise<unknown>;
    restore: (input: { id: string }) => Promise<unknown>;
    delete: (input: { id: string }) => Promise<unknown>;
  };
}): Pick<ProjectTemplatesPage.Props, "onDuplicate" | "onArchive" | "onRestore" | "onDelete"> {
  async function onDuplicate(id: string, name: string) {
    let result;

    try {
      result = await mutations.duplicate({ id, name });
    } catch (_error) {
      showErrorToast("Template not duplicated", "Restore archived templates before duplicating them, then try again.");
      return { success: false, error: "The template could not be duplicated. Refresh the page and try again." };
    }

    navigate(paths.projectTemplatePath(result.template.id));
    return { success: true };
  }

  async function lifecycleMutation(message: string, operation: () => Promise<unknown>) {
    try {
      await operation();
      return { success: true };
    } catch (_error) {
      showErrorToast(message, "The template may have changed. Refresh the page and try again.");
      return { success: false, error: "The template could not be changed. Refresh the page and try again." };
    }
  }

  return {
    onDuplicate,
    onArchive: (id) => lifecycleMutation("Template not archived", () => mutations.archive({ id })),
    onRestore: (id) => lifecycleMutation("Template not restored", () => mutations.restore({ id })),
    onDelete: (id) => lifecycleMutation("Template not deleted", () => mutations.delete({ id })),
  };
}

function toSpace(space: Space, paths: Paths): ProjectTemplatesPage.Space {
  return { id: space.id, name: space.name, link: paths.spacePath(space.id) };
}
