import * as React from "react";

import { WorkMapPage } from "turboui";
import { useLoadedData } from "./loader";

export function Page() {
  const { data } = useLoadedData();
  const { workMap, space } = data;
  const title = `${space.name} Work Map`;

  return (
    <WorkMapPage
      title={title}
      items={workMap}
      columnOptions={{ hideSpace: true }}
      navigation={[{ to: DeprecatedPaths.spacePath(space.id), label: space.name }]}
    />
  );
}
