//
// Provides a context for managing expanded nodes in a WorkMap.
//
// Usage:
// 1. Wrap the WorkMapTable with <WorkMapExpandableProvider items={items}>
// 2. Use the `useWorkMapExpandable` hook to access the context
// 3. Use the `expanded` and `toggleExpanded` properties from the context to manage expanded nodes
// 4. Use the `expandAll` and `collapseAll` properties from the context to expand/collapse all nodes
//

import React from "react";

import { WorkMap } from "../components";
import { getAllWorkMapIds, WorkMapItem } from "../utils";
import { useStateWithLocalStorage } from "../../hooks/useStateWithLocalStorage";

type ExpandedNodesMap = Record<string, boolean>;

interface WorkMapExpandableContextValue {
  expanded: ExpandedNodesMap;
  toggleExpanded: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
}

interface WorkMapExpandableProviderProps {
  children: React.ReactNode;
  items: WorkMap.Item[];
}

const WorkMapExpandableContext = React.createContext<WorkMapExpandableContextValue | null>(null);

export function WorkMapExpandableProvider({ children, items }: WorkMapExpandableProviderProps) {
  const [expanded, setExpanded] = useStateWithLocalStorage<ExpandedNodesMap>(
    "work-map",
    "expanded",
    getAllWorkMapIds(items as WorkMapItem[]).reduce((acc, id) => ({ ...acc, [id]: true }), {}),
  );

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    setExpanded(getAllWorkMapIds(items as WorkMapItem[]).reduce((acc, id) => ({ ...acc, [id]: true }), {}));
  };

  const collapseAll = () => {
    setExpanded(getAllWorkMapIds(items as WorkMapItem[]).reduce((acc, id) => ({ ...acc, [id]: false }), {}));
  };

  const state = {
    expanded,
    toggleExpanded,
    expandAll,
    collapseAll,
  };

  return <WorkMapExpandableContext.Provider value={state}>{children}</WorkMapExpandableContext.Provider>;
}

export function useWorkMapExpandable() {
  const context = React.useContext(WorkMapExpandableContext);

  if (!context) {
    throw new Error("useWorkMapExpandable must be used within a WorkMapExpandableProvider");
  }

  return context;
}