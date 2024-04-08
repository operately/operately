//
// Provides a context for sorting a goal tree.
//
// Usage:
// 1. Wrap the tree with <SortableProvider>
// 2. Use the `useSortable` hook to access the sort state
// 3. Use the `so
// 4. Use the `expandAll` and `collapseAll` properties from the context to expand/collapse all nodes
//

import React from "react";

export type SortColumn = "name" | "space" | "timeframe" | "progress" | "lastCheckIn" | "champion";
export type SortDirection = "asc" | "desc";

interface SortableContextValue {
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  setSortColumn: (column: SortColumn) => void;
  setSortDirection: (direction: SortDirection) => void;
}

interface SortableProviderProps {
  children: React.ReactNode;
}

const SortableContext = React.createContext<SortableContextValue | undefined>(undefined);

export function ExpandableProvider({ children }: SortableProviderProps) {
  const [sortColumn, setSortColumn] = React.useState<SortColumn>("progress");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("desc");

  const state = {
    sortColumn,
    setSortColumn,
    setSortDirection,
    sortDirection,
  };

  return <SortableContext.Provider value={state}>{children}</SortableContext.Provider>;
}

export function useExpandable() {
  const context = React.useContext(SortableContext);

  if (!context) {
    throw new Error("useExpandable must be used within an ExpandableProvider");
  }

  return context;
}
