import Api, { type ProjectTemplate, type Space, type WorkMapItem } from "@/api";
import { loadSpaceWorkMap } from "@/models/workMap/loadHierarchy";
import { redirectIfFeatureEnabled } from "@/routes/redirectUtils";
import { pilotWorkMapPath } from "@/pages/WorkMapV2Page/routing";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { useQuery } from "@tanstack/react-query";
import { assertPresent } from "@/utils/assertions";

export interface ReadyData {
  status: "ready";
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

type LoadedData = { status: "pending" } | ReadyData;

export async function loader({ params, request }: { params: { id: string }; request: Request }) {
  await redirectIfFeatureEnabled(request, { feature: "work_map_v2", path: pilotWorkMapPath(request) });
  return preload({ params });
}

export async function preload({ params }: { params: { id: string } }) {
  const templatesInput = { archiveStatus: "active" as const };
  const editableSpacesInput = { query: "", accessLevel: "edit_access" as const };

  const { workMapInput, spaceInput } = await loadSpaceWorkMap(params.id);

  return { workMapInput, spaceInput, templatesInput, editableSpacesInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): LoadedData {
  const { workMapInput, spaceInput, templatesInput, editableSpacesInput } = Pages.useLoadedData<LoaderResult>();
  const workMapQuery = useLoadedQuery(Api.companies.getWorkMapQueryOptions(workMapInput));
  const spaceQuery = useLoadedQuery(Api.spaces.getQueryOptions(spaceInput));
  const templatesQuery = useQuery({ ...Api.project_templates.listQueryOptions(templatesInput), retry: 2 });
  const editableSpacesQuery = useQuery({ ...Api.spaces.searchQueryOptions(editableSpacesInput), retry: 2 });

  if (workMapQuery.isPending || spaceQuery.isPending) return { status: "pending" };

  const workMapData = workMapQuery.data;
  const spaceData = spaceQuery.data;
  assertPresent(workMapData, `Work Map data is unavailable for space "${spaceInput.id}"`);
  assertPresent(spaceData?.space, `Work Map space is unavailable for space "${spaceInput.id}"`);

  const missingQueries = [
    ...(!templatesQuery.data ? [templatesQuery] : []),
    ...(!editableSpacesQuery.data ? [editableSpacesQuery] : []),
  ];
  const failedQuery = missingQueries.find((query) => !query.isFetching && !query.isPending);
  const error = failedQuery ? (failedQuery.error ?? new Error("Work Map creation data is unavailable")) : null;

  return {
    status: "ready",
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
