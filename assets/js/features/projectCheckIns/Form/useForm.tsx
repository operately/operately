import * as React from "react";

import * as People from "@/models/people";
import * as Projects from "@/models/projects";
import * as ProjectCheckIns from "@/models/projectCheckIns";
import * as TipTapEditor from "@/components/Editor";

import { useNavigate } from "react-router-dom";
import { Paths } from "@/routes/paths";
import { isContentEmpty } from "@/components/RichContent/isContentEmpty";

interface UseFormOptions {
  mode: "create" | "edit";
  author: People.Person;
  project: Projects.Project;
  checkIn?: ProjectCheckIns.ProjectCheckIn;
}

export interface Error {
  field: string;
  message: string;
}

export interface FormState {
  mode: "create" | "edit";
  author: People.Person;
  project: Projects.Project;

  editor: TipTapEditor.EditorState;

  status: string | null;
  setStatus: (status: string) => void;

  submit: () => Promise<boolean>;
  submitting: boolean;
  submitDisabled?: boolean;
  submitButtonLabel?: string;

  errors: Error[];

  cancelPath: string;
}

export function useForm({ mode, project, checkIn, author }: UseFormOptions): FormState {
  const navigate = useNavigate();

  const [status, setStatus] = React.useState<string | null>(mode === "edit" ? checkIn!.status! : null);
  const [errors, setErrors] = React.useState<Error[]>([]);

  const editor = TipTapEditor.useEditor({
    placeholder: `Write your updates here...`,
    className: "min-h-[250px] py-2 font-medium",
    content: checkIn?.description && JSON.parse(checkIn.description),
  });

  const [post, { loading: postLoading }] = ProjectCheckIns.usePostProjectCheckIn();
  const [edit, { loading: editLoading }] = ProjectCheckIns.useEditProjectCheckIn();

  const submitting = postLoading || editLoading;

  const submit = async (): Promise<boolean> => {
    if (!editor.editor) return false;
    if (editor.uploading) return false;

    const errors = validate(status, editor.editor.getJSON());

    if (errors.length > 0) {
      setErrors(errors);
      return false;
    }

    if (mode === "create") {
      const res = await post({
        projectId: project.id,
        status,
        description: JSON.stringify(editor.editor.getJSON()),
      });

      navigate(Paths.projectCheckInPath(project.id!, res.checkIn.id));
      return true;
    }

    if (mode === "edit") {
      const res = await edit({
        checkInId: checkIn!.id,
        status,
        description: JSON.stringify(editor.editor.getJSON()),
      });

      navigate(Paths.projectCheckInPath(project.id!, res.checkIn.id));
      return true;
    }

    return false;
  };

  const submitButtonLabel = React.useMemo(() => {
    if (editor.uploading) return "Uploading...";
    if (mode === "create") return "Submit";

    return "Save Changes";
  }, [editor.uploading, mode]);

  const submitDisabled = !editor.editor || editor.uploading;

  const cancelPath =
    mode === "create" ? Paths.projectCheckInsPath(project.id!) : Paths.projectCheckInPath(project.id!, checkIn!.id!);

  return {
    mode,
    author,
    project,
    editor,

    status,
    setStatus,

    submit,
    submitting,
    submitDisabled,
    submitButtonLabel,

    errors,
    cancelPath,
  };
}

function validate(status: string | null, description: string): Error[] {
  let errors: Error[] = [];

  if (!status) {
    errors = [...errors, { field: "status", message: "Status is required" }];
  }

  if (isContentEmpty(description)) {
    errors = [...errors, { field: "description", message: "Description is required" }];
  }

  return errors;
}
