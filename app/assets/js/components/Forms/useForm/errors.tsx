import { FieldValue } from "./field";

export type ErrorMap = Record<string, string>;
export type AddErrorFn = (field: string, message: string) => void;
export type ValidationFn = (field: string, value: FieldValue, addError: AddErrorFn) => void;
