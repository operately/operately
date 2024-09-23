import * as React from "react";

import type { FormState } from "./useForm";

export const FormContext = React.createContext<FormState<any> | null>(null);

export function getFormContext(): FormState<any> {
  const form = React.useContext(FormContext);
  if (!form) throw new Error("Form fields must be used within a Form component");
  return form;
}

export function useField<T>(name: string): T {
  const form = React.useContext(FormContext);
  if (!form) throw new Error("Form fields must be used within a Form component");

  let f: any = form;

  const parts = name.split(".");
  for (const part of parts) {
    f = f.fields[part];
  }

  return f as T;
}
