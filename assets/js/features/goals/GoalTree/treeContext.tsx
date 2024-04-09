import * as React from "react";
import * as Goals from "@/models/goals";
import * as Projects from "@/models/projects";

import { Tree, SortColumn, SortDirection, TreeFilters } from "./tree";
import { ExpandableProvider } from "./context/Expandable";

export interface TreeContextValue {
  tree: Tree;

  sortColumn: SortColumn;
  sortDirection: SortDirection;
  setSortColumn: (column: SortColumn) => void;
  setSortDirection: (direction: SortDirection) => void;

  hideSpaceColumn?: boolean;

  showCompleted: boolean;
  setShowCompleted: (show: boolean) => void;
}

const TreeContext = React.createContext<TreeContextValue | null>(null);

export interface TreeContextProviderProps {
  goals: Goals.Goal[];
  projects: Projects.Project[];

  filters?: TreeFilters;
  hideSpaceColumn?: boolean;
}

interface TreeContextProviderPropsWithChildren extends TreeContextProviderProps {
  children: React.ReactNode;
}

export function TreeContextProvider(props: TreeContextProviderPropsWithChildren) {
  const [sortColumn, setSortColumn] = React.useState<SortColumn>("progress");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("desc");
  const [showCompleted, setShowCompleted] = React.useState<boolean>(false);

  const tree = React.useMemo(
    () => new Tree(props.goals, props.projects, sortColumn, sortDirection, props.filters || {}, showCompleted),
    [props.goals, props.projects, sortColumn, sortDirection, props.filters, showCompleted],
  );

  const value = {
    tree,
    sortColumn,
    setSortColumn,
    setSortDirection,
    sortDirection,
    hideSpaceColumn: props.hideSpaceColumn,
    showCompleted,
    setShowCompleted,
  };

  return (
    <TreeContext.Provider value={value}>
      <ExpandableProvider tree={tree}>{props.children}</ExpandableProvider>
    </TreeContext.Provider>
  );
}

export function useTreeContext() {
  const context = React.useContext(TreeContext);
  if (!context) {
    throw new Error("useTreeContext must be used within a TreeProvider");
  }
  return context;
}
