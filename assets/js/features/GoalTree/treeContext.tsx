import * as React from "react";
import * as Goals from "@/models/goals";

import { Tree } from "./tree";

export type ExpandedNodesMap = Record<string, boolean>;

export interface TreeContextValue {
  tree: Tree;
  expanded: ExpandedNodesMap;
  toggleExpanded: (id: string) => void;
}

const TreeContext = React.createContext<TreeContextValue | null>(null);

export function TreeContextProvider({ goals, children }: { goals: Goals.Goal[]; children: React.ReactNode }) {
  const tree = React.useMemo(() => Tree.build(goals), [goals]);
  const { expanded, toggleExpanded } = useExpandedNodesState(tree);
  const value = { tree, expanded, toggleExpanded };
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
      .map((root) => root.goal.id)
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
