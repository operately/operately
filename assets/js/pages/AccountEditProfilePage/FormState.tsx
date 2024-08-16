import * as React from "react";
import { Person } from "@/api";

type State = "idle" | "submitting";

export interface FormState {
  fields: any;
  state: State;
  errors: Record<string, string>;
  setState: (state: State) => void;
  setErrors: (errors: Record<string, string>) => void;
  clearErrors: () => void;
  submit: (form: FormState) => Promise<void>;
  validate: () => boolean;
}

export type Field = TextField | SelectField | SelectPersonField;

export type BaseField<T> = {
  value: T | null | undefined;
  setValue: (value: T | null | undefined) => void;
  initial: T | null | undefined;
  optional?: boolean;
  validate: () => string | null;
};

export type TextField = BaseField<string> & {
  type: "text";
};

export type SelectField = BaseField<string> & {
  type: "select";
  options: { value: string; label: string }[];
};

export type SelectPersonField = BaseField<Person> & {
  type: "select-person";
};

interface TextFieldConfig {
  optional?: boolean;
}

export function useTextField(initial: string | null | undefined, config?: TextFieldConfig): TextField {
  const [value, setValue] = React.useState(initial);

  const validate = (): string | null => {
    if (!value) return !config?.optional ? "Can't be empty" : null;

    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return !config?.optional ? "Can't be empty" : null;
    } else {
      return null;
    }
  };

  return { type: "text", initial, optional: config?.optional, value: value, setValue, validate };
}

interface SelectFieldConfig {
  optional?: boolean;
}

interface SelectFieldOption {
  value: string;
  label: string;
}

export function useSelectField(
  initial: string | null | undefined,
  options: SelectFieldOption[],
  config?: SelectFieldConfig,
): SelectField {
  const [value, setValue] = React.useState(initial);

  const validate = (): string | null => {
    if (!value) return !config?.optional ? "Can't be empty" : null;

    return null;
  };

  return { type: "select", initial, options, optional: config?.optional, value, setValue, validate };
}

interface SelectPersonFieldConfig {
  optional?: boolean;
}

export function useSelectPersonField(
  initial: Person | null | undefined,
  config?: SelectPersonFieldConfig,
): SelectPersonField {
  const [value, setValue] = React.useState(initial);

  const validate = (): string | null => {
    if (!value) return !config?.optional ? "is required" : null;

    return null;
  };

  return { type: "select-person", initial, optional: config?.optional, value, setValue, validate };
}
