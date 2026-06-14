import type * as React from "react";

import type { RichEditorHandlers } from "../RichEditor/useEditor";

export type FormStatus = "idle" | "uploading" | "validating" | "submitting";
export type FormValues = Record<string, unknown>;
export type FormErrors = Record<string, string>;
export type AddErrorFn = (field: string, message: string) => void;
export type FormValueUpdater<T> = T | ((currentValue: T) => T);
export type FieldValidation = (field: string, value: unknown, addError: AddErrorFn) => void;

export interface FormState<T extends FormValues = FormValues> {
  values: T;
  state: FormStatus;
  errors: FormErrors;
  hasErrors: boolean;
  hasCancel: boolean;
  lastSubmitSucceededAt?: number;
  actions: {
    clearErrors: () => void;
    submit: (attrs?: unknown) => Promise<void>;
    cancel: () => Promise<void>;
    reset: () => void;
    addValidation: (field: string, validation: FieldValidation) => void;
    removeValidation: (field: string, validation: FieldValidation) => void;
    getValue: <TValue = unknown>(field: string) => TValue | undefined;
    setValue: <TValue = unknown>(field: string, value: FormValueUpdater<TValue>) => void;
    setState: (state: FormStatus) => void;
  };
}

export interface UseFormOptions<T extends FormValues> {
  fields: T;
  validate?: (addError: AddErrorFn) => void;
  submit: (attrs?: unknown) => Promise<void> | void;
  cancel?: () => Promise<void> | void;
  onChange?: (args: { newValues: T; field: string | null }) => void;
}

export interface FormProps<T extends FormValues = FormValues> {
  form: FormState<T>;
  testId?: string;
  children: React.ReactNode;
}

export interface FieldGroupProps {
  layout?: "vertical";
  children: React.ReactNode;
}

export interface InputFieldProps {
  field: string;
  children: React.ReactNode;
  label?: string | React.ReactNode;
  required?: boolean;
  hidden?: boolean;
  error?: string;
}

export interface TextInputProps {
  field: string;
  label?: string;
  testId?: string;
  autoFocus?: boolean;
  required?: boolean;
  placeholder?: string;
}

export interface SubmitProps {
  saveText?: string;
  cancelText?: string;
}

export interface RichTextAreaProps {
  field: string;
  richTextHandlers: RichEditorHandlers;
  label?: string;
  placeholder?: string;
  required?: boolean;
  height?: string;
}
