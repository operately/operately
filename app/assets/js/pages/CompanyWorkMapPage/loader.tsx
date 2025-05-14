import * as Pages from "@/components/Pages";

import { convertToWorkMapItem, getWorkMap } from "@/models/workMap";
import { Paths } from "@/routes/paths";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectIfFeatureEnabled";

interface LoaderResult {
  workMap: ReturnType<typeof convertToWorkMapItem>[];
}

export async function loader({ params }): Promise<LoaderResult> {
  await redirectIfFeatureNotEnabled(params, {
    feature: "work_map_page",
    path: Paths.homePath(),
  });

  const workMap = await getWorkMap({}).then((data) => data.workMap ? data.workMap.map(convertToWorkMapItem) : []);

  return { workMap };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
