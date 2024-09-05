import * as React from "react";
import * as Goals from "@/models/goals";

import { InputField } from "./FieldGroup";
import { GoalSelectorDropdown } from "@/features/goals/GoalTree/GoalSelectorDropdown";

import { compareIds } from "@/routes/paths";
import { getFormContext } from "./FormContext";

export function SelectGoal({ field, goals, label }: { field: string; goals: Goals.Goal[]; label?: string }) {
  const form = getFormContext();
  const error = form.errors[field];

  const goal = React.useMemo(() => {
    return goals.find((g) => compareIds(g.id, form.fields[field].value));
  }, [goals, form.fields[field].value]);

  const onSelect = React.useCallback(
    (goal: Goals.Goal) => form.fields[field].setValue(goal.id),
    [form.fields[field].setValue],
  );

  return (
    <InputField field={field} label={label} error={error}>
      <GoalSelectorDropdown selected={goal} goals={goals} onSelect={onSelect} error={!!error} />
    </InputField>
  );
}
