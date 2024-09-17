import React from "react";

import { ErrorMessage } from "../ErrorMessage";
import { Label } from "../Label";
import { useLayoutOptions } from "./Context";
import { InputFieldProps } from "../FieldGroup";

export interface Options {
  columns: number;
}

const DEFAULT_OPTIONS: Options = {
  columns: 2,
};

export function initializeOptions(options: Partial<Options>): Options {
  return { ...DEFAULT_OPTIONS, ...options };
}

export function Container({ children }: { children: React.ReactNode }) {
  const options = useLayoutOptions<Options>();

  const style = {
    gridTemplateColumns: `repeat(${options.columns}, 1fr)`,
  };

  return (
    <div className="grid grid-cols-2 gap-4" style={style}>
      {children}
    </div>
  );
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
