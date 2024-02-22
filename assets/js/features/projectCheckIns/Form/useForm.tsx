import * as React from "react";

import * as People from "@/models/people";
import * as Projects from "@/models/projects";
import * as ProjectCheckIns from "@/models/projectCheckIns";
import * as TipTapEditor from "@/components/Editor";

import { useNavigate } from "react-router-dom";
import { Paths } from "@/routes/paths";

interface UseFormOptions {
  mode: "create" | "edit";
  author: People.Person;
  project: Projects.Project;
  checkIn?: ProjectCheckIns.ProjectCheckIn;
}

export interface FormState {
  author: People.Person;
  project: Projects.Project;

  editor: TipTapEditor.EditorState;

  status: string;
  setStatus: (status: string) => void;

  submit: () => void;
  submitDisabled?: boolean;
  submitButtonLabel?: string;

  cancelPath: string;
}

export function useForm({ mode, project, checkIn, author }: UseFormOptions): FormState {
  const navigate = useNavigate();

  const [status, setStatus] = React.useState(mode === "edit" ? checkIn!.status : "on_track");

  const editor = TipTapEditor.useEditor({
    placeholder: `Write your updates here...`,
    peopleSearch: People.usePeopleSearch(),
    className: "min-h-[250px] py-2 font-medium",
    content: checkIn && JSON.parse(checkIn.description),
  });

  const [post] = ProjectCheckIns.usePostMutation({
    onCompleted: (data: any) => navigate(Paths.projectCheckInPath(project.id, data.postProjectCheckIn.id)),
  });

  const [edit] = ProjectCheckIns.useEditMutation({
    onCompleted: (data: any) => navigate(Paths.projectCheckInPath(project.id, data.editProjectCheckIn.id)),
  });

  const submit = () => {
    if (!editor.editor) return;
    if (editor.uploading) return;

    if (mode === "create") {
      post({
        variables: {
          input: {
            projectId: project.id,
            status,
            description: JSON.stringify(editor.editor.getJSON()),
          },
        },
      });

      return;
    }

    if (mode === "edit") {
      edit({
        variables: {
          input: {
            checkInId: checkIn!.id,
            status,
            description: JSON.stringify(editor.editor.getJSON()),
          },
        },
      });

      return;
    }
  };

  const submitButtonLabel = React.useMemo(() => {
    if (editor.uploading) return "Uploading...";
    if (mode === "create") return "Submit";

    return "Save Changes";
  }, [editor.uploading, mode]);

  const submitDisabled = !editor.editor || editor.uploading;

  const cancelPath =
    mode === "create" ? Paths.projectCheckInsPath(project.id) : Paths.projectCheckInPath(project.id, checkIn!.id);

  return {
    author,
    project,
    editor,

    status,
    setStatus,

    submit,
    submitDisabled,
    submitButtonLabel,

    cancelPath: cancelPath,
  };
}
