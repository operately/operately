import Api, { type ProjectTemplate, type Space, type WorkMapItem } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

interface LoadedData {
  data: {
    workMap: WorkMapItem[];
    space: Space;
    templates: ProjectTemplate[];
  };
}

export async function loader({ params }) {
  const workMapInput = { spaceId: params.id };
  const spaceInput = { id: params.id, includeAccessLevels: true, includePermissions: true };
  const templatesInput = { archiveStatus: "active" as const };

  await Promise.all([
    Api.companies.getWorkMapQuery(workMapInput),
    Api.spaces.getQuery(spaceInput),
    Api.project_templates.listQuery(templatesInput),
  ]);

  return { workMapInput, spaceInput, templatesInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): LoadedData {
  const { workMapInput, spaceInput, templatesInput } = Pages.useLoadedData<LoaderResult>();
  const { data: workMapData } = useLoadedQuery(Api.companies.getWorkMapQueryOptions(workMapInput));
  const { data: spaceData } = useLoadedQuery(Api.spaces.getQueryOptions(spaceInput));
  const { data: templatesData } = useLoadedQuery(Api.project_templates.listQueryOptions(templatesInput));

  if (!workMapData || !spaceData?.space || !templatesData) {
    throw new Error(`Work Map data is unavailable for space "${spaceInput.id}"`);
  }

  return {
    data: {
      workMap: workMapData.workMap,
      space: spaceData.space,
      templates: templatesData.templates ?? [],
    },
  };
}
