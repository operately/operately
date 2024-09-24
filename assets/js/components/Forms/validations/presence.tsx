import { AddErrorFn } from "../FormState";

export function validatePresence(required?: boolean) {
  return (field: string, value: string, addError: AddErrorFn) => {
    if (!required) return;

    if (!value) return addError(field, "Can't be empty");
    if (value.trim().length === 0) return addError(field, "Can't be empty");
  };
}
