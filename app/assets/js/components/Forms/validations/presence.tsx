import { AddErrorFn } from "../useForm/errors";

export function validatePresence(required?: boolean, message?: string) {
  return (field: string, value: string, addError: AddErrorFn) => {
    message = message ?? "Can't be empty";

    if (!required) return;

    if (!value) return addError(field, message);
    if (value.trim().length === 0) return addError(field, message);
  };
}
