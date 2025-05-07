import { useCallback, useMemo } from "react";
import { parse } from "../../utils/time";
import { TimeframeSelector } from "../../TimeframeSelector";
import { WorkMap } from "../components";
import { useSearchParams } from "react-router-dom";

export function useWorkMapFilter(rawItems: WorkMap.Item[], timeframe: TimeframeSelector.Timeframe) {
  const [filter, setFilter] = useWorkMapUrlFilter();

  const filteredItems = useMemo(() => {
    const timeframeFilteredItems = filterItemsByTimeframe(rawItems, timeframe);

    if (filter === "all") {
      return extractOngoingItems(timeframeFilteredItems);
    }
    if (filter === "projects") {
      return extractAllProjects(timeframeFilteredItems);
    }
    if (filter === "completed") {
      const completedItems = extractCompletedItems(timeframeFilteredItems);
      return sortItemsByClosedDate(completedItems);
    }

    return extractAllGoals(timeframeFilteredItems);
  }, [rawItems, filter, timeframe]);

  return {
    filteredItems,
    filter,
    setFilter,
  };
}

const CLOSED_STATUSES = ["completed", "dropped", "achieved", "partial", "missed"];

/**
 * Helper to extract all goals while maintaining hierarchy
 */
function extractAllGoals(items: WorkMap.Item[]): WorkMap.Item[] {
  const processItem = (item: WorkMap.Item): WorkMap.Item | null => {
    if (item.type === "project") return null;
    if (CLOSED_STATUSES.includes(item.status)) return null;

    // Process children recursively
    let filteredChildren: WorkMap.Item[] = [];

    if (item.children && item.children.length > 0) {
      filteredChildren = item.children.map((child) => processItem(child)).filter((child) => child !== null);
    }

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
        const enhancedItem = {
          ...item,
          children: [],
          completedOn: item.closedAt,
        } as WorkMap.Item;

        completedItems.push(enhancedItem);
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
    const isOngoing = !CLOSED_STATUSES.includes(item.status);

    if (!isOngoing) {
      return null;
    }

    let filteredChildren: WorkMap.Item[] = [];
    if (item.children && item.children.length > 0) {
      filteredChildren = item.children.map(filterOngoingItems).filter((child) => child !== null);
    }

    return { ...item, children: filteredChildren };
  };

  return data.map(filterOngoingItems).filter((item) => item !== null);
}

/**
 * Helper function to sort items by their closedAt date in descending order
 */
function sortItemsByClosedDate(items: WorkMap.Item[]): WorkMap.Item[] {
  return [...items].sort((a, b) => {
    const dateA = parse((a as any).closedAt)!;
    const dateB = parse((b as any).closedAt)!;

    return dateB?.getTime() - dateA?.getTime();
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
  const itemEnd = parse(item.timeframe?.endDate);

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
 * Hook to manage the filter in URL search params
 * Returns the current filter value and a function to update it
 * Defaults to "all" if no tab parameter is present
 */
function useWorkMapUrlFilter(): [WorkMap.Filter, (newFilter: WorkMap.Filter) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawTab = searchParams.get("tab") as WorkMap.Filter;
  const allowedTabs: WorkMap.Filter[] = ["all", "goals", "projects", "completed"];

  const tab = rawTab && allowedTabs.includes(rawTab) ? rawTab : "all";

  const setTab = useCallback(
    (newTab: WorkMap.Filter) => {
      setSearchParams((params) => {
        const newParams = new URLSearchParams(params);
        newParams.set("tab", newTab);
        return newParams;
      });
    },
    [setSearchParams],
  );

  return [tab as WorkMap.Filter, setTab];
}
