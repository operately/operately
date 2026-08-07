import Api, { type Space } from "@/api";
import * as Pages from "@/components/Pages";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";
import { Paths, usePaths } from "@/routes/paths";
import type { PageModule } from "@/routes/types";
import { ProjectTemplatesPage, showErrorToast } from "turboui";
import React from "react";
import { useNavigate } from "react-router";
import { loader, type LoadedData } from "./loader";

export default { name: "ProjectTemplatesPage", loader, Page } as PageModule;

function Page() {
  const data = Pages.useLoadedData<LoadedData>();
  const paths = usePaths();
  const navigate = useNavigate();
  const { billingAccessState } = useCompanyLoaderData();
  const fixedSpace = data.fixedSpace ? toSpace(data.fixedSpace, paths) : undefined;
  const editableSpaces = data.editableSpaces.map((space) => toSpace(space, paths));
  const readOnly = billingAccessState?.accessState === "read_only";
  const editableSpaceIds = new Set(editableSpaces.map((space) => space.id));
  const libraryPath = fixedSpace ? paths.spaceProjectTemplatesPath(fixedSpace.id) : paths.projectTemplatesPath();

  async function onFilter({ search, spaceId }: ProjectTemplatesPage.Filters) {
    const result = await Api.project_templates.list({
      search: search || undefined,
      spaceId: fixedSpace?.id ?? spaceId,
      archiveStatus: "active",
    });

    return result.templates ?? [];
  }

  async function onCreate({ name, spaceId }: ProjectTemplatesPage.CreateInput) {
    try {
      const result = await Api.project_templates.create({ name, spaceId });
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
        !readOnly && editableSpaceIds.has(template.space.id)
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
      canCreate={
        !readOnly &&
        (fixedSpace ? data.editableSpaces.some((space) => space.id === fixedSpace.id) : editableSpaces.length > 0)
      }
      onFilter={onFilter}
      onCreate={onCreate}
    />
  );
}

function toSpace(space: Space, paths: Paths): ProjectTemplatesPage.Space {
  return { id: space.id, name: space.name, link: paths.spacePath(space.id) };
}
