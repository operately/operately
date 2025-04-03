import React from "react";

import { InputElement, Label } from "@/components/Forms/Elements";
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
        error={Boolean(isError)}
      />
    </div>
  );
}
