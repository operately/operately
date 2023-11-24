import * as React from "react";
import * as Projects from "@/graphql/Projects";
import * as TipTapEditor from "@/components/Editor";
import * as People from "@/graphql/People";

import { createPath } from "@/utils/paths";
import { useNavigateTo } from "@/routes/useNavigateTo";

interface FormState {
  project: Projects.Project;

  whatWentWell: TipTapEditor.EditorState;
  whatCouldHaveGoneBetter: TipTapEditor.EditorState;
  whatDidYouLearn: TipTapEditor.EditorState;

  submit: () => void;
  submittable: boolean;
}

export function useForm(project: Projects.Project): FormState {
  const whatWentWell = useWhatWentWellEditor();
  const whatCouldHaveGoneBetter = useWhatCouldHaveGoneBetterEditor();
  const whatDidYouLearn = useWhatDidYouLearnEditor();

  const goToProject = useNavigateTo(createPath("project", project.id));

  const [post, { loading }] = Projects.useCloseProjectMutation({
    onCompleted: goToProject,
  });

  const submit = React.useCallback(async () => {
    if (!submittable) return;

    await post({
      variables: {
        id: project.id,
        whatWentWell: whatWentWell.editor.getJSON(),
        whatCouldHaveGoneBetter: whatCouldHaveGoneBetter.editor.getJSON(),
        whatDidYouLearn: whatDidYouLearn.editor.getJSON(),
      },
    });
  }, [project.id, whatWentWell.editor, whatCouldHaveGoneBetter.editor, whatDidYouLearn.editor]);

  const submittable =
    !loading && whatWentWell.submittable && whatCouldHaveGoneBetter.submittable && whatDidYouLearn.submittable;

  return {
    project,
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
