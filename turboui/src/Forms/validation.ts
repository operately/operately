import * as React from "react";

import i18n, { translationText } from "../i18n";
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

export function validatePresence(required?: boolean, message?: string): FieldValidation {
  return (field: string, value: unknown, addError: AddErrorFn) => {
    if (!required) {
      return;
    }

    const error = translationText(message ?? i18n.t("Can't be empty"));

    if (typeof value !== "string") {
      if (!value) {
        addError(field, error);
      }
      return;
    }

    if (value.trim().length === 0) {
      addError(field, error);
    }
  };
}

export function validateRichContentPresence(required?: boolean, message?: string): FieldValidation {
  return (field: string, value: unknown, addError: AddErrorFn) => {
    if (required && isContentEmpty(value)) {
      addError(field, translationText(message ?? i18n.t("Can't be empty")));
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
      addError(field, translationText(i18n.t("Must be at least {{minLength}} characters long", { minLength })));
    }

    if (maxLength && value.length > maxLength) {
      addError(field, translationText(i18n.t("Must be at most {{maxLength}} characters long", { maxLength })));
    }
  };
}

export function validateIsNumber(message?: string): FieldValidation {
  return (field: string, value: unknown, addError: AddErrorFn) => {
    if (value === null || value === undefined || value === "") {
      return;
    }

    const num = Number(value);

    if (isNaN(num) || !isFinite(num)) {
      addError(field, translationText(message ?? i18n.t("Must be a valid number")));
    }
  };
}
