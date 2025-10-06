import * as React from "react";

import * as Spaces from "@/models/spaces";
import { useSpaceSearch } from "@/models/spaces";
import { WorkMapPage } from "turboui";
import { convertToWorkMapItems, useWorkMapItems } from "../../models/workMap";
import { usePaths } from "../../routes/paths";
import { useLoadedData } from "./loader";

export function Page() {
  const paths = usePaths();
  const { workMap, company } = useLoadedData().data;

  const title = `${company.name} Work Map`;

  const [items, addItem] = useWorkMapItems(workMap);
  const spaceSearch = useSpaceSearch();

  return (
    <WorkMapPage
      title={title}
      items={convertToWorkMapItems(paths, items)}
      addItem={addItem}
      spaceSearch={spaceSearch}
      addingEnabled={true}
      addItemDefaultSpace={company.generalSpace && Spaces.parseSpaceForTurboUI(paths, company.generalSpace)}
    />
  );
}
