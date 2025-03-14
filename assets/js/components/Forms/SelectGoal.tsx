import * as React from "react";
import * as Goals from "@/models/goals";

import { InputField } from "./FieldGroup";
import { GoalSelectorDropdown } from "@/features/goals/GoalTree/GoalSelectorDropdown";

import { useFieldValue, useFieldError } from "./FormContext";
import { useValidation } from "./validations/hook";
import { validatePresence } from "./validations/presence";

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

  const [value, setValue] = useFieldValue<Goals.Goal>(field);
  const error = useFieldError(field);

  const onSelect = React.useCallback((goal: Goals.Goal) => setValue(goal), [setValue]);
  useValidation(field, validatePresence(required));

  return (
    <InputField field={field} label={label} error={error}>
      <GoalSelectorDropdown
        selected={value}
        goals={goals}
        onSelect={onSelect}
        error={!!error}
        allowCompanyWide={props.allowCompanyWide}
      />
    </InputField>
  );
}
