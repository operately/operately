import * as React from "react";

import { FieldObject } from "./useForm/field";
import { ErrorMap, AddErrorFn, ValidationFn } from "./useForm/errors";
import { useFieldValues, OnChangeFn } from "./useForm/values";
import { useFormState } from "./useForm/state";
import { useValidations, runValidations } from "./useForm/validations";
import { State } from "./useForm/state";

interface FormProps<T extends FieldObject> {
  fields: T;
  validate?: (addError: AddErrorFn) => void;
  submit: () => Promise<void> | void;
  cancel?: () => Promise<void> | void;
  onChange?: OnChangeFn<T>;
}

export interface FormState<T extends FieldObject> {
  values: T;
  state: State;
  errors: ErrorMap;
  hasCancel: boolean;
  actions: {
    clearErrors: () => void;
    submit: () => void | Promise<void>;
    cancel: () => void | Promise<void>;
    reset: () => void;
    addValidation: (field: string, validation: ValidationFn) => void;
    removeValidation: (field: string, validation: ValidationFn) => void;
    getValue: (key: string) => any;
    setValue: (key: string, value: any) => void;
    setState: (state: State) => void;
  };
}

export function useForm<T extends FieldObject>(props: FormProps<T>): FormState<T> {
  const hasCancel = !!props.cancel;

  const [errors, setErrors] = React.useState<ErrorMap>({});
  const clearErrors = () => setErrors({});

  const { state, setState } = useFormState();
  const { values, getValue, setValue, resetValues } = useFieldValues<T>(props.fields, props.onChange);
  const { validations, addValidation, removeValidation } = useValidations();

  const form = {
    values,
    state,
    errors,
    hasCancel,
    actions: {
      clearErrors,
      addValidation,
      removeValidation,
      getValue,
      setValue,
      submit: async () => {
        if (state !== "idle") return;

        setState("validating");

        const errors = runValidations(form, validations, props.validate);
        if (Object.keys(errors).length > 0) {
          console.log("Values", values);
          console.log("Errors", errors);
          setErrors(errors);
          setState("idle");
          return;
        }

        setState("submitting");
        await props.submit();

        setState("idle");
        form.actions.reset();
      },
      cancel: async () => {
        if (!props.cancel) return;
        form.actions.reset();
        await props.cancel();
      },
      reset: () => {
        form.actions.clearErrors();
        resetValues();
      },
      setState,
    },
  };

  return form;
}
