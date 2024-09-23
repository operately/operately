import * as React from "react";

import { FormState, State, KeyValueMap, ErrorMap } from "./FormState";

type AddErrorFn = (field: string, message: string) => void;

interface FormProps<T extends KeyValueMap> {
  fields: T;
  validate?: (addError: AddErrorFn) => void;
  submit: (form: FormState<T>) => Promise<void> | void;
  cancel?: (form: FormState<T>) => Promise<void> | void;
}

export function useForm<T extends KeyValueMap>(props: FormProps<T>): FormState<T> {
  const [state, setState] = React.useState<State>("idle");
  const [errors, validate, clearErrors] = createFormValidator(props);

  for (const key in props.fields) {
    props.fields[key]!.setFieldName(key);
  }

  const form = {
    fields: props.fields,
    state: state,
    errors,
    hasCancel: !!props.cancel,
    actions: {
      clearErrors: clearErrors,
      validate: validate,
      submit: async () => {
        setState("validating");
        if (!form.actions.validate()) {
          setState("idle");
          return;
        }

        setState("submitting");
        await props.submit(form);
        setState("idle");

        form.actions.reset();
      },
      cancel: async () => {
        if (!props.cancel) return;

        form.actions.reset();
        await props.cancel(form);
      },
      reset: () => {
        form.actions.clearErrors();

        for (const key in props.fields) {
          props.fields[key]!.reset();
        }
      },
    },
  };

  return form;
}

function createFormValidator<T extends KeyValueMap>(props: FormProps<T>): [ErrorMap, () => boolean, () => void] {
  const [errors, setErrors] = React.useState<ErrorMap>({});
  const clearErrors = () => setErrors({});

  const validate = (): boolean => {
    const newErrors: ErrorMap = {};
    const addError: AddErrorFn = (field: string, message: string) => {
      newErrors[field] = message;
    };

    if (props.validate) props.validate(addError);

    for (const key in props.fields) {
      props.fields[key]!.validate(addError);
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  return [errors, validate, clearErrors];
}
