import * as React from "react";

import { isContentEmpty } from "../RichContent";
import { useFormContext } from "./context";
import type { AddErrorFn, FieldValidation } from "./types";

export function useValidation(field: string, validation: FieldValidation) {
  const form = useFormContext();

  React.useEffect(() => {
    form.actions.addValidation(field, validation);

    return () => form.actions.removeValidation(field, validation);
  }, [field, form, validation]);
}

export function validatePresence(required?: boolean, message = "Can't be empty"): FieldValidation {
  return (field: string, value: unknown, addError: AddErrorFn) => {
    if (!required) {
      return;
    }

    if (typeof value !== "string") {
      if (!value) {
        addError(field, message);
      }
      return;
    }

    if (value.trim().length === 0) {
      addError(field, message);
    }
  };
}

export function validateRichContentPresence(required?: boolean, message = "Can't be empty"): FieldValidation {
  return (field: string, value: unknown, addError: AddErrorFn) => {
    if (required && isContentEmpty(value)) {
      addError(field, message);
    }
  };
}

export function validateTextLength(minLength?: number, maxLength?: number): FieldValidation {
  return (field: string, value: unknown, addError: AddErrorFn) => {
    if (typeof value !== "string") {
      return;
    }

    if (minLength && maxLength && minLength > maxLength) {
      throw new Error("minLength must be less than or equal to maxLength");
    }

    if (minLength && value.length < minLength) {
      addError(field, `Must be at least ${minLength} characters long`);
    }

    if (maxLength && value.length > maxLength) {
      addError(field, `Must be at most ${maxLength} characters long`);
    }
  };
}

export function validateIsNumber(message = "Must be a valid number"): FieldValidation {
  return (field: string, value: unknown, addError: AddErrorFn) => {
    if (value === null || value === undefined || value === "") {
      return;
    }

    const num = Number(value);

    if (isNaN(num) || !isFinite(num)) {
      addError(field, message);
    }
  };
}
