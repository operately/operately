import Api, { type ProjectTemplate, type Space } from "@/api";
export interface LoadedData {
  templates: ProjectTemplate[];
  spaces: Space[];
  fixedSpace: Space | null;
}

export async function loader({ params }): Promise<LoadedData> {
  const spaceId = params.id ?? null;
  const [templates, spaces] = await Promise.all([
    Api.project_templates.list({ spaceId, archiveStatus: "all" }).then((result) => result.templates ?? []),
    Api.spaces.list({ includePermissions: true }).then((result) => result.spaces ?? []),
  ]);

  return {
    templates,
    spaces,
    fixedSpace: spaceId ? (spaces.find((space) => space.id === spaceId) ?? null) : null,
  };
}
