import * as React from "react";

import type { FormState } from "./useForm";

export const FormContext = React.createContext<FormState<any> | null>(null);

export function useFormContext(): FormState<any> {
  const form = React.useContext(FormContext);
  if (!form) throw new Error("Form fields must be used within a Form component");
  return form;
}

export function useFieldValue<K extends keyof T, T extends Record<string, any>>(key: K): [T[K], (value: T[K]) => void] {
  const form = useFormContext();

  const setField = React.useCallback(
    (value: T[K]) => {
      form.setField(key, value);
    },
    [form, key],
  );

  return [form.getField(key), setField];
}

export function useFieldError<K extends keyof T, T extends Record<string, any>>(key: K): string | undefined {
  const form = useFormContext();

  return form.errors[key as string];
}
