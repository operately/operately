import * as React from "react";
import { ShouldRevalidateFunction } from "react-router-dom";

import * as Pages from "@/components/Pages";
import { WorkMapItem, getWorkMap } from "@/models/workMap";
import { Paths } from "@/routes/paths";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectIfFeatureEnabled";

import { Page as PageContainer, WorkMap } from "turboui";

interface LoaderResult {
  workMap: WorkMapItem[];
}

/**
 * Prevents the loader from rerunning when only the search parameters change.
 * This ensures that when users change tabs via URL parameters, we don't reload the data.
 */
export const shouldRevalidate: ShouldRevalidateFunction = ({ currentUrl, nextUrl, defaultShouldRevalidate }) => {
  if (currentUrl.pathname === nextUrl.pathname && currentUrl.search !== nextUrl.search) {
    return false;
  }

  return defaultShouldRevalidate;
};

export async function loader({ params }): Promise<LoaderResult> {
  await redirectIfFeatureNotEnabled(params, {
    feature: "work_map_page",
    path: Paths.homePath(),
  });

  const workMap = await getWorkMap({}).then((data) => data.workMap || []);

  return { workMap };
}

function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function Page() {
  const { workMap } = useLoadedData();
  const title = "Company Work Map";

  return (
    <div className="py-6 px-2">
      <PageContainer title={title} size="fullwidth">
        <WorkMap title={title} items={workMap as WorkMap.Item[]} />
      </PageContainer>
    </div>
  );
}
