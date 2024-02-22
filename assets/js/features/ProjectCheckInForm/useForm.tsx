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

export function useForm(options: UseFormOptions): FormState {
  const navigate = useNavigate();

  const [status, setStatus] = React.useState(options.mode === "edit" ? options.checkIn : "on_track");

  const editor = TipTapEditor.useEditor({
    autoFocus: true,
    placeholder: `Write your updates here...`,
    peopleSearch: People.usePeopleSearch(),
    className: "min-h-[250px] py-2 font-medium",
    content: options.checkIn && JSON.parse(options.checkIn.description),
  });

  const [post] = ProjectCheckIns.usePostMutation({
    onCompleted: (data: any) => navigate(Paths.projectCheckInPath(options.project.id, data.postProjectCheckIn.id)),
  });

  const [edit] = ProjectCheckIns.useEditMutation({
    onCompleted: (data: any) => navigate(Paths.projectCheckInPath(options.project.id, data.editProjectCheckIn.id)),
  });

  const submit = () => {
    if (!editor.editor) return;
    if (editor.uploading) return;

    if (options.mode === "create") {
      post({
        variables: {
          input: {
            projectId: options.project.id,
            status,
            description: JSON.stringify(editor.editor.getJSON()),
          },
        },
      });

      return;
    }

    if (options.mode === "edit") {
      edit({
        variables: {
          input: {
            checkInId: options.checkIn!.id,
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
    if (options.mode === "create") return "Submit";

    return "Save Changes";
  }, [editor.uploading, options.mode]);

  const submitDisabled = !editor.editor || editor.uploading;

  const cancelPath =
    options.mode === "create"
      ? Paths.projectCheckInsPath(options.project.id)
      : Paths.projectCheckInPath(options.project.id, options.checkIn!.id);

  return {
    author: options.author,
    project: options.project,

    editor,

    status,
    setStatus,

    submit,
    submitDisabled,
    submitButtonLabel,

    cancelPath: cancelPath,
  };
}
