import Api, { type Space, type WorkMapItem } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { loadCompanyWorkMap, loadSpaceWorkMap } from "@/models/workMap/loadHierarchy";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectUtils";
import { assertPresent } from "@/utils/assertions";
import { legacyWorkMapPath } from "./routing";

interface LoadedData {
  workMap: WorkMapItem[];
  space: Space | undefined;
}

export async function loader({ params, request }: { params: { id?: string }; request: Request }) {
  await redirectIfFeatureNotEnabled(request, { feature: "work_map_v2", path: legacyWorkMapPath(request) });
  return preload({ params });
}

export async function preload({ params }: { params: { id?: string } }) {
  return params.id ? loadSpaceWorkMap(params.id) : loadCompanyWorkMap();
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): LoadedData {
  const { workMapInput, spaceInput } = Pages.useLoadedData<LoaderResult>();
  const { data: workMapData } = useLoadedQuery(Api.companies.getWorkMapQueryOptions(workMapInput));
  const { data: spaceData } = useLoadedQuery({
    ...Api.spaces.getQueryOptions(spaceInput ?? { id: "" }),
    enabled: spaceInput !== null,
  });

  assertPresent(workMapData, "Work Map data is unavailable");
  if (spaceInput) assertPresent(spaceData?.space, `Work Map space is unavailable for space "${spaceInput.id}"`);

  return { workMap: workMapData.workMap, space: spaceData?.space };
}
