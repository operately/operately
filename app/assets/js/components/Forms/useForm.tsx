import * as React from "react";
import { AxiosError } from "axios";

import { FieldObject } from "./useForm/field";
import { ErrorMap, AddErrorFn, ValidationFn } from "./useForm/errors";
import { useFieldValues, OnChangeFn } from "./useForm/values";
import { useFormState } from "./useForm/state";
import { useSubmitTrigger } from "./useForm/trigger";
import { useValidations, runValidations } from "./useForm/validations";
import { State } from "./useForm/state";

interface FormProps<T extends FieldObject> {
  fields: T;
  validate?: (addError: AddErrorFn) => void;
  submit: (attrs?: any) => Promise<void> | void;
  cancel?: () => Promise<void> | void;
  onChange?: OnChangeFn<T>;
  onError?: (e: AxiosError) => void;
}

export interface FormState<T extends FieldObject> {
  values: T;
  state: State;
  trigger: string | undefined;
  errors: ErrorMap;
  hasErrors: boolean;
  hasCancel: boolean;
  actions: {
    clearErrors: () => void;
    addErrors: (errors: ErrorMap) => void;
    removeErrors: (keys: string[]) => void;
    submit: (attrs?: any) => void | Promise<void>;
    cancel: () => void | Promise<void>;
    reset: () => void;
    addValidation: (field: string, validation: ValidationFn) => void;
    removeValidation: (field: string, validation: ValidationFn) => void;
    getValue: (key: string) => any;
    setValue: (key: string, value: any) => void;
    setState: (state: State) => void;
    setTrigger: React.Dispatch<React.SetStateAction<string | undefined>>;
  };
}

export function useForm<T extends FieldObject>(props: FormProps<T>): FormState<T> {
  const hasCancel = !!props.cancel;

  const [errors, setErrors] = React.useState<ErrorMap>({});
  const clearErrors = () => setErrors({});
  const hasErrors = Object.keys(errors).length > 0;

  const { state, setState } = useFormState();
  const { trigger, setTrigger } = useSubmitTrigger();
  const { values, getValue, setValue, resetValues } = useFieldValues<T>(props.fields, props.onChange);
  const { validations, addValidation, removeValidation } = useValidations();

  const form = {
    values,
    state,
    trigger,
    errors,
    hasErrors,
    hasCancel,
    actions: {
      clearErrors,
      addErrors: (errors: ErrorMap) => setErrors((prev) => ({ ...errors, ...prev })),
      removeErrors: (keys: string[]) => {
        const updatedErrors = { ...errors };
        keys.forEach((key) => {
          if (updatedErrors[key]) {
            delete updatedErrors[key];
          }
        });

        setErrors(updatedErrors);
      },
      addValidation,
      removeValidation,
      getValue,
      setValue,
      submit: async (attrs: any) => {
        try {
          if (state !== "idle") return;

          setState("validating");

          const errors = runValidations(form, validations, props.validate);
          if (Object.keys(errors).length > 0) {
            setErrors(errors);
            setState("idle");
            return;
          }

          setState("submitting");
          await props.submit(attrs);
          form.actions.clearErrors();

          setState("idle");
        } catch (e) {
          console.error(e);
          if (props.onError) props.onError(e);

          setState("idle");
        }
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
      setTrigger,
    },
  };

  return form;
}
