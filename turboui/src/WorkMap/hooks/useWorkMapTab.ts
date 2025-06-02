import React, { useMemo } from "react";
import { IconLayoutGrid, IconTarget, IconChecklist, IconCircleCheck, IconCalendarPause } from "@tabler/icons-react";

import * as sort from "../utils/sort";
import { processItems, processPersonalItems } from "../utils/itemProcessor";
import { useTabs } from "../../Tabs";
import { WorkMap } from "../components";

export interface WorkMapFilterOptions {
  tabOptions?: WorkMap.TabOptions;
}

interface Params {
  rawItems: WorkMap.Item[];
  type: WorkMap.WorkMapType;
  opts: WorkMapFilterOptions;
}

export function useWorkMapTab({ rawItems, type, opts = {} }: Params) {
  const allFilteredItems = useMemo(() => {
    const processedData = type === "personal" ? processPersonalItems(rawItems) : processItems(rawItems);

    return {
      all: sort.sortItemsByDuration(processedData.ongoingItems),
      goals: sort.sortItemsByDuration(processedData.goals),
      projects: sort.sortItemsByDueDate(processedData.projects),
      completed: sort.sortItemsByClosedDate(processedData.completedItems),
      paused: sort.sortItemsByDueDate(processedData.pausedItems),
    };
  }, [rawItems]);

  const tabOptions = type === "personal" ? {...opts.tabOptions, hidePaused: true} : opts.tabOptions;

  const allowedTabs = getAllowedTabs(tabOptions);
  const defaultTab = getDefaultTab(allowedTabs, tabOptions);

  const tabsAvailable = getTabOptions(tabOptions, allFilteredItems);
  const tabsState = useTabs(defaultTab, tabsAvailable);
  const tab = tabsState.active as WorkMap.Filter;

  const filteredItems = allFilteredItems[tab];

  return {
    filteredItems,
    tabsState,
    tab,
  };
}

/**
 * Converts WorkMap tab options to the format expected by the Tabs component
 */
function getTabOptions(tabOptions?: WorkMap.TabOptions, filteredItems?: Record<WorkMap.Filter, WorkMap.Item[]>) {
  const allowedTabs = getAllowedTabs(tabOptions);

  return [
    {
      id: "all",
      label: "All work",
      icon: React.createElement(IconLayoutGrid, { size: 16 }),
      count: countAllItems(filteredItems?.all),
    },
    {
      id: "goals",
      label: "Goals",
      icon: React.createElement(IconTarget, { size: 16 }),
      count: countAllItems(filteredItems?.goals),
    },
    {
      id: "projects",
      label: "Projects",
      icon: React.createElement(IconChecklist, { size: 16 }),
      count: countAllItems(filteredItems?.projects),
    },
    {
      id: "paused",
      label: "Paused",
      icon: React.createElement(IconCalendarPause, { size: 16 }),
      count: countAllItems(filteredItems?.paused),
    },
    {
      id: "completed",
      label: "Completed",
      icon: React.createElement(IconCircleCheck, { size: 16 }),
      count: countAllItems(filteredItems?.completed),
    },
  ].filter((tab) => allowedTabs.includes(tab.id as WorkMap.Filter));
}

function countAllItems(items: WorkMap.Item[] | undefined): number {
  if (!items || items.length === 0) return 0;

  return items.reduce((total, item) => {
    // Count this item
    let count = 1;

    // Add all its children recursively
    if (item.children && item.children.length > 0) {
      count += countAllItems(item.children);
    }

    return total + count;
  }, 0);
}

function getAllowedTabs(tabOptions?: WorkMap.TabOptions): WorkMap.Filter[] {
  let allowedTabs: WorkMap.Filter[] = ["all", "goals", "projects", "completed", "paused"];

  if (tabOptions?.hideAll) {
    allowedTabs = allowedTabs.filter((tab) => tab !== "all");
  }

  if (tabOptions?.hideGoals) {
    allowedTabs = allowedTabs.filter((tab) => tab !== "goals");
  }

  if (tabOptions?.hideProjects) {
    allowedTabs = allowedTabs.filter((tab) => tab !== "projects");
  }

  if (tabOptions?.hideCompleted) {
    allowedTabs = allowedTabs.filter((tab) => tab !== "completed");
  }

  if (tabOptions?.hidePaused) {
    allowedTabs = allowedTabs.filter((tab) => tab !== "paused");
  }

  return allowedTabs;
}

function getDefaultTab(allowedTabs: WorkMap.Filter[], tabOptions?: WorkMap.TabOptions): WorkMap.Filter {
  if ((tabOptions?.hideAll || !allowedTabs.includes("all")) && allowedTabs.length > 0) {
    return allowedTabs[0] || "all";
  }
  return "all";
}
