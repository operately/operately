import * as React from "react";

import { PageCache } from "@/routes/PageCache";
import { WorkMapPage } from "turboui";
import { loader } from "./loader";

export function Page() {
  const { workMap } = PageCache.useData(loader);
  const title = "Company Work Map";

  return <WorkMapPage title={title} items={workMap} />;
}
