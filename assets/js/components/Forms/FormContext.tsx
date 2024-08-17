import * as React from "react";

import type { FormState } from "./FormState";

export const FormContext = React.createContext<FormState<any> | null>(null);

export function getFormContext(): FormState<any> {
  const form = React.useContext(FormContext);
  if (!form) throw new Error("Form fields must be used within a Form component");
  return form;
}
