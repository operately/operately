import { AddErrorFn } from "../useForm/errors";

export function isNumber() {
  return (field: string, value: string, addError: AddErrorFn) => {
    if (value === null || value === undefined) {
      return addError(field, `Must be a valid number`);
    }

    const num = Number(value);

    if (isNaN(num) || !isFinite(num)) {
      return addError(field, `Must be a valid number`);
    }
  };
}
