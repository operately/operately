import * as React from "react";

import { WorkMapPage } from "turboui";
import { hasFeature } from "../../models/companies";
import { useLoadedData } from "./loader";

export function Page() {
  const { data } = useLoadedData();
  const { workMap, company } = data;
  const title = `${company.name} Work Map`;

  return <WorkMapPage title={title} items={workMap} addingChildrenEnabled={hasFeature(company, "new-goal-add-page")} />;
}
