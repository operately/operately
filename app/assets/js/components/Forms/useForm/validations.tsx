import React from "react";
import { FormState } from "../useForm";
import { AddErrorFn, ErrorMap, ValidationFn } from "./errors";
import { FieldObject } from "./field";

type ValidationFnMap = Record<string, ValidationFn[]>;

export function useValidations() {
  const [validations, setValidations] = React.useState<ValidationFnMap>({});

  const addValidation = (field: string, validation: ValidationFn) => {
    setValidations((prev) => {
      if (prev[field]) {
        return { ...prev, [field]: [...prev[field]!, validation] };
      } else {
        return { ...prev, [field]: [validation] };
      }
    });
  };

  const removeValidation = (field: string, validation: ValidationFn) => {
    setValidations((prev) => {
      if (!prev[field]) return prev;

      const newValidations = prev[field]!.filter((v) => v !== validation);

      if (newValidations.length === 0) {
        const { [field]: _, ...rest } = prev;
        return rest;
      } else {
        return { ...prev, [field]: newValidations };
      }
    });
  };

  return { validations, addValidation, removeValidation };
}

export function runValidations<T extends FieldObject>(
  form: FormState<T>,
  validations: ValidationFnMap,
  formValidate?: (addError: AddErrorFn) => void,
): ErrorMap {
  let errors: ErrorMap = {};

  let addError: AddErrorFn = (field, message) => {
    if (!errors[field]) {
      errors[field] = message;
    }
  };

  for (const key in validations) {
    const value = form.actions.getValue(key);
    const fieldValidations = validations[key];

    if (!fieldValidations) continue;

    for (let i = 0; i < fieldValidations.length; i++) {
      fieldValidations[i]!(key, value, addError);

      if (errors[key]) break;
    }
  }

  if (formValidate) {
    formValidate(addError);
  }

  return errors;
}
