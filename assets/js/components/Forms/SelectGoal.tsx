import * as React from "react";
import * as Goals from "@/models/goals";

import { InputField } from "./FieldGroup";
import { GoalSelectorDropdown } from "@/features/goals/GoalTree/GoalSelectorDropdown";

import { compareIds } from "@/routes/paths";
import { useFieldValue, useFieldError } from "./FormContext";

interface SelectGoalProps {
  field: string;
  goals: Goals.Goal[];
  label?: string;
}

export function SelectGoal({ field, goals, label }: SelectGoalProps) {
  const [value, setValue] = useFieldValue(field);
  const error = useFieldError(field);

  const goal = React.useMemo(() => {
    return goals.find((g) => compareIds(g.id, value));
  }, [goals, value]);

  const onSelect = React.useCallback((goal: Goals.Goal) => setValue(goal.id), [setValue]);

  return (
    <InputField field={field} label={label} error={error}>
      <GoalSelectorDropdown selected={goal} goals={goals} onSelect={onSelect} error={!!error} />
    </InputField>
  );
}
