import { useCallback, useMemo } from "react";
import { parse } from "date-fns";
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
    const dateA = parseDate((a as any).closedAt);
    const dateB = parseDate((b as any).closedAt);
    return dateB.getTime() - dateA.getTime();
  });
}

/**
 * Helper to parse dates in "Month DD YYYY" format
 */
function parseDate(dateString?: string) {
  if (!dateString) return new Date(0);

  const parsed = parse(dateString, "MMM d yyyy", new Date());

  return isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

/**
 * Filter items based on their timeframe or date properties
 * For goals: use timeframe.startDate and timeframe.endDate
 * For projects: use startedAt and closedAt
 * An item is included if it overlaps with the provided timeframe in any way
 */
function filterItemsByTimeframe(items: WorkMap.Item[], timeframe: TimeframeSelector.Timeframe): WorkMap.Item[] {
  // If timeframe has no dates, return all items
  if (!timeframe.startDate && !timeframe.endDate) {
    return items;
  }

  const filterTimeframeRecursive = (item: WorkMap.Item): WorkMap.Item | null => {
    const overlaps = itemOverlapsWithTimeframe(item, timeframe);

    if (!overlaps) {
      return null; // Item doesn't overlap, exclude it
    }

    // For items with children, recursively filter children
    if (item.children && item.children.length > 0) {
      const filteredChildren = item.children
        .map(filterTimeframeRecursive)
        .filter((child): child is WorkMap.Item => child !== null);

      return { ...item, children: filteredChildren };
    }

    // Item overlaps and has no children (or all children filtered out)
    return { ...item };
  };

  return items.map(filterTimeframeRecursive).filter((item): item is WorkMap.Item => item !== null);
}

/**
 * Check if an item overlaps with the provided timeframe
 */
function itemOverlapsWithTimeframe(item: WorkMap.Item, timeframe: TimeframeSelector.Timeframe): boolean {
  const timeframeStart = timeframe.startDate ? new Date(timeframe.startDate) : null;
  const timeframeEnd = timeframe.endDate ? new Date(timeframe.endDate) : null;

  const goalStart = item.timeframe?.startDate ? new Date(item.timeframe.startDate) : null;
  const goalEnd = item.timeframe?.endDate ? new Date(item.timeframe.endDate) : null;

  // If either timeframe is missing dates, include the item
  if (!timeframeStart || !timeframeEnd || !goalStart || !goalEnd) {
    return true;
  }

  // Check for overlap: not (goalEnd < timeframeStart || goalStart > timeframeEnd)
  return !(goalEnd < timeframeStart || goalStart > timeframeEnd);
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
