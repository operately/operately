import * as React from "react";

import { FormState, MapOfFields, ErrorMap } from "./FormState";

interface UseFormProps<FieldTypes extends MapOfFields> {
  fields: FieldTypes;
  validate: (fields: FieldTypes, addError: (field: keyof FieldTypes, message: string) => void) => void;
  submit: (form: FormState<FieldTypes>) => Promise<void>;
}

export function useForm<FieldTypes extends MapOfFields>(props: UseFormProps<FieldTypes>): FormState<FieldTypes> {
  const [state, setState] = React.useState<"idle" | "submitting">("idle");
  const [errors, setErrors] = React.useState<ErrorMap<FieldTypes>>({});

  const clearErrors = () => setErrors({});

  const validate = (): boolean => {
    const newErrors: ErrorMap<FieldTypes> = {};

    props.validate(props.fields, (field, message) => {
      newErrors[field] = message;
    });

    for (const key in props.fields) {
      const field = props.fields[key]!;
      const error = field.validate();

      if (error) {
        newErrors[key] = error;
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  return {
    state: state,
    fields: props.fields,
    errors,
    setErrors,
    clearErrors,
    validate,
    setState,
    submit: props.submit,
  };
}
