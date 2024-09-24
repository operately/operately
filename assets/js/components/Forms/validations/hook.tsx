import React from "react";

import { useFormContext } from "../FormContext";
import { FieldValue } from "../useForm";
import { AddErrorFn } from "../FormState";

export type ValidationFn = (field: string, value: FieldValue, addError: AddErrorFn) => void;

export function useValidation(field: string, f: ValidationFn) {
  const form = useFormContext();

  React.useEffect(() => {
    if (!form) return;

    form.actions.addValidation(field, f);
    return () => form.actions.removeValidation(field, f);
  }, [field]);
}
