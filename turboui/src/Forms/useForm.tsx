import * as React from "react";
import type { AxiosError } from "axios";

import { cloneFormValue, getValueAtPath, setValueAtPath } from "./path";
import type {
  AddErrorFn,
  FieldValidation,
  FormErrors,
  FormState,
  FormValues,
  UseFormOptions,
} from "./types";

type ValidationMap = Record<string, FieldValidation[]>;

export function useForm<T extends FormValues>(options: UseFormOptions<T>): FormState<T> {
  const validations = React.useRef<ValidationMap>({});
  const initialValuesRef = React.useRef<T>(cloneFormValue(options.fields));
  const [values, setValues] = React.useState<T>(() => {
    const initialValues = cloneFormValue(options.fields);

    options.onChange?.({ newValues: initialValues, field: null });

    return initialValues;
  });
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [state, setState] = React.useState<FormState<T>["state"]>("idle");
  const [trigger, setTrigger] = React.useState<string | undefined>(undefined);
  const [lastSubmitSucceededAt, setLastSubmitSucceededAt] = React.useState<number | undefined>(undefined);

  const clearErrors = React.useCallback(() => {
    setErrors({});
  }, []);

  const addErrors = React.useCallback((nextErrors: FormErrors) => {
    setErrors((currentErrors) => ({ ...nextErrors, ...currentErrors }));
  }, []);

  const removeErrors = React.useCallback((keys: string[]) => {
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };

      keys.forEach((key) => {
        delete nextErrors[key];
      });

      return nextErrors;
    });
  }, []);

  const addValidation = React.useCallback((field: string, validation: FieldValidation) => {
    const currentValidations = validations.current[field] ?? [];

    if (currentValidations.includes(validation)) {
      return;
    }

    validations.current[field] = [...currentValidations, validation];
  }, []);

  const removeValidation = React.useCallback((field: string, validation: FieldValidation) => {
    const currentValidations = validations.current[field] ?? [];
    const nextValidations = currentValidations.filter((currentValidation) => currentValidation !== validation);

    if (nextValidations.length === 0) {
      delete validations.current[field];
      return;
    }

    validations.current[field] = nextValidations;
  }, []);

  const getValue = React.useCallback(
    <TValue = unknown,>(field: string) => {
      return getValueAtPath<TValue>(values, field);
    },
    [values],
  );

  const setValue = React.useCallback(
    <TValue = unknown,>(field: string, nextValue: TValue | ((currentValue: TValue | undefined) => TValue)) => {
      setValues((currentValues) => {
        const nextValues = setValueAtPath(currentValues, field, nextValue) as T;

        options.onChange?.({ newValues: nextValues, field });

        return nextValues;
      });
    },
    [options],
  );

  const reset = React.useCallback(() => {
    clearErrors();
    setState("idle");
    setValues(cloneFormValue(initialValuesRef.current));
  }, [clearErrors]);

  const cancel = React.useCallback(async () => {
    if (!options.cancel) {
      return;
    }

    reset();
    await options.cancel();
  }, [options, reset]);

  const runValidations = React.useCallback(() => {
    const nextErrors: FormErrors = {};
    const addError: AddErrorFn = (field, message) => {
      if (!nextErrors[field]) {
        nextErrors[field] = message;
      }
    };

    for (const [field, fieldValidations] of Object.entries(validations.current)) {
      const value = getValue(field);

      for (const validation of fieldValidations) {
        validation(field, value, addError);

        if (nextErrors[field]) {
          break;
        }
      }
    }

    options.validate?.(addError);

    return nextErrors;
  }, [getValue, options]);

  const submit = React.useCallback(
    async (attrs?: unknown) => {
      if (state !== "idle") {
        return;
      }

      setState("validating");
      const nextErrors = runValidations();

      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        setState("idle");
        return;
      }

      clearErrors();
      setState("submitting");

      try {
        await options.submit(attrs);
        clearErrors();
        setLastSubmitSucceededAt(Date.now());
      } catch (error) {
        console.error(error);
        options.onError?.(error as AxiosError);
      } finally {
        setState("idle");
      }
    },
    [clearErrors, options, runValidations, state],
  );

  return {
    values,
    state,
    trigger,
    errors,
    hasErrors: Object.keys(errors).length > 0,
    hasCancel: Boolean(options.cancel),
    lastSubmitSucceededAt,
    actions: {
      clearErrors,
      addErrors,
      removeErrors,
      submit,
      cancel,
      reset,
      addValidation,
      removeValidation,
      getValue,
      setValue,
      setState,
      setTrigger,
    },
  };
}
