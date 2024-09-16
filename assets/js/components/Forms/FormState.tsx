import { Dispatch, SetStateAction } from "react";
import { FieldSet } from "./useFieldSet";

export type State = "idle" | "validating" | "submitting";

export interface KeyValueMap {
  [key: string]: Field<any> | FieldSet<any>;
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

export type Field<T> = {
  type: string;
  value: T | null | undefined;
  setValue: Dispatch<SetStateAction<T | undefined>>;
  initial?: T | null | undefined;
  optional?: boolean;
  validate: () => string | null;
  reset: () => void;
};

export type ErrorMap = Record<string, string>;
