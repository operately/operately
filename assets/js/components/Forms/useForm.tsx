import * as React from "react";

import { State } from "./FormState";
import { ValidationFn } from "./validations/hook";

type AddErrorFn = (field: string, message: string) => void;
export type FieldValue = number | string | boolean | null | undefined | FieldObject | FieldObject[];

interface FieldObject {
  [key: string]: FieldValue;
}

interface FormProps<T extends FieldObject> {
  fields: T;
  validate?: (addError: AddErrorFn) => void;
  submit: (form: FormState<T>) => Promise<void> | void;
  cancel?: (form: FormState<T>) => Promise<void> | void;
}

export interface FormState<T extends FieldObject> {
  values: T;
  state: State;
  errors: ErrorMap;
  hasCancel: boolean;
  getField: <K extends keyof T>(key: K) => T[K];
  setField: <K extends keyof T>(key: K, value: T[K]) => void;
  actions: {
    clearErrors: () => void;
    validate: () => boolean;
    submit: () => void | Promise<void>;
    cancel: () => void | Promise<void>;
    reset: () => void;
    addValidation: (field: string, validation: ValidationFn) => void;
    removeValidation: (field: string, validation: ValidationFn) => void;
  };
}

export type ErrorMap = Record<string, string>;

export function useForm<T extends FieldObject>(props: FormProps<T>): FormState<T> {
  const [state, setState] = React.useState<State>("idle");
  const [values, setValues] = React.useState<T>(props.fields);
  const [errors, setErrors] = React.useState<ErrorMap>({});

  const clearErrors = () => setErrors({});

  const { validations, addValidation, removeValidation } = useValidations();

  const form = {
    values,
    state: state,
    errors,
    hasCancel: !!props.cancel,
    getField: <K extends keyof T>(key: K) => {
      return values[key];
    },
    setField: <K extends keyof T>(key: K, value: T[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }));
    },
    actions: {
      clearErrors,
      addValidation,
      removeValidation,

      submit: async () => {
        setState("validating");

        const errors = runValidations(form, validations);
        if (Object.keys(errors).length > 0) {
          setErrors(errors);
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
          setValues((prev) => {
            const value = prev[key];
            if (Array.isArray(value)) {
              return { ...prev, [key]: [] };
            } else {
              return { ...prev, [key]: "" };
            }
          });
        }
      },
    },
  };

  return form;
}

type ValidationFnMap = Record<string, ValidationFn[]>;

function useValidations() {
  const [validations, setValidations] = React.useState<ValidationFnMap>({});

  const addValidation = (field: string, validation: ValidationFn) => {
    setValidations((prev) => {
      if (prev[field]) {
        return { ...prev, [field]: [...prev[field]!, validation] };
      } else {
        return { ...prev, [field]: [validation] };
      }
    });
  };

  const removeValidation = (validation: ValidationFn) => {
    setValidations((prev) => {
      return Object.keys(prev).reduce((acc, key) => {
        const validations = prev[key]!.filter((v) => v !== validation);

        if (validations.length > 0) {
          return { ...acc, [key]: validations };
        } else {
          return acc;
        }
      }, {});
    });
  };

  return { validations, addValidation, removeValidation };
}

function runValidations<T extends FieldObject>(form: FormState<T>, validations: ValidationFnMap): ErrorMap {
  let errors: ErrorMap = {};

  let addError: AddErrorFn = (field, message) => {
    if (!errors[field]) {
      errors[field] = message;
    }
  };

  for (const key in validations) {
    const value = form.values[key];
    const fieldValidations = validations[key];

    if (!fieldValidations) continue;

    for (let i = 0; i < fieldValidations.length; i++) {
      fieldValidations[i]!(key, value, addError);

      if (errors[key]) break;
    }
  }

  return errors;
}
