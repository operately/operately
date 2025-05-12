import * as React from "react";

import { Page as PageContainer, WorkMap } from "turboui";
import { useLoadedData } from "./loader";

export function Page() {
  const { workMap } = useLoadedData();
  const title = "Space Work Map";

  return (
    <div className="py-6 px-2">
      <PageContainer title={title} size="fullwidth">
        <WorkMap title={title} items={workMap as WorkMap.Item[]} />
      </PageContainer>
    </div>
  );
}
