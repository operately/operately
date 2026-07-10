import React from "react";

import { Forms } from "turboui";
import { useTargetsContext } from "../TargetsContext";
import { Target, TargetTextFields } from "../types";
import { useTargetError } from "../targetErrors";

interface Props {
  target: Target;
  field: TargetTextFields;
  testid: string;
  placeholder: string;
  label?: string;
}

export function TargetTextField({ target, field, testid, placeholder, label }: Props) {
  const { editTextValue } = useTargetsContext();
  const value = React.useMemo(() => target[field]?.toString() || "", [target]);
  const isError = useTargetError(target, field);

  const handleEnter = (e: React.KeyboardEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLInputElement).blur();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    editTextValue(target.id!, e.target.value, field);
  };

  return (
    <div>
      {label && <Forms.Label label={label} />}
      <Forms.Input
        placeholder={placeholder}
        type="text"
        testId={testid}
        value={value}
        onChange={handleChange}
        onEnter={handleEnter}
        error={Boolean(isError)}
      />
    </div>
  );
}
