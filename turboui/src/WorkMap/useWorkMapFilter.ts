import { useState, useCallback, useMemo } from "react";
import { WorkMapFilter, WorkMapItem } from "./types";

/**
 * Main filter hook for WorkMap
 */
export function useWorkMapFilter(rawItems: WorkMapItem[]) {
  const [filter, setFilter] = useState<WorkMapFilter>("all");

  const filteredItems = useMemo(() => {
    if (filter === "all") {
      return rawItems;
    }
    if (filter === "projects") {
      // Flat list of all projects, excluding completed/dropped
      const allProjects = extractAllProjects(rawItems);
      return allProjects.filter(
        (project) =>
          project.status !== "completed" && project.status !== "dropped"
      );
    }
    if (filter === "completed") {
      // Flat, sorted list of completed items
      const completedItems = extractCompletedItems(rawItems);
      return completedItems.sort((a, b) => {
        const dateA = parseDate((a as any).completedOn?.display);
        const dateB = parseDate((b as any).completedOn?.display);
        return dateB.getTime() - dateA.getTime(); // Most recent first
      });
    }
    // For other filters, recursively filter children
    return rawItems.map((item) => filterChildren(item, filter));
  }, [rawItems, filter]);

  const changeFilter = useCallback((newFilter: WorkMapFilter) => {
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
function filterChildren(item: WorkMapItem, filter: WorkMapFilter) {
  if (!item.children || item.children.length === 0)
    return { ...item, children: [] };

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
        [
          "completed",
          "failed",
          "dropped",
          "achieved",
          "partial",
          "missed",
        ].includes(child.status)
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
function extractAllProjects(data: WorkMapItem[]): WorkMapItem[] {
  let allProjects: WorkMapItem[] = [];

  const extract = (items: WorkMapItem[]): void => {
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
function extractCompletedItems(data: WorkMapItem[]): WorkMapItem[] {
  let completedItems: WorkMapItem[] = [];

  const extractItems = (items: WorkMapItem[]): void => {
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
        } as WorkMapItem;

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
function parseDate(dateStr?: string): Date {
  if (!dateStr) return new Date(0);
  const months: Record<string, number> = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };
  const parts = dateStr.split(" ");
  if (parts.length === 3) {
    const month = months[parts[0]];
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  return new Date(0);
}
