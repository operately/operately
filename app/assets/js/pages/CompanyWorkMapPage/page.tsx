import * as React from "react";

import { useSpaceSearch } from "@/models/spaces";
import { WorkMapPage } from "turboui";
import { hasFeature } from "../../models/companies";
import { convertToWorkMapItems, useWorkMapItems } from "../../models/workMap";
import { usePaths } from "../../routes/paths";
import { useLoadedData } from "./loader";

export function Page() {
  const paths = usePaths();
  const { workMap, company } = useLoadedData().data;

  const title = `${company.name} Work Map`;

  const [items, addItem] = useWorkMapItems(workMap);
  const spaceSearch = useSpaceSearch();
  const addingEnabled = hasFeature(company, "new-goal-add-page");

  return (
    <WorkMapPage
      title={title}
      items={convertToWorkMapItems(paths, items)}
      addItem={addItem}
      addingEnabled={addingEnabled}
      spaceSearch={spaceSearch}
      addItemDefaultSpace={{
        id: company.generalSpace!.id,
        name: company.generalSpace!.name,
        link: paths.spacePath(company.generalSpace!.id),
      }}
    />
  );
}
