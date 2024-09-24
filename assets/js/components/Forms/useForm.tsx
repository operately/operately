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
  submit: () => Promise<void> | void;
  cancel?: () => Promise<void> | void;
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
    getValue: <K extends keyof T>(key: K) => T[K];
    setValue: <K extends keyof T>(key: K, value: T[K]) => void;
  };
}

export type ErrorMap = Record<string, string>;

export function useForm<T extends FieldObject>(props: FormProps<T>): FormState<T> {
  const [state, setState] = React.useState<State>("idle");
  const [errors, setErrors] = React.useState<ErrorMap>({});

  const clearErrors = () => setErrors({});

  const { values, getValue, setValue } = useFieldValues<T>(props.fields);
  const { validations, addValidation, removeValidation } = useValidations();

  const form = {
    values,
    state,
    errors,
    hasCancel: !!props.cancel,
    actions: {
      clearErrors,
      addValidation,
      removeValidation,
      getValue,
      setValue,
      submit: async () => {
        setState("validating");

        const errors = runValidations(form, validations, props.validate);
        if (Object.keys(errors).length > 0) {
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

  const removeValidation = (field: string, validation: ValidationFn) => {
    setValidations((prev) => {
      if (!prev[field]) return prev;

      const newValidations = prev[field]!.filter((v) => v !== validation);

      if (newValidations.length === 0) {
        const { [field]: _, ...rest } = prev;
        return rest;
      } else {
        return { ...prev, [field]: newValidations };
      }
    });
  };

  return { validations, addValidation, removeValidation };
}

function runValidations<T extends FieldObject>(
  form: FormState<T>,
  validations: ValidationFnMap,
  formValidate?: (addError: AddErrorFn) => void,
): ErrorMap {
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

  if (formValidate) {
    formValidate(addError);
  }

  return errors;
}

function useFieldValues<T extends FieldObject>(fields: T) {
  const [values, setValues] = React.useState<T>(fields);

  const getValue = (key: string) => {
    const parts = key.split(".");

    return deepLookup(values, parts);
  };

  const setValue = (key: string, value: FieldValue) => {
    const parts = key.split(".");

    setValues((prev) => deepInsert(prev, parts, value));
  };

  return { values, getValue, setValue };
}

function deepLookup<T extends FieldObject, K extends keyof T>(obj: T, keys: string[]): T[K] {
  let value: any = obj;

  for (let i = 0; i < keys.length; i++) {
    if (Object.hasOwnProperty.call(value, keys[i]!)) {
      value = value[keys[i]!];
    } else {
      throw new Error(
        `Field ${keys.join(".")} does not exist. Did you forget to add it to the form? Existing fields are: ${Object.keys(obj).join(", ")}`,
      );
    }
  }

  return value;
}

function deepInsert<T extends FieldObject>(obj: T, keys: string[], value: FieldValue): T {
  let newObj: any = { ...obj };

  let current = newObj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!Object.hasOwnProperty.call(current, keys[i]!)) {
      current[keys[i]!] = {};
    }

    current = current[keys[i]!];
  }

  current[keys[keys.length - 1]!] = value;

  return newObj;
}
