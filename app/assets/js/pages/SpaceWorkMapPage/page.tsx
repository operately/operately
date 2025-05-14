import * as React from "react";

import { Page as PageContainer, WorkMap } from "turboui";
import { useLoadedData } from "./loader";

export function Page() {
  const { workMap, space } = useLoadedData();
  const title = `${space.name} Work Map`;

  return (
    <div className="py-6 px-2">
      <PageContainer title={title} size="fullwidth">
        <WorkMap
          title={title}
          items={workMap}
          tabOptions={{ hideAll: true }}
          columnOptions={{ hideSpace: true }}
        />
      </PageContainer>
    </div>
  );
}
