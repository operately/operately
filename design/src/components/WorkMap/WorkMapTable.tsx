import React, { useState, useEffect } from "react";
import { TableRow } from "./TableRow.tsx";
import { QuickAddRow } from "./QuickAddRow.tsx";
import { SelectableTableRow } from "./SelectableTableRow.tsx";
import { HoverQuickEntryWidget } from "./HoverQuickEntryWidget.tsx";
import { mockData } from "../../mockData.ts";
import type { WorkMapItem, GoalStatus } from "../../types/workmap";

interface WorkMapTableProps {
  filter?: string;
}

interface CompletedOnInfo {
  display: string;
}

/**
 * Helper function to extract all projects from the data, including nested ones
 * Returns a flat list of all projects
 */
const extractAllProjects = (data: WorkMapItem[]): WorkMapItem[] => {
  let allProjects: WorkMapItem[] = [];

  const extractProjects = (items: WorkMapItem[]): void => {
    items.forEach((item) => {
      // If this item is a project, add it to the list
      if (item.type === "project") {
        allProjects.push({ ...item, children: [] }); // Reset children to make it flat
      }

      // Recursively extract from children
      if (item.children && item.children.length > 0) {
        extractProjects(item.children);
      }
    });
  };

  extractProjects(data);
  return allProjects;
};

/**
 * Helper function to extract all completed items (achieved, partial, missed, dropped)
 * Returns a flat list of all completed items with completedOn dates
 */
const extractCompletedItems = (data: WorkMapItem[]): WorkMapItem[] => {
  let completedItems: WorkMapItem[] = [];

  const extractItems = (items: WorkMapItem[]): void => {
    items.forEach((item) => {
      // If this item is completed, dropped, failed, achieved, partial, or missed, add it to the list
      if (
        item.status === "completed" ||
        item.status === "dropped" ||
        item.status === "failed" || // Legacy status
        item.status === "achieved" ||
        item.status === "partial" ||
        item.status === "missed"
      ) {
        // For completed page, use completedOn date if available, or create a mock one if not
        const enhancedItem = { 
          ...item, 
          children: [], // Reset children to make it flat
          completedOn: item.completedOn || { display: "" } 
        };

        // If completedOn is not present or has no display, add a mock date based on status
        if (!enhancedItem.completedOn || !enhancedItem.completedOn.display) {
          if (
            enhancedItem.status === "completed" ||
            enhancedItem.status === "achieved"
          ) {
            enhancedItem.completedOn = { display: "Feb 28 2025" };
          } else if (enhancedItem.status === "dropped") {
            enhancedItem.completedOn = { display: "Jan 15 2025" };
          } else if (
            enhancedItem.status === "failed" ||
            enhancedItem.status === "missed"
          ) {
            enhancedItem.completedOn = { display: "Mar 5 2025" };
          } else if (enhancedItem.status === "partial") {
            enhancedItem.completedOn = { display: "Mar 10 2025" };
          }
        }

        completedItems.push(enhancedItem);
      }

      // Recursively extract from children
      if (item.children && item.children.length > 0) {
        extractItems(item.children);
      }
    });
  };

  extractItems(data);
  return completedItems;
};

/**
 * Helper function to filter children based on type and status criteria
 * Returns a new WorkMapItem with children filtered according to the filter criteria
 */
const filterChildren = (item: WorkMapItem, filter?: string): WorkMapItem => {
  if (!item.children || item.children.length === 0)
    return { ...item, children: [] };

  const filteredChildren = item.children
    .filter((child) => {
      // Filter by type
      if (filter === "goals" && child.type !== "goal") return false;
      if (filter === "projects" && child.type !== "project") return false;

      // On goals page, exclude all completed goals (all closed statuses)
      if (
        filter === "goals" &&
        child.type === "goal" &&
        (child.status === "completed" ||
          child.status === "failed" ||
          child.status === "dropped" ||
          child.status === "achieved" ||
          child.status === "partial" ||
          child.status === "missed")
      )
        return false;

      return true;
    })
    .map((child) => filterChildren(child, filter));

  return { ...item, children: filteredChildren };
};

/**
 * WorkMapTable component that displays work items in a table format
 * Supports filtering by type (goals, projects) and status (completed)
 */
