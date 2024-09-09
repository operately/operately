import { Dispatch, SetStateAction } from "react";

export type State = "idle" | "validating" | "submitting";
export type MapOfFields = Record<string, Field<any>>;

export interface FormState<FieldTypes extends MapOfFields> {
  fields: FieldTypes;
  state: State;
  errors: ErrorMap<FieldTypes>;
  setState: (state: State) => void;
  setErrors: (errors: ErrorMap<FieldTypes>) => void;
  hasCancel: boolean;
  actions: {
    clearErrors: () => void;
    validate: () => boolean;
    submit: (form: FormState<FieldTypes>) => Promise<void>;
    cancel: (form: FormState<FieldTypes>) => Promise<void>;
    reset: () => void;
  };
}

export type Field<T> = {
  value: T | null | undefined;
  setValue: Dispatch<SetStateAction<T | undefined>>;
  initial?: T | null | undefined;
  optional?: boolean;
  validate: () => string | null;
};

export type ErrorMap<Fields extends MapOfFields> = {
  [K in keyof Fields]?: string;
};
