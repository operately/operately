import type * as React from "react";

import type { BaseButtonProps } from "../Button";
import type { RichEditorHandlers } from "../RichEditor/useEditor";

export type FormStatus = "idle" | "uploading" | "validating" | "submitting";
export type FormValues = Record<string, unknown>;
export type FormErrors = Record<string, string>;
export type AddErrorFn = (field: string, message: string) => void;
export type FormValueUpdater<T> = T | ((currentValue: T | undefined) => T);
export type FieldValidation = (field: string, value: unknown, addError: AddErrorFn) => void;

export interface FormState<T extends FormValues = FormValues> {
  values: T;
  state: FormStatus;
  trigger?: string;
  errors: FormErrors;
  hasErrors: boolean;
  hasCancel: boolean;
  lastSubmitSucceededAt?: number;
  actions: {
    clearErrors: () => void;
    addErrors: (errors: FormErrors) => void;
    removeErrors: (keys: string[]) => void;
    submit: (attrs?: unknown) => Promise<void>;
    cancel: () => Promise<void>;
    reset: () => void;
    addValidation: (field: string, validation: FieldValidation) => void;
    removeValidation: (field: string, validation: FieldValidation) => void;
    getValue: <TValue = unknown>(field: string) => TValue | undefined;
    setValue: <TValue = unknown>(field: string, value: FormValueUpdater<TValue>) => void;
    setState: (state: FormStatus) => void;
    setTrigger: React.Dispatch<React.SetStateAction<string | undefined>>;
  };
}

export interface UseFormOptions<T extends FormValues> {
  fields: T;
  validate?: (addError: AddErrorFn) => void;
  submit: (attrs?: unknown) => Promise<void> | void;
  cancel?: () => Promise<void> | void;
  onChange?: (args: { newValues: T; field: string | null }) => void;
  onError?: (error: any) => void;
}

export interface FormProps<T extends FormValues = FormValues> {
  form: FormState<T>;
  testId?: string;
  children: React.ReactNode;
  preventSubmitOnEnter?: boolean;
}

export interface FieldGroupProps {
  layout?: FieldGroupLayoutType;
  layoutOptions?: FieldGroupLayoutOptions;
  children: React.ReactNode;
}

export type FieldGroupLayoutType = "horizontal" | "vertical" | "grid";

export interface FieldGroupVerticalOptions {}

export interface FieldGroupHorizontalOptions {
  ratio: "1:1" | "1:2" | "1:3" | "1:4" | "1:5" | "2:1" | "3:1" | "4:1" | "5:1";
  dividers: boolean;
}

export interface FieldGroupGridOptions {
  columns: number;
  gridTemplateColumns?: string;
}

export type FieldGroupLayoutOptions =
  | FieldGroupHorizontalOptions
  | FieldGroupVerticalOptions
  | FieldGroupGridOptions;

export interface InputFieldProps {
  field: string;
  children: React.ReactNode;
  label?: string | React.ReactNode;
  labelIcon?: React.ReactNode;
  required?: boolean;
  hidden?: boolean;
  error?: string;
}

export interface TextInputProps {
  field: string;
  label?: string;
  testId?: string;
  autoFocus?: boolean;
  hidden?: boolean;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
  onEnter?: (event: React.KeyboardEvent) => void;
  okSign?: boolean;
}

export interface SubmitProps {
  saveText?: string;
  cancelText?: string;
  layout?: "left" | "centered";
  buttonSize?: BaseButtonProps["size"];
  submitOnEnter?: boolean;
  className?: string;
  containerClassName?: string;
  testId?: string;
}

export interface SubmitButtonProps {
  name: string;
  text: string;
  onClick: (attrs: unknown) => void;
  buttonSize?: BaseButtonProps["size"];
  primary?: boolean;
  className?: string;
}

export interface SelectBoxOption {
  label: string;
  value: string | number;
}

export interface SelectBoxProps {
  field: string;
  label?: string;
  labelIcon?: React.ReactNode;
  hidden?: boolean;
  placeholder?: string;
  options: SelectBoxOption[];
  required?: boolean;
}

export interface RichTextAreaProps {
  field: string;
  richTextHandlers: RichEditorHandlers;
  label?: string;
  hidden?: boolean;
  placeholder?: string;
  hideBorder?: boolean;
  required?: boolean;
  height?: string;
  horizontalPadding?: string;
  verticalPadding?: string;
  fontSize?: string;
  fontWeight?: string;
  showToolbarTopBorder?: boolean;
  readonly?: boolean;
  hideToolbar?: boolean;
}

export interface PasswordInputProps {
  field: string;
  label?: string | React.ReactNode;
  required?: boolean;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  noAutofill?: boolean;
  okSign?: boolean;
  testId?: string;
}

export interface NumberInputProps {
  field: string;
  label?: string;
  autoFocus?: boolean;
  placeholder?: string;
  hidden?: boolean;
  required?: boolean;
  onEnter?: (event: React.KeyboardEvent) => void;
  testId?: string;
  okSign?: boolean;
}

export interface FormOption {
  value: string;
  label: string;
}

export interface CheckboxInputProps {
  field: string;
  label?: string;
  hidden?: boolean;
  options: FormOption[];
}

export interface RadioButtonsProps {
  field: string;
  label?: string;
  hidden?: boolean;
  options: FormOption[];
  containerClass?: string;
}

export interface TitleInputProps {
  field: string;
  autoFocus?: boolean;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  testId?: string;
  readonly?: boolean;
  errorMessage?: string;
  fontBold?: boolean;
}

export interface FormErrorProps {
  message?: string;
  when?: boolean;
  className?: string;
}

export interface AccessSelectorsProps {
  fieldPrefix?: string;
  showSpaceAccess?: boolean;
  noAccessValue?: number;
}
