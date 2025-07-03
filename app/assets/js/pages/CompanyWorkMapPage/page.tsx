import * as React from "react";

import { useSpaceSearch } from "@/models/spaces";
import { WorkMap, WorkMapPage } from "turboui";
import { Company, hasFeature } from "../../models/companies";
import { accessLevelAsNumber, useCreateGoal } from "../../models/goals";
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
  const [saveGoal] = useCreateGoal();

  const saveNewGoal: WorkMap.SaveNewItemFn = async (props) => {
    return saveGoal({
      name: props.name,
      spaceId: props.spaceId,
      anonymousAccessLevel: 0,
      companyAccessLevel: accessLevelAsNumber(props.accessLevels.company),
      spaceAccessLevel: accessLevelAsNumber(props.accessLevels.space),
      parentGoalId: props.parentId || null,
    }).then((response) => {
      return { id: response.goal!.id! };
    });
  };

  const saveNewProject: WorkMap.SaveNewItemFn = async () => {
    throw new Error("Project creation is not implemented yet");
  };

  const saveNewItem: WorkMap.SaveNewItemFn = async (props) => {
    if (props.type === "goal") {
      return saveNewGoal(props);
    } else if (props.type === "project") {
      return saveNewProject(props);
    } else {
      throw new Error(`Unknown item type: ${props.type}`);
    }
  };

  return {
    enabled: hasFeature(company, "new-goal-add-page"),
    spaceSearch: spaceSearch,
    save: saveNewItem,
  };
}
