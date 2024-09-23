import React from "react";

import { ValueField } from "./FormState";

export type BooleanField = ValueField<boolean> & {
  type: "boolean";
  toggle: () => void;
};

export function useBooleanField(initial: boolean): BooleanField {
  const [value, setValue] = React.useState(initial);
  const [fieldName, setFieldName] = React.useState<string | undefined>(undefined);

  const validate = (): string | null => null;
  const reset = () => setValue(initial);
  const toggle = () => setValue((prev) => !prev);

  return { type: "boolean", initial, value, setValue, validate, reset, toggle, fieldName, setFieldName };
}
