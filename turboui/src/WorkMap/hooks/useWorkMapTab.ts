import { useCallback, useMemo, useState } from "react";
import { parse } from "../../utils/time";
import { TimeframeSelector } from "../../TimeframeSelector";
import { WorkMap } from "../components";
import { useSearchParams } from "react-router-dom";
import { isStorybook } from "../../utils/storybook/isStorybook";

export interface WorkMapFilterOptions {
  tabOptions?: WorkMap.TabOptions;
}

export function useWorkMapTab(
  rawItems: WorkMap.Item[],
  timeframe: TimeframeSelector.Timeframe,
  options: WorkMapFilterOptions = {},
) {
  const [tab, setTab] = useWorkMapUrlTab(options.tabOptions);

  const filteredItems = useMemo(() => {
    const timeframeFilteredItems = filterItemsByTimeframe(rawItems, timeframe);

    if (tab === "all") {
      return extractOngoingItems(timeframeFilteredItems);
    }
    if (tab === "projects") {
      return extractAllProjects(timeframeFilteredItems);
    }
    if (tab === "completed") {
      const completedItems = extractCompletedItems(timeframeFilteredItems);
      return sortItemsByClosedDate(completedItems);
    }

    return extractAllGoals(timeframeFilteredItems);
  }, [rawItems, tab, timeframe]);

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
      filteredChildren = item.children.map((child) => processItem(child)).filter((child) => child !== null);
    }

    // Include if item is ongoing or has ongoing children
    const isItemClosed = CLOSED_STATUSES.includes(item.status);

    if (isItemClosed && filteredChildren.length === 0) {
      return null;
    }

    // Include the item with its filtered children
    return { ...item, children: filteredChildren };
  };

  return items.map((item) => processItem(item)).filter((item) => item !== null);
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

  // Filter out closed projects before returning
  return allProjects.filter((project) => !CLOSED_STATUSES.includes(project.status));
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
      filteredChildren = item.children.map(filterOngoingItems).filter((child) => child !== null);
    }

    const isOngoing = !CLOSED_STATUSES.includes(item.status);

    // Include if item is ongoing or has ongoing children
    if (!isOngoing && filteredChildren.length === 0) {
      return null;
    }

    return { ...item, children: filteredChildren };
  };

  return data.map(filterOngoingItems).filter((item) => item !== null);
}

/**
 * Helper function to sort items by their completedOn date in descending order
 */
function sortItemsByClosedDate(items: WorkMap.Item[]): WorkMap.Item[] {
  return [...items].sort((a, b) => {
    const dateA = parse((a as any).completedOn);
    const dateB = parse((b as any).completedOn);

    if (!dateA && !dateB) return 0;
    if (!dateA) return 1; // If A is null, B comes first
    if (!dateB) return -1; // If B is null, A comes first

    return dateB.getTime() - dateA.getTime();
  });
}

/**
 * Filter items based on their timeframe
 * An item is included if it overlaps with the provided timeframe in any way
 */
function filterItemsByTimeframe(items: WorkMap.Item[], timeframe: TimeframeSelector.Timeframe): WorkMap.Item[] {
  const processItemAndChildren = (item: WorkMap.Item): WorkMap.Item[] => {
    const result: WorkMap.Item[] = [];
    const itemOverlaps = itemOverlapsWithTimeframe(item, timeframe);

    let matchingChildren: WorkMap.Item[] = [];

    if (item.children && item.children.length > 0) {
      item.children.forEach((child) => {
        const childResults = processItemAndChildren(child);
        matchingChildren.push(...childResults);
      });
    }

    // If the item itself overlaps with the timeframe, include it with its matching children
    if (itemOverlaps) {
      result.push({ ...item, children: matchingChildren });
    } else if (matchingChildren.length > 0) {
      // If the item doesn't overlap but has matching children, add those children directly to result
      // This moves the children up one level in the hierarchy
      result.push(...matchingChildren);
    }

    return result;
  };

  const allResults: WorkMap.Item[] = [];

  items.forEach((item) => {
    const results = processItemAndChildren(item);
    allResults.push(...results);
  });

  return allResults;
}

function itemOverlapsWithTimeframe(item: WorkMap.Item, timeframe: TimeframeSelector.Timeframe) {
  const timeframeStart = parse(timeframe.startDate);
  const timeframeEnd = parse(timeframe.endDate);
  const itemStart = parse(item.timeframe?.startDate);
  const itemEnd = parse(item.timeframe?.endDate || item.completedOn);

  // Item doesn't have a start date, we can't determine if it's in the timeframe
  if (!itemStart) {
    return false;
  }

  if (!timeframeStart || !timeframeEnd) {
    return true;
  }

  if (itemEnd) {
    return !(itemEnd < timeframeStart || itemStart > timeframeEnd);
  }

  return itemStart <= timeframeEnd;
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
  let allowedTabs: WorkMap.Filter[] = ["all", "goals", "projects", "completed"];

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

  return allowedTabs;
}

function getDefaultTab(allowedTabs: WorkMap.Filter[], tabOptions?: WorkMap.TabOptions): WorkMap.Filter {
  return (tabOptions?.hideAll || !allowedTabs.includes("all")) && allowedTabs.length > 0 ? allowedTabs[0] : "all";
}
