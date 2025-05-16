import * as React from "react";

import { WorkMapPage } from "turboui";
import { useLoadedData } from "./loader";

export function Page() {
  const { workMap, space } = useLoadedData();
  const title = `${space.name} Work Map`;

  return (
    <WorkMapPage title={title} items={workMap} columnOptions={{ hideSpace: true }} />
  );
}