export default function WorkMapTable({ filter }: WorkMapTableProps): React.ReactElement {
  // Determine if we're on the completed page
  const isCompletedPage = filter === "completed";
  
  // Create a state to store the modified data
  const [workMapData, setWorkMapData] = useState<WorkMapItem[]>(() => mockData);

  // Get the column count based on filter
  const getColumnCount = (): number => {
    if (filter === "completed") return 5; // Name, Status, Completed On, Space, Champion
    return 7; // Name, Status, Progress, Deadline, Space, Champion, Next step
  };

  // Add listeners for add-item and delete-item events
  useEffect(() => {
    // Event handler for adding new items
    const handleAddItem = (event: CustomEvent): void => {
      const { parentItem, newItem } = event.detail as { 
        parentItem: WorkMapItem | null; 
        newItem: WorkMapItem;
      };

      // Create a deep copy of the data
      const newData = JSON.parse(JSON.stringify(workMapData));

      // Helper function to add the item to the correct place in the hierarchy
      const addItemToHierarchy = (items: WorkMapItem[], parentId: string): boolean => {
        for (let i = 0; i < items.length; i++) {
          if (items[i].id === parentId) {
            // Found the parent, add the new item to its children
            if (!items[i].children) {
              items[i].children = [];
            }
            items[i].children.push(newItem);
            return true;
          }

          // Check in children
          if (items[i].children && items[i].children.length > 0) {
            if (addItemToHierarchy(items[i].children, parentId)) {
              return true;
            }
          }
        }
        return false;
      };

      // If there's a parent item, add it to its children
      if (parentItem) {
        addItemToHierarchy(newData, parentItem.id);
      } else {
        // If no parent, add it to the root level
        newData.push(newItem);
      }

      // Update the data
      setWorkMapData(newData);
    };

    // Event handler for deleting items
    const handleDeleteItem = (event: CustomEvent): void => {
      const { itemId } = event.detail as { itemId: string };

      // Create a deep copy of the data
      const newData = JSON.parse(JSON.stringify(workMapData));

      // Helper function to delete the item from the hierarchy
      const deleteItemFromHierarchy = (items: WorkMapItem[]): boolean => {
        // Check if the item is at the root level
        const rootIndex = items.findIndex((item) => item.id === itemId);
        if (rootIndex !== -1) {
          // Found at root level, remove it
          items.splice(rootIndex, 1);
          return true;
        }

        // Check in children of each item
        for (let i = 0; i < items.length; i++) {
          if (items[i].children && items[i].children.length > 0) {
            // Check if item is in this item's children
            const childIndex = items[i].children.findIndex(
              (child) => child.id === itemId
            );
            if (childIndex !== -1) {
              // Found in children, remove it
              items[i].children.splice(childIndex, 1);
              return true;
            }

            // Check deeper in the hierarchy
            if (deleteItemFromHierarchy(items[i].children)) {
              return true;
            }
          }
        }
        return false;
      };

      // Delete the item from the hierarchy
      deleteItemFromHierarchy(newData);

      // Update the data
      setWorkMapData(newData);
    };

    // Add event listeners
    document.addEventListener("workmap:add-item", handleAddItem as EventListener);
    document.addEventListener("workmap:delete-item", handleDeleteItem as EventListener);

    // Clean up on unmount
    return () => {
      document.removeEventListener("workmap:add-item", handleAddItem as EventListener);
      document.removeEventListener("workmap:delete-item", handleDeleteItem as EventListener);
    };
  }, [workMapData]);

  // Parse dates in "Month DD YYYY" format
  const parseDate = (dateStr?: string): Date => {
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

    // Extract components from format like "Mar 10 2025"
    const parts = dateStr.split(" ");
    if (parts.length === 3) {
      const month = months[parts[0]];
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }

    return new Date(0); // Default to oldest date if parsing fails
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full md:min-w-[1000px] table-auto">
        <thead>
          <tr className="border-b-2 border-surface-outline dark:border-gray-600 bg-surface-dimmed dark:bg-gray-800/80 text-content-base dark:text-gray-200 text-sm sticky top-0">
            {/* Name column - more space on mobile for completed page */}
            <th
              className={`text-left py-2 md:py-3.5 px-2 md:px-4 font-semibold ${
                isCompletedPage ? "w-[60%] md:w-[50%]" : ""
              }`}
            >
              Name
            </th>
            {/* Status column */}
            <th
              className={`text-left py-2 md:py-3.5 px-2 md:px-4 font-semibold ${
                isCompletedPage
                  ? "w-[110px] md:w-[130px]"
                  : "w-[100px] md:w-[130px]"
              }`}
            >
              Status
            </th>
            {/* Progress column - not shown on completed page */}
            {filter !== "completed" && (
              <th className="text-left py-2 md:py-3.5 px-2 md:px-4 font-semibold w-[75px] md:w-[90px]">
                Progress
              </th>
            )}
            {/* Deadline/Completed On column */}
            <th
              className={`text-left py-2 md:py-3.5 px-2 md:px-4 font-semibold ${
                isCompletedPage
                  ? "w-[100px] md:w-[120px]"
                  : "hidden md:table-cell w-[120px]"
              }`}
            >
              {isCompletedPage ? "Completed On" : "Deadline"}
            </th>
            {/* Space column */}
            <th className="text-left py-2 md:py-3.5 px-2 md:px-4 font-semibold hidden lg:table-cell w-[100px]">
              Space
            </th>
            {/* Champion column */}
            <th className="text-left py-2 md:py-3.5 px-2 md:px-4 font-semibold hidden xl:table-cell w-[120px]">
              Champion
            </th>
            {/* Next step column - only shown on non-completed pages */}
            {filter !== "completed" && (
              <th className="text-left py-2 md:py-3.5 px-2 md:px-4 font-semibold xl:w-[200px] 2xl:w-[300px] hidden xl:table-cell">
                Next step
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {workMapData
            // Special case for projects and completed pages - show flat lists
            .flatMap((item) => {
              // For projects page, extract all projects from the hierarchy and make a flat list
              if (filter === "projects") {
                const allProjects = extractAllProjects([item]);
                // Exclude completed and dropped projects
                return allProjects.filter(
                  (project) =>
                    project.status !== "completed" &&
                    project.status !== "dropped"
                );
              }

              // For completed page, extract all completed/dropped/failed/achieved/partial/missed items in a flat list
              if (filter === "completed") {
                // Sort by completedOn date, most recent first
                const completedItems = extractCompletedItems([item]);

                return completedItems.sort((a, b) => {
                  // Type assertion to add completedOn property
                  const itemA = a as WorkMapItem & { completedOn?: CompletedOnInfo };
                  const itemB = b as WorkMapItem & { completedOn?: CompletedOnInfo };
                  
                  const dateA = parseDate(itemA.completedOn?.display);
                  const dateB = parseDate(itemB.completedOn?.display);
                  return dateB.getTime() - dateA.getTime(); // Most recent first
                });
              }

              // For other views, use the normal filtering
              return [
                // First filter the top-level items
                ...(() => {
                  if (!filter) return [item];

                  if (filter === "goals") {
                    // For goals page, exclude all completed goals (all closed statuses)
                    return item.type === "goal" &&
                      item.status !== "completed" &&
                      item.status !== "failed" &&
                      item.status !== "dropped" &&
                      item.status !== "achieved" &&
                      item.status !== "partial" &&
                      item.status !== "missed"
                      ? [item]
                      : [];
                  }

                  return [item];
                })(),
              ];
            })
            // Then filter children appropriately (only for the goals view)
            .map((item) =>
              filter === "goals" ? filterChildren(item, filter) : item
            )
            .map((item, index, filteredItems) => {
              // Use the table row directly
              return (
                <TableRow
                  key={item.id}
                  item={item}
                  level={0}
                  isLast={index === filteredItems.length - 1}
                  filter={filter}
                  isSelected={false}
                  onRowClick={undefined}
                  selectedItemId={undefined}
                />
              );
            })}

          {/* Permanent quick add row at the bottom of the table, not shown on completed page */}
          {filter !== "completed" && (
            <QuickAddRow columnCount={getColumnCount()} filter={filter} />
          )}
        </tbody>
      </table>
    </div>
  );
}
