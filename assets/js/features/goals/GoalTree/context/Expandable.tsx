//
// Provides a context for managing expanded nodes in a tree.
//
// Usage:
// 1. Wrap the tree with <ExpandableProvider tree={tree}>
// 2. Use the `useExpandable` hook to access the context
// 3. Use the `expanded` and `toggleExpanded` properties from the context to manage expanded nodes
// 4. Use the `expandAll` and `collapseAll` properties from the context to expand/collapse all nodes
// 5. Use the `goalExpanded` and `toggleGoalExpanded` properties from the context to manage expanded goal nodes
//

import React from "react";

import { Tree, getAllIds } from "../tree";
import { compareIds, includesId } from "@/routes/paths";
import { useStateWithLocalStorage } from "@/hooks/useStateWithLocalStorage";

type ExpandedNodesMap = Record<string, boolean>;

interface ExpandableContextValue {
  expanded: ExpandedNodesMap;
  toggleExpanded: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  goalExpanded: string[];
  toggleGoalExpanded: (id: string) => void;
}

interface ExpandableProviderProps {
  children: React.ReactNode;
  tree: Tree;
}

const ExpandableContext = React.createContext<ExpandableContextValue | null>(null);

export function ExpandableProvider({ children, tree }: ExpandableProviderProps) {
  const [expanded, setExpanded] = useStateWithLocalStorage<ExpandedNodesMap>(
    "expanded",
    getAllIds(tree).reduce((acc, id) => ({ ...acc, [id]: true }), {}),
  );
  const [goalExpanded, setGoalExpanded] = useStateWithLocalStorage<string[]>("goalExpanded", []);

  const toggleGoalExpanded = (goalId: string) => {
    if (includesId(goalExpanded, goalId)) {
      setGoalExpanded((prev) => prev.filter((id) => !compareIds(goalId, id)));
    } else {
      setGoalExpanded((prev) => [...prev, goalId]);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    setExpanded(getAllIds(tree).reduce((acc, id) => ({ ...acc, [id]: true }), {}));
  };

  const collapseAll = () => {
    setExpanded(getAllIds(tree).reduce((acc, id) => ({ ...acc, [id]: false }), {}));
  };

  const state = {
    expanded,
    toggleExpanded,
    expandAll,
    collapseAll,
    goalExpanded,
    toggleGoalExpanded,
  };

  return <ExpandableContext.Provider value={state}>{children}</ExpandableContext.Provider>;
}

export function useExpandable() {
  const context = React.useContext(ExpandableContext);

  if (!context) {
    throw new Error("useExpandable must be used within an ExpandableProvider");
  }

  return context;
}
