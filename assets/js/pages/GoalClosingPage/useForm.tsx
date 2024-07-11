import * as Goals from "@/models/goals";
import * as Forms from "@/components/Form";
import * as Editor from "@/components/Editor";

import { Paths } from "@/routes/paths";
import { useNavigateTo } from "@/routes/useNavigateTo";

export interface FormData {
  success: string;
  successOptions: Forms.RadioGroupOption[];
  setSuccess: (value: string) => void;

  retrospectiveEditor: Editor.EditorState;

  submit: () => Promise<void>;
  cancelPath: string;
}

export function useForm(goal: Goals.Goal): FormData {
  const navigateToGoal = useNavigateTo(Paths.goalPath(goal.id!));

  const [success, setSuccess, successOptions] = Forms.useRadioGroupState([
    { label: "Yes", value: "yes", default: true },
    { label: "No", value: "no" },
  ]);

  const [close] = Goals.useCloseGoal();

  const retrospectiveEditor = Editor.useEditor({
    placeholder: "What went well? What could've gone better?",
    className: "min-h-[250px] py-2 font-medium",
  });

  const submit = async () => {
    await close({
      goalId: goal.id,
      success: success,
      retrospective: JSON.stringify(retrospectiveEditor.editor.getJSON()),
    });
    navigateToGoal();
  };

  return {
    success,
    setSuccess,
    successOptions,

    retrospectiveEditor,

    submit,
    cancelPath: Paths.goalPath(goal.id!),
  };
}
