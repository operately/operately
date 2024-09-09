import * as React from "react";
import * as Projects from "@/models/projects";

export interface PageState {
  editing: boolean;
  addContribButtonVisible: boolean;
  addContribVisible: boolean;
  showAddContribForm: () => void;
  hideAddContribForm: () => void;
}

export function usePageState(project: Projects.Project): PageState {
  const [editing, setEditing] = React.useState(false);
  const [addContribVisible, setAddContribVisible] = React.useState(false);

  return {
    editing,
    addContribButtonVisible: project.permissions!.canEditContributors! && !editing,
    addContribVisible,
    showAddContribForm: () => {
      setEditing(true);
      setAddContribVisible(true);
    },
    hideAddContribForm: () => {
      setEditing(false);
      setAddContribVisible(false);
    },
  };
}
