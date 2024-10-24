import * as React from "react";
import * as Goals from "@/models/goals";
import * as Projects from "@/models/projects";
import { Person } from "@/models/people";

import { Tree, buildTree, SortColumn, SortDirection, TreeOptions } from "./tree";
import { ExpandableProvider } from "./context/Expandable";

interface TreeContextValue {
  tree: Tree;

  sortColumn: SortColumn;
  sortDirection: SortDirection;
  setSortColumn: (column: SortColumn) => void;
  setSortDirection: (direction: SortDirection) => void;

  hideSpaceColumn?: boolean;

  showActive: boolean;
  setShowActive: (show: boolean) => void;
  showPaused: boolean;
  setShowPaused: (show: boolean) => void;
  showCompleted: boolean;
  setShowCompleted: (show: boolean) => void;
  setChampionedBy: (person?: Person) => void;
  setReviewedBy: (person?: Person) => void;
}

const TreeContext = React.createContext<TreeContextValue | null>(null);

export interface TreeContextProviderProps {
  goals: Goals.Goal[];
  projects: Projects.Project[];
  options: Pick<TreeOptions, "spaceId" | "personId" | "goalId">;

  hideSpaceColumn?: boolean;
}

interface TreeContextProviderPropsWithChildren extends TreeContextProviderProps {
  children: React.ReactNode;
}

export function TreeContextProvider(props: TreeContextProviderPropsWithChildren) {
  const [sortColumn, setSortColumn] = React.useState<SortColumn>("name");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("asc");
  const [showActive, setShowActive] = React.useState<boolean>(true);
  const [showPaused, setShowPaused] = React.useState<boolean>(false);
  const [showCompleted, setShowCompleted] = React.useState<boolean>(false);
  const [championedBy, setChampionedBy] = React.useState<Person>();
  const [reviewedBy, setReviewedBy] = React.useState<Person>();

  const treeOptions = {
    ...props.options,
    personId: props.options.personId || championedBy?.id!,
    reviewerId: reviewedBy?.id!,
    sortColumn,
    sortDirection,
    showActive,
    showPaused,
    showCompleted,
  };

  const tree = React.useMemo(
    () => buildTree(props.goals, props.projects, treeOptions),
    [props.goals, props.projects, treeOptions],
  );

  const value = {
    tree,
    sortColumn,
    setSortColumn,
    setSortDirection,
    sortDirection,
    hideSpaceColumn: props.hideSpaceColumn,
    showActive,
    setShowActive,
    showPaused,
    setShowPaused,
    showCompleted,
    setShowCompleted,
    setChampionedBy,
    setReviewedBy,
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
