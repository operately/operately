import * as React from "react";

import * as Pages from "@/components/Pages";
import { WorkMapItem, getWorkMap } from "@/models/workMap";
import { Paths } from "@/routes/paths";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectIfFeatureEnabled";

import { Page as PageContainer, WorkMap } from "turboui";

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

export function Page() {
  const { workMap } = useLoadedData();
  const title = "Company Work Map";

  return (
    <div className="py-6">
      <PageContainer title={title} size="fullwidth">
        <WorkMap title={title} items={workMap as WorkMap.Item[]} addItem={() => {}} deleteItem={() => {}} />
      </PageContainer>
    </div>
  );
}
