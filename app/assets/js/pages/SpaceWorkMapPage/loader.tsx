import * as Pages from "@/components/Pages";

import { WorkMapItem, getWorkMap } from "@/models/workMap";
import { Space, getSpace } from "@/models/spaces";
import { Paths } from "@/routes/paths";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectIfFeatureEnabled";

interface LoaderResult {
  workMap: WorkMapItem[];
  space: Space;
}

export async function loader({ params }): Promise<LoaderResult> {
  await redirectIfFeatureNotEnabled(params, {
    feature: "space_work_map",
    path: Paths.spacePath(params.id),
  });

  const [workMap, space] = await Promise.all([
    getWorkMap({ spaceId: params.id }).then((data) => data.workMap || []),
    getSpace({ id: params.id }),
  ]);

  return { workMap, space };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
