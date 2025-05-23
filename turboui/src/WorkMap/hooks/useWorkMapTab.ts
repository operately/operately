import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import * as sort from "../utils/sort";

import { WorkMap } from "../components";
import { isStorybook } from "../../utils/storybook/isStorybook";

export interface WorkMapFilterOptions {
  tabOptions?: WorkMap.TabOptions;
}

export function useWorkMapTab(rawItems: WorkMap.Item[], options: WorkMapFilterOptions = {}) {
  const [tab, setTab] = useWorkMapUrlTab(options.tabOptions);

  const filteredItems = useMemo(() => {
    if (tab === "all") {
      const goals = extractOngoingItems(rawItems);
      return sort.sortItemsByDuration(goals);
    }
    if (tab === "projects") {
      const projects = extractAllProjects(rawItems);
      return sort.sortItemsByDueDate(projects);
    }
    if (tab === "completed") {
      const completedItems = extractCompletedItems(rawItems);
      return sort.sortItemsByClosedDate(completedItems);
    }
    if (tab === "paused") {
      const pausedItems = extractPausedItems(rawItems);
      return sort.sortItemsByDueDate(pausedItems);
    }

    const goals = extractAllGoals(rawItems);
    return sort.sortItemsByDuration(goals);
  }, [rawItems, tab]);

  return {
    filteredItems,
    tab,
    setTab,
  };
}

const CLOSED_STATUSES = ["completed", "dropped", "achieved", "partial", "missed"];

/**
 * Helper to extract all goals while maintaining hierarchy
 */
function extractAllGoals(items: WorkMap.Item[]): WorkMap.Item[] {
  const processItem = (item: WorkMap.Item): WorkMap.Item | null => {
    if (item.type === "project") return null;

    let filteredChildren: WorkMap.Item[] = [];

    if (item.children && item.children.length > 0) {
      filteredChildren = item.children
        .map((child) => processItem(child))
        .filter((child): child is WorkMap.Item => child !== null);
    }

    // Include if item is ongoing or has ongoing children
    const isItemClosed = CLOSED_STATUSES.includes(item.status);

    if (isItemClosed && filteredChildren.length === 0) {
      return null;
    }

    // Include the item with its filtered children
    return { ...item, children: filteredChildren };
  };

  return items.map((item) => processItem(item)).filter((item): item is WorkMap.Item => item !== null);
}

/**
 * Helper to extract all projects from the hierarchy, flattening them
 */
function extractAllProjects(data: WorkMap.Item[]): WorkMap.Item[] {
  let allProjects: WorkMap.Item[] = [];

  const extract = (items: WorkMap.Item[]): void => {
    items.forEach((item) => {
      if (item.type === "project") {
        allProjects.push({ ...item, children: [] });
      }
      if (item.children && item.children.length > 0) {
        extract(item.children);
      }
    });
  };

  extract(data);

  // Filter out closed and paused projects before returning
  return allProjects.filter((project) => !CLOSED_STATUSES.includes(project.status) && project.status !== "paused");
}

/**
 * Helper to extract all completed items (achieved, partial, missed, dropped, etc.)
 * Returns a flat list of all completed items with completedOn dates
 */
function extractCompletedItems(data: WorkMap.Item[]): WorkMap.Item[] {
  let completedItems: WorkMap.Item[] = [];

  const extractItems = (items: WorkMap.Item[]): void => {
    items.forEach((item) => {
      if (CLOSED_STATUSES.includes(item.status)) {
        completedItems.push({ ...item, children: [] });
      }
      if (item.children && item.children.length > 0) {
        extractItems(item.children);
      }
    });
  };

  extractItems(data);
  return completedItems;
}

/**
 * Helper to extract all ongoing items (not completed, achieved, partial, missed, or dropped)
 */
function extractOngoingItems(data: WorkMap.Item[]): WorkMap.Item[] {
  const filterOngoingItems = (item: WorkMap.Item): WorkMap.Item | null => {
    let filteredChildren: WorkMap.Item[] = [];

    if (item.children && item.children.length > 0) {
      filteredChildren = item.children.map(filterOngoingItems).filter((child): child is WorkMap.Item => child !== null);
    }

    const isOngoing = !CLOSED_STATUSES.includes(item.status) && item.status !== "paused";

    // Include if item is ongoing or has ongoing children
    if (!isOngoing && filteredChildren.length === 0) {
      return null;
    }

    return { ...item, children: filteredChildren };
  };

  return data.map(filterOngoingItems).filter((item): item is WorkMap.Item => item !== null);
}

/**
 * Helper function to extract all items with "paused" status
 * Returns a flat list of all paused items without hierarchy
 */
function extractPausedItems(data: WorkMap.Item[]): WorkMap.Item[] {
  const result: WorkMap.Item[] = [];

  const findPausedItems = (items: WorkMap.Item[]) => {
    for (const item of items) {
      if (item.status === "paused") {
        result.push(item);
      }

      if (item.children && item.children.length > 0) {
        findPausedItems(item.children);
      }
    }
  };

  findPausedItems(data);
  return result;
}

/**
 * Reads the filter from URL search params
 * Falls back to Storybook-compatible state in non-browser environments
 */
function useWorkMapUrlTab(tabOptions?: WorkMap.TabOptions) {
  if (isStorybook()) {
    return useLocalFilter(tabOptions);
  }

  const [searchParams, _] = useSearchParams();

  const rawTab = searchParams.get("tab") as WorkMap.Filter;
  const allowedTabs = getAllowedTabs(tabOptions);
  const defaultTab = getDefaultTab(allowedTabs, tabOptions);

  const tab = rawTab && allowedTabs.includes(rawTab) ? rawTab : defaultTab;

  return [tab as WorkMap.Filter, _] as const;
}

/**
 * Hook that maintains the filter state locally without touching URL params
 * (used in Storybook)
 */
function useLocalFilter(tabOptions?: WorkMap.TabOptions): [WorkMap.Filter, (newFilter: WorkMap.Filter) => void] {
  const allowedTabs = getAllowedTabs(tabOptions);
  const defaultTab = getDefaultTab(allowedTabs, tabOptions);

  return useState<WorkMap.Filter>(defaultTab);
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
