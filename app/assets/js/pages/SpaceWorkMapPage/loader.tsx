import Api, { type ProjectTemplate, type Space, type WorkMapItem } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { useQuery } from "@tanstack/react-query";

interface LoadedData {
  data: {
    workMap: WorkMapItem[];
    space: Space;
    templates: ProjectTemplate[];
    editableSpaces: Space[];
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
  const editableSpacesInput = { query: "", accessLevel: "edit_access" as const };

  await Promise.all([Api.companies.getWorkMapQuery(workMapInput), Api.spaces.getQuery(spaceInput)]);

  return { workMapInput, spaceInput, templatesInput, editableSpacesInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): LoadedData {
  const { workMapInput, spaceInput, templatesInput, editableSpacesInput } = Pages.useLoadedData<LoaderResult>();
  const { data: workMapData } = useLoadedQuery(Api.companies.getWorkMapQueryOptions(workMapInput));
  const { data: spaceData } = useLoadedQuery(Api.spaces.getQueryOptions(spaceInput));
  const templatesQuery = useQuery({ ...Api.project_templates.listQueryOptions(templatesInput), retry: 2 });
  const editableSpacesQuery = useQuery({ ...Api.spaces.searchQueryOptions(editableSpacesInput), retry: 2 });

  if (!workMapData || !spaceData?.space) {
    throw new Error(`Work Map data is unavailable for space "${spaceInput.id}"`);
  }

  const missingQueries = [
    ...(!templatesQuery.data ? [templatesQuery] : []),
    ...(!editableSpacesQuery.data ? [editableSpacesQuery] : []),
  ];
  const failedQuery = missingQueries.find((query) => !query.isFetching && !query.isPending);
  const error = failedQuery ? (failedQuery.error ?? new Error("Work Map creation data is unavailable")) : null;

  return {
    data: {
      workMap: workMapData.workMap,
      space: spaceData.space,
      templates: templatesQuery.data?.templates ?? [],
      editableSpaces: editableSpacesQuery.data?.spaces ?? [],
    },
    creationData: {
      isLoading: missingQueries.length > 0 && !error,
      error,
      retry: async () => {
        await Promise.all(missingQueries.map((query) => query.refetch()));
      },
    },
  };
}
