import * as Pages from "@/components/Pages";

import { WorkMapItem, getWorkMap } from "@/models/workMap";
import { Paths } from "@/routes/paths";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectIfFeatureEnabled";

interface LoaderResult {
  workMap: WorkMapItem[];
}

export async function loader({ params }): Promise<LoaderResult> {
  await redirectIfFeatureNotEnabled(params, {
    feature: "space_work_map",
    path: Paths.spacePath(params.id),
  });

  const workMap = await getWorkMap({ spaceId: params.id }).then((data) => data.workMap || []);

  return { workMap };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
