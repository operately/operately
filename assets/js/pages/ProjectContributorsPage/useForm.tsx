import * as React from "react";
import * as Projects from "@/models/projects";

import { useRefresh } from "./loader";
import { useAddProjectContributor } from "@/api";


export interface FormState {
  project: Projects.Project;
  addContrib: AddColobState;
}

export function useForm(project: Projects.Project): FormState {
  const addContrib = useAddContrib(project);

  return {
    project,
    addContrib,
  };
}

interface AddColobState {
  hasPermission: boolean;
  active: boolean;
  activate: () => void;
  deactivate: () => void;

  personID: string | null;
  setPersonID: (id: string) => void;
  responsibility: string;
  setResponsibility: (responsibility: string) => void;

  submit: () => void;
  submittable: boolean;
  submitting: boolean;
}

function useAddContrib(project: Projects.Project): AddColobState {
  const refresh = useRefresh();
  const hasPermission = project.permissions!.canEditContributors!;

  const [active, setActive] = React.useState(false);

  const activate = () => setActive(true);
  const deactivate = () => setActive(false);

  const [personID, setPersonID] = React.useState<string | null>(null);
  const [responsibility, setResponsibility] = React.useState("");

  const submittable = !!personID && !!responsibility;

  const [add, { loading: submitting }] = useAddProjectContributor();

  const submit = async () => {
    if (!submittable) return;

    await add({
      projectId: project.id,
      personId: personID,
      responsibility: responsibility,
    });

    refresh();
    deactivate();
  };

  return {
    hasPermission,
    active,
    activate,
    deactivate,

    personID,
    setPersonID,
    responsibility,
    setResponsibility,

    submit,
    submittable,
    submitting,
  };
}
