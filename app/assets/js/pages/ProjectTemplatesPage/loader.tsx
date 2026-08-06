import Api, { type ProjectTemplate, type Space } from "@/api";
import { Paths } from "@/routes/paths";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectUtils";

export interface LoadedData {
  templates: ProjectTemplate[];
  spaces: Space[];
  editableSpaces: Space[];
  fixedSpace: Space | null;
}

export async function loader({ params }): Promise<LoadedData> {
  await redirectIfFeatureNotEnabled(params, {
    feature: "project_templates",
    path: Paths.companyHomePath(params.companyId),
  });

  const spaceId = params.id ?? null;
  const [templates, spaces, editableSpaces] = await Promise.all([
    Api.project_templates.list({ spaceId, archiveStatus: "active" }).then((result) => result.templates ?? []),
    Api.spaces.list({}).then((result) => result.spaces ?? []),
    Api.spaces.list({ accessLevel: "edit_access" }).then((result) => result.spaces ?? []),
  ]);

  return {
    templates,
    spaces,
    editableSpaces,
    fixedSpace: spaceId ? (spaces.find((space) => space.id === spaceId) ?? null) : null,
  };
}
