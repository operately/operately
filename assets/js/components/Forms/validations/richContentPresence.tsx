import { isContentEmpty } from "@/components/RichContent/isContentEmpty";
import { AddErrorFn } from "../useForm/errors";

export function validateRichContentPresence(required?: boolean) {
  return (field: string, value: any, addError: AddErrorFn) => {
    if (required && isContentEmpty(value)) {
      return addError(field, "Can't be empty");
    }
  };
}
