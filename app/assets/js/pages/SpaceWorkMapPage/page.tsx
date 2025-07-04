import * as React from "react";

import { WorkMapPage } from "turboui";
import { useLoadedData } from "./loader";

import { usePaths } from "@/routes/paths";
import { hasFeature } from "../../models/companies";
import { useSpaceSearch } from "../../models/spaces";
import { convertToWorkMapItems, useWorkMapItems } from "../../models/workMap";

export function Page() {
  const paths = usePaths();

  const { workMap, company, space } = useLoadedData().data;
  const title = `${space.name} Work Map`;

  const [items, addItem] = useWorkMapItems(workMap);
  const spaceSearch = useSpaceSearch();

  return (
    <WorkMapPage
      title={title}
      items={convertToWorkMapItems(paths, items)}
      addItem={addItem}
      addingEnabled={hasFeature(company, "new-goal-add-page")}
      spaceSearch={spaceSearch}
      columnOptions={{ hideSpace: true }}
      navigation={[{ to: paths.spacePath(space.id), label: space.name }]}
    />
  );
}
