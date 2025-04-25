import { useState, useCallback, useMemo } from "react";
import { parse } from "date-fns";
import { TimeframeSelector } from "../TimeframeSelector";
import { WorkMap } from ".";

/**
 * Main filter hook for WorkMap
 */
export function useWorkMapFilter(rawItems: WorkMap.Item[], timeframe: TimeframeSelector.Timeframe) {
  const [filter, setFilter] = useState<WorkMap.Filter>("all");

  const filteredItems = useMemo(() => {
    const timeframeFilteredItems = filterItemsByTimeframe(rawItems, timeframe);

    if (filter === "all") {
      return timeframeFilteredItems;
    }
    if (filter === "projects") {
      const allProjects = extractAllProjects(timeframeFilteredItems);

      return allProjects.filter((project) => project.status !== "completed" && project.status !== "dropped");
    }
    if (filter === "completed") {
      const completedItems = extractCompletedItems(timeframeFilteredItems);

      return completedItems.sort((a, b) => {
        const dateA = parseDate((a as any).closedAt);
        const dateB = parseDate((b as any).closedAt);
        return dateB.getTime() - dateA.getTime();
      });
    }

    return timeframeFilteredItems.map((item) => filterChildren(item, filter));
  }, [rawItems, filter, timeframe]);

  const changeFilter = useCallback((newFilter: WorkMap.Filter) => {
    setFilter(newFilter);
  }, []);

  return {
    filteredItems,
    filter,
    setFilter: changeFilter,
  };
}

/**
 * Returns a new WorkMapItem with children filtered according to the filter criteria
 */
function filterChildren(item: WorkMap.Item, filter: WorkMap.Filter) {
  if (!item.children || item.children.length === 0) return { ...item, children: [] };

  const filteredChildren = item.children
    .filter((child) => {
      const isGoal = child.type === "goal";
      const isProject = child.type === "project";

      if (filter === "goals" && !isGoal) return false;
      if (filter === "projects" && !isProject) return false;

      // On goals page, exclude all completed goals (all closed statuses)
      if (
        filter === "goals" &&
        isGoal &&
        ["completed", "failed", "dropped", "achieved", "partial", "missed"].includes(child.status)
      ) {
        return false;
      }
      return true;
    })
    .map((child) => filterChildren(child, filter));

  return { ...item, children: filteredChildren };
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
  return allProjects;
}

/**
 * Helper to extract all completed items (achieved, partial, missed, dropped, etc.)
 * Returns a flat list of all completed items with completedOn dates
 */
function extractCompletedItems(data: WorkMap.Item[]): WorkMap.Item[] {
  let completedItems: WorkMap.Item[] = [];

  const extractItems = (items: WorkMap.Item[]): void => {
    items.forEach((item) => {
      if (
        item.status === "completed" ||
        item.status === "dropped" ||
        item.status === "achieved" ||
        item.status === "partial" ||
        item.status === "missed"
      ) {
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
