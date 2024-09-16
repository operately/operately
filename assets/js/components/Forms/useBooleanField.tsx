import React from "react";

import { Field } from "./FormState";

export type BooleanField = Field<boolean> & {
  type: "boolean";
  toggle: () => void;
};

export function useBooleanField(initial: boolean): BooleanField {
  const [value, setValue] = React.useState(initial);

  const validate = (): string | null => null;
  const reset = () => setValue(initial);
  const toggle = () => setValue((prev) => !prev);

  return { type: "boolean", initial, value, setValue, validate, reset, toggle };
}
