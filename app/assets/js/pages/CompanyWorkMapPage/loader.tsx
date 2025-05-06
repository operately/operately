import * as Pages from "@/components/Pages";

import { WorkMapItem, getWorkMap } from "@/models/workMap";
import { Paths } from "@/routes/paths";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectIfFeatureEnabled";

interface LoaderResult {
  workMap: WorkMapItem[];
}

export async function loader({ params }): Promise<LoaderResult> {
  await redirectIfFeatureNotEnabled(params, {
    feature: "work_map_page",
    path: Paths.homePath(),
  });

  const workMap = await getWorkMap({}).then((data) => data.workMap || []);

  return { workMap };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
