import * as React from "react";

import { State } from "./FormState";
import { FormContext } from "./FormContext";

type AddErrorFn = (field: string, message: string) => void;
type FieldValue = number | string | boolean | null | undefined | FieldObject | FieldObject[];

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
    addValidation: (validation: (addError: AddErrorFn) => void) => void;
    removeValidation: (validation: (addError: AddErrorFn) => void) => void;
  };
}

export type ErrorMap = Record<string, string>;

type ValidationFn = (addError: AddErrorFn) => void;

export function useForm<T extends FieldObject>(props: FormProps<T>): FormState<T> {
  const [state, setState] = React.useState<State>("idle");
  const [values, setValues] = React.useState<T>(props.fields);
  const [validations, setValidations] = React.useState<ValidationFn[]>([] as ValidationFn[]);
  const [errors, setErrors] = React.useState<ErrorMap>({});

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
      // clearErrors: clearErrors,
      addValidation: (validation: ValidationFn) => {
        setValidations((prev) => [...prev, validation]);
      },
      removeValidation: (validation: ValidationFn) => {
        setValidations((prev) => prev.filter((v) => v !== validation));
      },
      submit: async () => {
        setState("validating");

        const errors: ErrorMap = {};
        const addError: AddErrorFn = (field: string, message: string) => {
          errors[field] = message;
        };

        validations.forEach((validation) => {
          validation(addError);
        });

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

// function createFormValidator<T extends FieldObject>(props: FormProps<T>): [ErrorMap, () => boolean, () => void] {
//   const [errors, setErrors] = React.useState<ErrorMap>({});
//   const clearErrors = () => setErrors({});

//   const validate = (): boolean => {
//     const newErrors: ErrorMap = {};
//     const addError: AddErrorFn = (field: string, message: string) => {
//       newErrors[field] = message;
//     };

//     if (props.validate) props.validate(addError);

//     for (const key in props.fields) {
//       props.fields[key]!.validate(addError);
//     }

//     setErrors(newErrors);

//     return Object.keys(newErrors).length === 0;
//   };

//   return [errors, validate, clearErrors];
// }

export function useValidation(field: string, fn: (addError: AddErrorFn) => void) {
  const form = React.useContext(FormContext);
  const value = form!.getField(field);

  React.useEffect(() => {
    if (!form) return;
    form.actions.addValidation(fn);

    return () => {
      form.actions.removeValidation(fn);
    };
  }, [value]);
}
