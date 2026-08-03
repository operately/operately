import * as React from "react";

import type { FormState, FormValueUpdater, FormValues } from "./types";

const FormContext = React.createContext<FormState<FormValues> | null>(null);

export function FormsProvider({
  form,
  children,
}: {
  form: FormState<FormValues>;
  children: React.ReactNode;
}) {
  return <FormContext.Provider value={form}>{children}</FormContext.Provider>;
}

export function useFormContext<T extends FormValues = FormValues>() {
  const form = React.useContext(FormContext);

  if (!form) {
    throw new Error("Form fields must be used within a Form component");
  }

  return form as FormState<T>;
}

export function useFieldValue<TValue = unknown>(field: string): [TValue | undefined, (value: FormValueUpdater<TValue>) => void] {
  const form = useFormContext();
  const formRef = React.useRef(form);
  formRef.current = form;

  const setValue = React.useCallback(
    (nextValue: FormValueUpdater<TValue>) => {
      formRef.current.actions.setValue(field, nextValue);
    },
    [field],
  );

  return [form.actions.getValue<TValue>(field), setValue];
}

export function useFieldError(field: string) {
  const form = useFormContext();

  return form.errors[field];
}
