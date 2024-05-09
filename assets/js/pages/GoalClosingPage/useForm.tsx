import * as Goals from "@/models/goals";
import * as Forms from "@/components/Form";

import { Paths } from "@/routes/paths";
import { useNavigateTo } from "@/routes/useNavigateTo";

export interface FormData {
  success: string;
  successOptions: Forms.RadioGroupOption[];
  setSuccess: (value: string) => void;

  submit: () => Promise<void>;
  cancelPath: string;
}

export function useForm(goal: Goals.Goal): FormData {
  const [success, setSuccess, successOptions] = Forms.useRadioGroupState([
    { label: "Yes", value: "yes", default: true },
    { label: "No", value: "no" },
  ]);

  const navigateToGoal = useNavigateTo(`/goals/${goal.id}`);

  const [close] = Goals.useCloseGoalMutation({ onCompleted: navigateToGoal });

  const submit = async () => {
    await close({
      variables: {
        input: {
          goalId: goal.id,
          success: success,
        },
      },
    });
  };

  return {
    success,
    setSuccess,
    successOptions,

    submit,
    cancelPath: Paths.goalPath(goal.id),
  };
}
