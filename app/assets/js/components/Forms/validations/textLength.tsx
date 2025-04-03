import { AddErrorFn } from "../useForm/errors";

export function validateTextLength(minLength?: number, maxLength?: number) {
  return (field: string, value: string, addError: AddErrorFn) => {
    if (minLength && maxLength && minLength > maxLength) {
      throw new Error("minLength must be less than or equal to maxLength");
    }

    if (minLength && value.length < minLength) {
      return addError(field, `Must be at least ${minLength} characters long`);
    }

    if (maxLength && value.length > maxLength) {
      return addError(field, `Must be at most ${maxLength} characters long`);
    }
  };
}
