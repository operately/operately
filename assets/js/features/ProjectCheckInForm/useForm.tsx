import * as React from "react";

import * as People from "@/graphql/People";
import * as Projects from "@/graphql/Projects";
import * as TipTapEditor from "@/components/Editor";
import * as Updates from "@/graphql/Projects/updates";

import { useNavigate } from "react-router-dom";
import { Paths } from "@/routes/paths";

interface UseFormOptions {
  mode: "create" | "edit";
  author: People.Person;
  project: Projects.Project;
  checkIn?: Updates.Update;
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

  let lastCheckIn: Updates.Update | null = null;

  if (options.mode === "edit") {
    lastCheckIn = options.checkIn!;
  } else {
    lastCheckIn = (options.project.lastCheckIn || null) as Updates.Update | null;
  }

  const [status, setStatus] = React.useState(() => {
    if (options.mode === "edit") {
      return options.checkIn!.content.health.status;
    } else {
      return "on_track";
    }
  });

  const editor = TipTapEditor.useEditor({
    autoFocus: true,
    placeholder: `Write your updates here...`,
    peopleSearch: People.usePeopleSearch(),
    className: "min-h-[250px] py-2 font-medium",
    content: options.checkIn && JSON.parse(options.checkIn.message),
  });

  const [post] = Projects.usePostUpdate({
    onCompleted: (data: any) => navigate(Paths.projectCheckInPath(options.project.id, data.postUpdate.id)),
  });

  const [edit] = Projects.useEditUpdate({
    onCompleted: (data: any) => navigate(Paths.projectCheckInPath(options.project.id, data.editUpdate.id)),
  });

  const submit = () => {
    if (!editor.editor) return;
    if (editor.uploading) return;

    if (options.mode === "create") {
      post({
        variables: {
          input: {
            updatableId: options.project.id,
            updatableType: "Project",
            content: JSON.stringify(editor.editor.getJSON()),
            status,
            messageType: "status_update",
          },
        },
      });

      return;
    }

    if (options.mode === "edit") {
      edit({
        variables: {
          input: {
            updateId: options.checkIn!.id,
            content: JSON.stringify(editor.editor.getJSON()),
            status,
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
