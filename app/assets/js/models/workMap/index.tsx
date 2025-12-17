import { WorkMapItem, getFlatWorkMap, getWorkMap, useCreateGoal, useCreateProject } from "@/api";
import { Paths, usePaths } from "@/routes/paths";
import React from "react";
import { WorkMap } from "turboui";
import { accessLevelAsNumber } from "../goals";
import { parseContextualDate } from "../contextualDates";

/**
 * Converts an API WorkMapItem to the TurboUI WorkMap.Item type
 * This handles type differences including nullable fields and ensures
 * the structure matches exactly what the TurboUI component expects
 */

export function convertToWorkMapItems(paths: Paths, items: WorkMapItem[]): WorkMap.Item[] {
  return items.map((item) => convertToWorkMapItem(paths, item));
}

function convertToWorkMapItem(paths: Paths, item: WorkMapItem): WorkMap.Item {
  return {
    ...item,
    space: {
      id: item.space.id,
      name: item.space.name,
      link: paths.spacePath(item.space.id),
    },
    timeframe: convertTimeframe(item.timeframe),
    children: item.children.map((c) => convertToWorkMapItem(paths, c)),
  };
}

const convertTimeframe = (timeframe: WorkMapItem["timeframe"]) => {
  if (!timeframe) return null;

  return {
    startDate: parseContextualDate(timeframe.contextualStartDate),
    endDate: parseContextualDate(timeframe.contextualEndDate),
  };
};

export { getFlatWorkMap, getWorkMap };
export type { WorkMapItem };

export function useWorkMapItems(initialItems: WorkMapItem[] = []): [WorkMapItem[], WorkMap.AddNewItemFn] {
  const paths = usePaths();

  const [items, setItems] = React.useState<WorkMapItem[]>(initialItems);
  const inject = useItemInjector(setItems);

  const [saveGoal] = useCreateGoal();
  const [saveProject] = useCreateProject();

  // If props change, update the items state
  React.useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const addNewGoal: WorkMap.AddNewItemFn = async (props) => {
    const res = await saveGoal({
      name: props.name,
      spaceId: props.space.id,
      anonymousAccessLevel: 0,
      companyAccessLevel: accessLevelAsNumber(props.accessLevels.company),
      spaceAccessLevel: accessLevelAsNumber(props.accessLevels.space),
      parentGoalId: props.parentId || null,
    });

    const item: WorkMapItem = {
      id: res.goal!.id!,
      type: "goal",
      name: props.name,
      space: props.space,
      spacePath: props.space.link,
      project: null,
      projectPath: null,
      parentId: props.parentId || null,
      state: "active",
      status: "pending",
      progress: 0,
      owner: null,
      ownerPath: null,
      reviewer: null,
      reviewerPath: null,
      nextStep: "",
      timeframe: null,
      children: [],
      isNew: true,
      completedOn: null,
      itemPath: paths.goalPath(res.goal!.id!),
      privacy: calcPrivacyLevel(
        accessLevelAsNumber(props.accessLevels.company),
        accessLevelAsNumber(props.accessLevels.space),
      ),
    };

    inject(item);

    return { id: res.goal!.id! };
  };

  const addNewProject: WorkMap.AddNewItemFn = async (props) => {
    const res = await saveProject({
      name: props.name,
      spaceId: props.space.id,
      goalId: props.parentId || null,
      anonymousAccessLevel: 0,
      companyAccessLevel: accessLevelAsNumber(props.accessLevels.company),
      spaceAccessLevel: accessLevelAsNumber(props.accessLevels.space),
    });

    const item: WorkMapItem = {
      id: res.project!.id!,
      type: "project",
      name: props.name,
      space: props.space,
      spacePath: props.space.link,
      project: null,
      projectPath: null,
      parentId: props.parentId || null,
      state: "active",
      status: "pending",
      progress: 0,
      owner: null,
      ownerPath: null,
      reviewer: null,
      reviewerPath: null,
      nextStep: "",
      timeframe: null,
      children: [],
      isNew: true,
      completedOn: null,
      itemPath: paths.projectPath(res.project!.id!),
      privacy: calcPrivacyLevel(
        accessLevelAsNumber(props.accessLevels.company),
        accessLevelAsNumber(props.accessLevels.space),
      ),
    };

    inject(item);

    return { id: res.project!.id! };
  };

  const addItem: WorkMap.AddNewItemFn = async (props) => {
    if (props.type === "goal") {
      return addNewGoal(props);
    } else if (props.type === "project") {
      return addNewProject(props);
    } else {
      throw new Error(`Unknown item type: ${props.type}`);
    }
  };

  return [items, addItem] as const;
}

function calcPrivacyLevel(companyAccessLevel: number, spaceAccessLevel: number): WorkMap.Item["privacy"] {
  if (companyAccessLevel === 0 && spaceAccessLevel === 0) {
    return "secret";
  }

  if (companyAccessLevel === 0 && spaceAccessLevel > 0) {
    return "confidential";
  }

  if (companyAccessLevel > 0 && spaceAccessLevel > 0) {
    return "internal";
  }

  throw new Error("Invalid access levels for privacy calculation");
}

// A utility function to inject a new item into the work map.
//
// It recursively finds the parent item by `parentId` and adds the new item to its `children` array.
// If no `parentId` is provided, it adds the item as a root item.
//
function useItemInjector(setItems: React.Dispatch<React.SetStateAction<WorkMapItem[]>>) {
  return (item: WorkMapItem) => {
    setItems((prevItems) => {
      // Helper to recursively add the item to the correct parent
      function addToParent(items: WorkMapItem[]): WorkMapItem[] {
        return items.map((i) => {
          if (i.id === item.parentId) {
            return {
              ...i,
              children: [...i.children, item],
            };
          }
          return {
            ...i,
            children: addToParent(i.children),
          };
        });
      }

      // If no parentId, add as root item
      if (!item.parentId) {
        return [...prevItems, item];
      }

      return addToParent(prevItems);
    });
  };
}
