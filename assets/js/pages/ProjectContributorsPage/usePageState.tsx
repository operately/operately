import * as React from "react";
import * as Projects from "@/models/projects";

export interface PageState {
  addContribButtonVisible: boolean;
  addContribVisible: boolean;
  showAddContribForm: () => void;
  hideAddContribForm: () => void;
}

export function usePageState(project: Projects.Project): PageState {
  const [addContribVisible, setAddContribVisible] = React.useState(false);

  return {
    addContribButtonVisible: project.permissions!.canEditContributors! && !addContribVisible,
    addContribVisible,
    showAddContribForm: () => setAddContribVisible(true),
    hideAddContribForm: () => setAddContribVisible(false),
  };
}
