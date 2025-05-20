import * as React from "react";

import { WorkMapPage } from "turboui";
import { useLoadedData } from "./loader";

export function Page() {
  const {workMap} = useLoadedData()
  const title = "Company Work Map";

  return <WorkMapPage title={title} items={workMap} />;
}
