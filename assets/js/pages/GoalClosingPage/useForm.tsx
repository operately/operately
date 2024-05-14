import React from "react";

import * as Goals from "@/models/goals";
import * as Forms from "@/components/Form";
import * as Editor from "@/components/Editor";

import { Paths } from "@/routes/paths";
import { Validators } from "@/utils/validators";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { useListState } from "@/utils/useListState";

interface Error {
  field: string;
  message: string;
}

export interface FormState {
  success: string;
  successOptions: Forms.RadioGroupOption[];
  setSuccess: (value: string) => void;

  retrospectiveEditor: Editor.EditorState;

  targets: TargetState[];
  updateTarget: (id: string, value: number | null) => void;

  errors: Error[];
  submit: () => Promise<void>;
  cancelPath: string;
}

export function useForm(goal: Goals.Goal): FormState {
  const navigateToGoal = useNavigateTo(Paths.goalPath(goal.id));

  const [errors, setErrors] = React.useState<Error[]>([]);

  const [success, setSuccess, successOptions] = Forms.useRadioGroupState([
    { label: "Yes", value: "yes", default: true },
    { label: "No", value: "no" },
  ]);

  const [close] = Goals.useCloseGoalMutation({ onCompleted: navigateToGoal });

  const [targets, { update: updateTarget }] = useTargetListState(goal);

  const retrospectiveEditor = Editor.useEditor({
    placeholder: "What went well? What could've gone better?",
    className: "min-h-[250px] py-2 font-medium",
  });

  const submit = async () => {
    const errors = validate(targets);

    if (errors.length > 0) {
      setErrors(errors);
      return;
    }

    await close({
      variables: {
        input: {
          goalId: goal.id,
          success: success,
          retrospective: JSON.stringify(retrospectiveEditor.editor.getJSON()),
        },
      },
    });
  };

  return {
    errors,

    success,
    setSuccess,
    successOptions,

    retrospectiveEditor,

    targets,
    updateTarget,

    submit,
    cancelPath: Paths.goalPath(goal.id),
  };
}

function validate(targets: TargetState[]): Error[] {
  const errors: Error[] = [];

  targets.forEach((target) => {
    if (!Validators.nonEmptyNumber(target.value)) {
      errors.push({ field: target.id, message: `cannot be empty` });
    }
  });

  return errors;
}

interface TargetState {
  id: string;
  name: string;
  value: number | null;
  from: number;
  to: number;
  unit: string;
}

function useTargetListState(goal: Goals.Goal): [TargetState[], { update: (id: string, value: number) => void }] {
  const [targets, { update }] = useListState<TargetState>(
    goal.targets!.map((target) => ({
      id: target!.id,
      name: target!.name,
      value: target!.value,
      from: target!.from,
      to: target!.to,
      unit: target!.unit,
    })),
  );

  const updateValue = (id: string, value: number | null) => update(id, "value", value);

  return [targets, { update: updateValue }];
}
