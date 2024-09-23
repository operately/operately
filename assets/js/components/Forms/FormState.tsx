import { Dispatch, SetStateAction } from "react";

export type State = "idle" | "validating" | "submitting";
export type AddErrorFn = (field: string, message: string) => void;

export interface KeyValueMap {
  [key: string]: Field;
}

export interface FormState<T extends KeyValueMap> {
  fields: T;
  state: State;
  errors: ErrorMap;
  hasCancel: boolean;
  actions: {
    clearErrors: () => void;
    validate: () => boolean;
    submit: (form: FormState<T>) => Promise<void>;
    cancel: (form: FormState<T>) => Promise<void>;
    reset: () => void;
  };
}

export type Field = {
  fieldName?: string;
  type: string;

  setFieldName: (name: string) => void;
  validate: (addError: AddErrorFn) => void;
  reset: () => void;
};

export type ValueField<T> = Field & {
  value: T | null | undefined;
  setValue: Dispatch<SetStateAction<T | undefined>>;
  initial?: T | null | undefined;
  optional?: boolean;
};

export type ErrorMap = Record<string, string>;
