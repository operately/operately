import React from "react";

import { InputElement, Label } from "@/components/Forms/Elements";
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleBlur();
      e.currentTarget.blur();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    editNumericValue(target.id!, e.target.value, field);
  };

  return (
    <div>
      {label && <Label label={label} />}
      <InputElement
        placeholder={placeholder}
        type="text"
        testId={testid}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        error={Boolean(isError)}
        className={className}
      />
    </div>
  );
}
