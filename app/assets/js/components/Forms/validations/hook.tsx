import React from "react";

import { useFormContext } from "../FormContext";
import { ValidationFn } from "../useForm/errors";

export function useValidation(field: string, f: ValidationFn) {
  const form = useFormContext();

  React.useEffect(() => {
    if (!form) return;

    form.actions.addValidation(field, f);
    return () => form.actions.removeValidation(field, f);
  }, [field]);
}
