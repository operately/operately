import * as React from "react";

import type { FormState } from "./useForm";

export const FormContext = React.createContext<FormState<any> | null>(null);

export function useFormContext(): FormState<any> {
  const form = React.useContext(FormContext);
  if (!form) throw new Error("Form fields must be used within a Form component");
  return form;
}

export function useFieldValue<T = string>(key: string): [T, React.Dispatch<React.SetStateAction<T>>] {
  const form = useFormContext();

  const setValue = React.useCallback(
    (value: T) => {
      form.actions.setValue(key, value);
    },
    [form, key],
  );

  return [form.actions.getValue(key) as T, setValue];
}

export function useFieldError<K extends keyof T, T extends Record<string, any>>(key: K): string | undefined {
  const form = useFormContext();

  return form.errors[key as string];
}
