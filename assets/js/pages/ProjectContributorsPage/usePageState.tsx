import * as React from "react";
import * as Projects from "@/models/projects";

export interface PageState {
  editing: boolean;

  addContribButtonVisible: boolean;
  addContribVisible: boolean;
  showAddContribForm: () => void;
  hideAddContribForm: () => void;

  editResponsibilityActiveFor: string | null;
  activateEditResponsibility: (id: string) => void;
  deactivateEditResponsibility: () => void;
}

export function usePageState(project: Projects.Project): PageState {
  const [editing, setEditing] = React.useState(false);
  const [addContribVisible, setAddContribVisible] = React.useState(false);
  const [editResponsibilityActiveFor, setEditContributActiveFor] = React.useState<string | null>(null);

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
    editResponsibilityActiveFor,
    activateEditResponsibility: (id: string) => {
      setEditing(true);
      setEditContributActiveFor(id);
    },
    deactivateEditResponsibility: () => {
      setEditing(false);
      setEditContributActiveFor(null);
    },
  };
}
