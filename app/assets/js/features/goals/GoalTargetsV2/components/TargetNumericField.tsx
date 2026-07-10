import React from "react";

import { Forms } from "turboui";
import { useTargetsContext } from "../TargetsContext";
import { Target, TargetNumericFields } from "../types";
import { useTargetError } from "../targetErrors";

interface Props {
  target: Target;
  field: TargetNumericFields;
  testid: string;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function TargetNumericField({ target, field, testid, placeholder, label, className }: Props) {
  const { editNumericValue } = useTargetsContext();
  const value = React.useMemo(() => target[field]?.toString() || "", [target]);
  const isError = useTargetError(target, field);

  const handleBlur = () => {
    const parsedValue = parseFloat(value);

    if (!isNaN(parsedValue)) {
      editNumericValue(target.id!, parsedValue, field);
    } else {
      editNumericValue(target.id!, "", field);
    }
  };

  const handleEnter = (e: React.KeyboardEvent) => {
    e.preventDefault();
    handleBlur();
    (e.currentTarget as HTMLInputElement).blur();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    editNumericValue(target.id!, e.target.value, field);
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
        onBlur={handleBlur}
        onEnter={handleEnter}
        error={Boolean(isError)}
        className={className}
      />
    </div>
  );
}
