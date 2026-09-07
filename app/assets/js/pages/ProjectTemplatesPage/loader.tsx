import Api, { type ProjectTemplate, type Space } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
interface LoadedData {
  templates: ProjectTemplate[];
  spaces: Space[];
  fixedSpace: Space | null;
}

export async function loader({ params }) {
  const spaceId = params.id ?? null;
  const templatesInput = { spaceId, archiveStatus: "all" as const };
  const spacesInput = { includePermissions: true };

  await Promise.all([Api.project_templates.listQuery(templatesInput), Api.spaces.listQuery(spacesInput)]);

  return { templatesInput, spacesInput, spaceId };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): LoadedData {
  const { templatesInput, spacesInput, spaceId } = Pages.useLoadedData<LoaderResult>();
  const { data: templatesData } = useLoadedQuery(Api.project_templates.listQueryOptions(templatesInput));
  const { data: spacesData } = useLoadedQuery(Api.spaces.listQueryOptions(spacesInput));

  if (!templatesData?.templates) {
    throw new Error("Project template list is unavailable");
  }

  if (!spacesData?.spaces) {
    throw new Error("Space list is unavailable");
  }

  const spaces = spacesData.spaces;

  return {
    templates: templatesData.templates,
    spaces,
    fixedSpace: spaceId ? (spaces.find((space) => space.id === spaceId) ?? null) : null,
  };
}
