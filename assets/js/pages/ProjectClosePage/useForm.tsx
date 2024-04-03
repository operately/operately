import * as React from "react";
import * as Projects from "@/models/projects";
import * as TipTapEditor from "@/components/Editor";
import * as People from "@/models/people";

import { createPath } from "@/utils/paths";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { isContentEmpty } from "@/components/RichContent/isContentEmpty";

interface Error {
  field: string;
  message: string;
}

interface FormState {
  project: Projects.Project;

  errors: Error[];

  whatWentWell: TipTapEditor.EditorState;
  whatCouldHaveGoneBetter: TipTapEditor.EditorState;
  whatDidYouLearn: TipTapEditor.EditorState;

  submit: () => void;
  submittable: boolean;
}

export function useForm(project: Projects.Project): FormState {
  const [errors, setErrors] = React.useState<Error[]>([]);

  const whatWentWell = useWhatWentWellEditor();
  const whatCouldHaveGoneBetter = useWhatCouldHaveGoneBetterEditor();
  const whatDidYouLearn = useWhatDidYouLearnEditor();

  const goToProject = useNavigateTo(createPath("projects", project.id));

  const [post, { loading }] = Projects.useCloseProjectMutation({
    onCompleted: goToProject,
  });

  const submit = React.useCallback(async () => {
    if (!submittable) return false;

    const errors = validate(whatWentWell, whatCouldHaveGoneBetter, whatDidYouLearn);
    if (errors.length > 0) {
      setErrors(errors);
      return false;
    }

    await post({
      variables: {
        input: {
          projectId: project.id,
          retrospective: JSON.stringify({
            whatWentWell: whatWentWell.editor.getJSON(),
            whatCouldHaveGoneBetter: whatCouldHaveGoneBetter.editor.getJSON(),
            whatDidYouLearn: whatDidYouLearn.editor.getJSON(),
          }),
        },
      },
    });

    return true;
  }, [project.id, whatWentWell.editor, whatCouldHaveGoneBetter.editor, whatDidYouLearn.editor]);

  const submittable =
    !loading && whatWentWell.submittable && whatCouldHaveGoneBetter.submittable && whatDidYouLearn.submittable;

  return {
    project,
    errors,
    whatWentWell,
    whatCouldHaveGoneBetter,
    whatDidYouLearn,

    submit,
    submittable,
  };
}

function useWhatWentWellEditor() {
  return TipTapEditor.useEditor({
    placeholder: `Write your answer here...`,
    peopleSearch: People.usePeopleSearch(),
    className: "min-h-[250px] py-2 font-medium",
  });
}

function useWhatCouldHaveGoneBetterEditor() {
  return TipTapEditor.useEditor({
    placeholder: `Write your answer here...`,
    peopleSearch: People.usePeopleSearch(),
    className: "min-h-[250px] py-2 font-medium",
  });
}

function useWhatDidYouLearnEditor() {
  return TipTapEditor.useEditor({
    placeholder: `Write your answer here...`,
    peopleSearch: People.usePeopleSearch(),
    className: "min-h-[250px] py-2 font-medium",
  });
}

function validate(
  whatWentWell: TipTapEditor.EditorState,
  whatCouldHaveGoneBetter: TipTapEditor.EditorState,
  whatDidYouLearn: TipTapEditor.EditorState,
): Error[] {
  let errors: Error[] = [];

  if (isContentEmpty(whatWentWell.editor.getJSON())) {
    errors.push({ field: "whatWentWell", message: "is required" });
  }

  if (isContentEmpty(whatCouldHaveGoneBetter.editor.getJSON())) {
    errors.push({ field: "whatCouldHaveGoneBetter", message: "is required" });
  }

  if (isContentEmpty(whatDidYouLearn.editor.getJSON())) {
    errors.push({ field: "whatDidYouLearn", message: "is required" });
  }

  return errors;
}
