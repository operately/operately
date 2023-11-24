import * as Projects from "@/graphql/Projects";
import * as TipTapEditor from "@/components/Editor";
import * as People from "@/graphql/People";

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

  const submit = () => {
    console.log("submit");
  };

  const submittable = whatWentWell.submittable && whatCouldHaveGoneBetter.submittable && whatDidYouLearn.submittable;

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
