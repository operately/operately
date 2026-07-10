import * as React from "react";
import * as Goals from "@/models/goals";

import { Forms } from "turboui";
import { GoalSelectorDropdown } from "@/features/goals/GoalTree/GoalSelectorDropdown";

interface SelectGoalProps {
  field: string;
  goals: Goals.Goal[];
  label?: string;
  required?: boolean;
  allowCompanyWide?: boolean;
}

const DEFAULT_VALIDATION_PROPS = {
  required: true,
};

export function SelectGoal(props: SelectGoalProps) {
  const { field, label, goals, required } = { ...DEFAULT_VALIDATION_PROPS, ...props };

  const [value, setValue] = Forms.useFieldValue<Goals.Goal>(field);
  const error = Forms.useFieldError(field);

  const onSelect = React.useCallback((goal: Goals.Goal) => setValue(goal), [setValue]);
  Forms.useValidation(field, Forms.validatePresence(required));

  return (
    <Forms.InputField field={field} label={label} error={error}>
      <GoalSelectorDropdown
        selected={value}
        goals={goals}
        onSelect={onSelect}
        error={!!error}
        allowCompanyWide={props.allowCompanyWide}
      />
    </Forms.InputField>
  );
}
