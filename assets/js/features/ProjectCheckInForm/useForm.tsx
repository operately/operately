import * as React from "react";

import * as People from "@/graphql/People";
import * as Projects from "@/graphql/Projects";
import * as TipTapEditor from "@/components/Editor";
import * as Updates from "@/graphql/Projects/updates";

import { useNavigate } from "react-router-dom";
import { useHealthState, HealthState } from "./useHealthState";

interface UseFormOptions {
  mode: "create" | "edit";
  project: Projects.Project;
  checkIn?: Updates.Update;
}

export interface FormState {
  editor: TipTapEditor.EditorState;
  healthState: HealthState;

  submit: () => void;
  submitDisabled?: boolean;
  submitButtonLabel?: string;

  cancelPath: string;
}

export function useForm(options: UseFormOptions): FormState {
  const navigate = useNavigate();
  const healthState = useHealthState(options.project);

  const editor = TipTapEditor.useEditor({
    autoFocus: true,
    placeholder: `Write your updates here...`,
    peopleSearch: People.usePeopleSearch(),
    className: "min-h-[350px] py-2 font-medium",
  });

  const [post] = Projects.usePostUpdate({
    onCompleted: (data: any) => navigate(`/projects/${options.project.id}/status_updates/${data.createUpdate.id}`),
  });

  const submit = () => {
    if (!editor.editor) return;
    if (editor.uploading) return;

    const health = {
      status: {
        value: healthState.status,
        comments: healthState.statusEditor.editor.getJSON(),
      },
      schedule: {
        value: healthState.schedule,
        comments: healthState.scheduleEditor.editor.getJSON(),
      },
      budget: {
        value: healthState.budget,
        comments: healthState.budgetEditor.editor.getJSON(),
      },
      team: {
        value: healthState.team,
        comments: healthState.teamEditor.editor.getJSON(),
      },
      risks: {
        value: healthState.risks,
        comments: healthState.risksEditor.editor.getJSON(),
      },
    };

    post({
      variables: {
        input: {
          updatableType: "project",
          updatableId: options.project.id,
          content: JSON.stringify(editor.editor.getJSON()),
          health: JSON.stringify(health),
          messageType: "status_update",
        },
      },
    });
  };

  const submitButtonLabel = React.useMemo(() => {
    if (editor.uploading) return "Uploading...";
    if (options.mode === "create") return "Submit";

    return "Save Changes";
  }, [editor.uploading, options.mode]);

  return {
    editor,
    healthState,

    submit,
    submitDisabled: !editor.editor || editor.uploading,
    submitButtonLabel,

    cancelPath: `/projects/${options.project.id}/status_updates`,
  };
}
