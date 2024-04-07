//
// Provides a context for managing expanded nodes in a tree.
//
// Usage:
// 1. Wrap the tree with <ExpandableProvider tree={tree}>
// 2. Use the `useExpandable` hook to access the context
// 3. Use the `expanded` and `toggleExpanded` properties from the context to manage expanded nodes
// 4. Use the `expandAll` and `collapseAll` properties from the context to expand/collapse all nodes
//

import React from "react";
import { Tree } from "../tree";

type ExpandedNodesMap = Record<string, boolean>;

interface ExpandableContextValue {
  expanded: ExpandedNodesMap;
  toggleExpanded: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
}

interface ExpandableProviderProps {
  children: React.ReactNode;
  tree: Tree;
}

const ExpandableContext = React.createContext<ExpandableContextValue | null>(null);

export function ExpandableProvider({ children, tree }: ExpandableProviderProps) {
  const [expanded, setExpanded] = React.useState<ExpandedNodesMap>({});

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    setExpanded(tree.getAllNodes().reduce((acc, node) => ({ ...acc, [node.id]: true }), {}));
  };

  const collapseAll = () => {
    setExpanded({});
  };

  const state = {
    expanded,
    toggleExpanded,
    expandAll,
    collapseAll,
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
