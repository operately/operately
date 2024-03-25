import * as React from "react";
import * as Goals from "@/models/goals";

import { Tree, SortColumn, SortDirection } from "./tree";

export type ExpandedNodesMap = Record<string, boolean>;

export interface TreeContextValue {
  tree: Tree;

  expanded: ExpandedNodesMap;
  toggleExpanded: (id: string) => void;

  sortColumn: SortColumn;
  sortDirection: SortDirection;
  setSortColumn: (column: SortColumn) => void;
  setSortDirection: (direction: SortDirection) => void;
}

const TreeContext = React.createContext<TreeContextValue | null>(null);

export function TreeContextProvider({ goals, children }: { goals: Goals.Goal[]; children: React.ReactNode }) {
  const [sortColumn, setSortColumn] = React.useState<SortColumn>("name");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("asc");

  const tree = React.useMemo(() => Tree.build(goals, sortColumn, sortDirection), [goals, sortColumn, sortDirection]);
  const { expanded, toggleExpanded } = useExpandedNodesState(tree);

  const value = { tree, expanded, toggleExpanded, sortColumn, setSortColumn, setSortDirection, sortDirection };

  return <TreeContext.Provider value={value}>{children}</TreeContext.Provider>;
}

export function useTreeContext() {
  const context = React.useContext(TreeContext);
  if (!context) {
    throw new Error("useTreeContext must be used within a TreeProvider");
  }
  return context;
}

export function useExpandedNodesState(tree: Tree) {
  const [expanded, setExpanded] = React.useState<ExpandedNodesMap>(() => {
    var res = {};
    tree
      .getRoots()
      .map((root) => root.id)
      .forEach((id) => (res[id] = true));
    return res;
  });

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return {
    expanded,
    toggleExpanded,
  };
}
