import Api, {
  type Space,
  type WorkMapItem,
  type WorkMapsGetSettingsResult,
  type WorkMapsGetSettingsInput,
} from "@/api";
import { queryClient, useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { loadCompanyWorkMap, loadSpaceWorkMap } from "@/models/workMap/loadHierarchy";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectUtils";
import { assertPresent } from "@/utils/assertions";
import { legacyWorkMapPath } from "./routing";

interface LoadedData {
  workMap: WorkMapItem[];
  space: Space | undefined;
  settings: WorkMapsGetSettingsResult;
  settingsInput: WorkMapsGetSettingsInput;
}

export async function loader({ params, request }: { params: { id?: string }; request: Request }) {
  await redirectIfFeatureNotEnabled(request, { feature: "work_map_v2", path: legacyWorkMapPath(request) });
  return preload({ params });
}

export async function preload({ params }: { params: { id?: string } }) {
  const settingsInput = params.id ? { spaceId: params.id } : {};
  const [inputs] = await Promise.all([
    params.id ? loadSpaceWorkMap(params.id, true) : loadCompanyWorkMap(),
    queryClient.fetchQuery(Api.work_maps.getSettingsQueryOptions(settingsInput)),
  ]);
  return { ...inputs, settingsInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): LoadedData | null {
  const { workMapInput, spaceInput, settingsInput } = Pages.useLoadedData<LoaderResult>();
  const workMapQuery = useLoadedQuery(Api.companies.getWorkMapQueryOptions(workMapInput));
  const settingsQuery = useLoadedQuery(Api.work_maps.getSettingsQueryOptions(settingsInput));
  const spaceQuery = useLoadedQuery({
    ...Api.spaces.getQueryOptions(spaceInput ?? { id: "" }),
    enabled: spaceInput !== null,
  });

  if (settingsQuery.isPending || workMapQuery.isPending || (spaceInput && spaceQuery.isPending)) return null;

  const workMapData = workMapQuery.data;
  const spaceData = spaceQuery.data;
  assertPresent(workMapData, "Work Map data is unavailable");
  if (spaceInput) assertPresent(spaceData?.space, `Work Map space is unavailable for space "${spaceInput.id}"`);

  assertPresent(settingsQuery.data, "Work Map settings unavailable");
  return { settingsInput, settings: settingsQuery.data, workMap: workMapData.workMap, space: spaceData?.space };
}
