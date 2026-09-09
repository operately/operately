import Api, { type ProjectTemplate, type Space, type WorkMapItem } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { useQuery } from "@tanstack/react-query";

interface LoadedData {
  data: {
    workMap: WorkMapItem[];
    space: Space;
    templates: ProjectTemplate[];
  };
  creationData: {
    isLoading: boolean;
    error: Error | null;
    retry: () => Promise<void>;
  };
}

export async function loader({ params }) {
  const workMapInput = { spaceId: params.id };
  const spaceInput = { id: params.id, includeAccessLevels: true, includePermissions: true };
  const templatesInput = { archiveStatus: "active" as const };

  await Promise.all([Api.companies.getWorkMapQuery(workMapInput), Api.spaces.getQuery(spaceInput)]);

  return { workMapInput, spaceInput, templatesInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): LoadedData {
  const { workMapInput, spaceInput, templatesInput } = Pages.useLoadedData<LoaderResult>();
  const { data: workMapData } = useLoadedQuery(Api.companies.getWorkMapQueryOptions(workMapInput));
  const { data: spaceData } = useLoadedQuery(Api.spaces.getQueryOptions(spaceInput));
  const templatesQuery = useQuery({ ...Api.project_templates.listQueryOptions(templatesInput), retry: 2 });

  if (!workMapData || !spaceData?.space) {
    throw new Error(`Work Map data is unavailable for space "${spaceInput.id}"`);
  }

  const templatesMissing = !templatesQuery.data;
  const templatesFailed = templatesMissing && !templatesQuery.isFetching && !templatesQuery.isPending;
  const error = templatesFailed ? (templatesQuery.error ?? new Error("Work Map creation data is unavailable")) : null;

  return {
    data: {
      workMap: workMapData.workMap,
      space: spaceData.space,
      templates: templatesQuery.data?.templates ?? [],
    },
    creationData: {
      isLoading: templatesMissing && !error,
      error,
      retry: async () => {
        await templatesQuery.refetch();
      },
    },
  };
}
