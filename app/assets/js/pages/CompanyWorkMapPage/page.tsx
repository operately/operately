import * as React from "react";

import { useSpaceSearch } from "@/models/spaces";
import { WorkMapPage } from "turboui";
import { Company, hasFeature } from "../../models/companies";
import { useLoadedData } from "./loader";

export function Page() {
  const { data } = useLoadedData();
  const { workMap, company } = data;

  const title = `${company.name} Work Map`;
  const addItemConfig = useAddItemConfig(company);

  return <WorkMapPage title={title} items={workMap} addItemConfig={addItemConfig} />;
}

function useAddItemConfig(company: Company) {
  const spaceSearch = useSpaceSearch();

  const saveNewItem = async (props): Promise<{ id: string }> => {
    console.log("Saving new item:", props);

    // TODO: Placeholder for actual save logic
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ id: "new-item-id" });
      }, 1000);
    });
  };

  return {
    enabled: hasFeature(company, "new-goal-add-page"),
    spaceSearch: spaceSearch,
    save: saveNewItem,
  };
}
