import React from "react";

import { ErrorMessage } from "../ErrorMessage";
import { Label } from "../Label";
import { InputFieldProps } from "../FieldGroup";

export interface Options {}

const DEFAULT_OPTIONS: Options = {};

export function initializeOptions(options: Partial<Options>): Options {
  return { ...DEFAULT_OPTIONS, ...options };
}

export function Container({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-4">{children}</div>;
}

export function Input(props: InputFieldProps) {
  return (
    <div className="flex flex-col gap-0.5">
      {props.label ? <Label field={props.field} label={props.label} icon={props.labelIcon} /> : null}
      {props.children}
      {props.error ? <ErrorMessage error={props.error} /> : null}
    </div>
  );
}
