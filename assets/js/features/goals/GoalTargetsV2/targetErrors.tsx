import { useEffect } from "react";

import { useFieldError, useFormContext } from "@/components/Forms/FormContext";
import { ErrorMap } from "@/components/Forms/useForm/errors";
import { REQUIRED_FIELDS, Target, TargetFields } from "./types";

export function validateTargets(targets: Target[], addError: (field: string, message: string) => void) {
  targets.forEach((target) => {
    REQUIRED_FIELDS.forEach((field) => {
      if (validField(target, field)) {
        addError(getErrorKey(target.id!, field), "Can't be empty");
      }
    });
  });
}

export function useTargetsValidator(targets: Target[]) {
  const form = useFormContext();
  useClearTargetErrors(targets);

  const validate = (id: string | undefined) => {
    const target = targets.find((t) => t.id === id);
    const errors: ErrorMap = {};

    if (id && target) {
      REQUIRED_FIELDS.forEach((field) => {
        if (validField(target, field)) {
          errors[getErrorKey(id, field)] = "Can't be empty";
        }
      });
    }

    if (Object.keys(errors).length > 0) {
      form.actions.addErrors(errors);
      return false;
    }

    return true;
  };

  return validate;
}

export function useTargetError(target: Target, field: TargetFields) {
  return useFieldError(getErrorKey(target.id!, field));
}

function useClearTargetErrors(targets: Target[]) {
  const form = useFormContext();

  useEffect(() => {
    if (Object.keys(form.errors).length > 0) {
      const errorKeys: string[] = [];

      targets.forEach((target) => {
        REQUIRED_FIELDS.forEach((field) => {
          const key = getErrorKey(target.id!, field);

          if (form.errors[key] && !validField(target, field)) {
            errorKeys.push(key);
          }
        });
      });

      if (errorKeys.length > 0) {
        form.actions.removeErrors(errorKeys);
      }
    }
  }, [targets]);
}

function getErrorKey(id: string, field: TargetFields) {
  return `targets[${id}].${field}`;
}

function validField(target: Target, field: TargetFields) {
  return !target[field] && target[field] !== 0;
}
