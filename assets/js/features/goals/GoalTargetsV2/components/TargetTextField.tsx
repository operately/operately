import React from "react";

import { InputElement, Label } from "@/components/Forms/Elements";
import { useTargetsContext } from "../TargetsContext";
import { Target, TargetTextFields } from "../types";

interface Props {
  target: Target;
  field: TargetTextFields;
  testid: string;
  placeholder: string;
  label?: string;
}

export function TargetTextField({ target, field, testid, placeholder, label }: Props) {
  const { editTextValue, errors } = useTargetsContext();
  const value = React.useMemo(() => target[field]?.toString() || "", [target]);
  const isError = React.useMemo(
    () => Boolean(errors.find((err) => err.id === target.id && err.field === field)),
    [errors],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    editTextValue(target.id!, e.target.value, field);
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
        onKeyDown={handleKeyDown}
        error={isError}
      />
    </div>
  );
}
