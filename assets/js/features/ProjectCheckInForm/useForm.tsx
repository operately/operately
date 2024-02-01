import * as People from "@/graphql/People";
import * as Projects from "@/graphql/Projects";
import * as TipTapEditor from "@/components/Editor";

import { useNavigate } from "react-router-dom";
import { useHealthState, HealthState } from "./useHealthState";

export interface FormState {
  editor: TipTapEditor.EditorState;
  healthState: HealthState;

  submit: () => void;
  submitDisabled?: boolean;
  submitButtonLabel?: string;

  cancelPath: string;
}

export function useForm(project: Projects.Project): FormState {
  const navigate = useNavigate();
  const healthState = useHealthState(project);

  const editor = TipTapEditor.useEditor({
    autoFocus: true,
    placeholder: `Write your updates here...`,
    peopleSearch: People.usePeopleSearch(),
    className: "min-h-[350px] py-2 font-medium",
  });

  const [post] = Projects.usePostUpdate({
    onCompleted: (data: any) => navigate(`/projects/${project.id}/status_updates/${data.createUpdate.id}`),
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
          updatableId: project.id,
          content: JSON.stringify(editor.editor.getJSON()),
          health: JSON.stringify(health),
          messageType: "status_update",
        },
      },
    });
  };

  return {
    editor,
    healthState,

    submit,
    submitDisabled: !editor.editor || editor.uploading,
    submitButtonLabel: editor.uploading ? "Uploading..." : "Submit",

    cancelPath: `/projects/${project.id}`,
  };
}
