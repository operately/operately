import * as React from "react";
import * as Goals from "@/models/goals";

import { InputField } from "./FieldGroup";
import { GoalSelectorDropdown } from "@/features/goals/GoalTree/GoalSelectorDropdown";

import { compareIds } from "@/routes/paths";
import { useFieldValue, useFieldError } from "./FormContext";
import { useValidation } from "./validations/hook";
import { validatePresence } from "./validations/presence";

interface SelectGoalProps {
  field: string;
  goals: Goals.Goal[];
  label?: string;
  required?: boolean;
}

const DEFAULT_VALIDATION_PROPS = {
  required: true,
};

export function SelectGoal(props: SelectGoalProps) {
  const { field, label, goals, required } = { ...DEFAULT_VALIDATION_PROPS, ...props };

  const [value, setValue] = useFieldValue(field);
  const error = useFieldError(field);

  const goal = React.useMemo(() => {
    return goals.find((g) => compareIds(g.id, value));
  }, [goals, value]);

  const onSelect = React.useCallback((goal: Goals.Goal) => setValue(goal.id!), [setValue]);

  useValidation(field, validatePresence(required));

  return (
    <InputField field={field} label={label} error={error}>
      <GoalSelectorDropdown selected={goal} goals={goals} onSelect={onSelect} error={!!error} />
    </InputField>
  );
}
