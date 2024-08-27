import { Dispatch, SetStateAction } from "react";

type State = "idle" | "submitting";

export type MapOfFields = Record<string, Field<any>>;

export interface FormState<FieldTypes extends MapOfFields> {
  fields: FieldTypes;
  state: State;
  errors: ErrorMap<FieldTypes>;
  setState: (state: State) => void;
  setErrors: (errors: ErrorMap<FieldTypes>) => void;
  clearErrors: () => void;
  submit: (form: FormState<FieldTypes>) => Promise<void>;
  validate: () => boolean;
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
