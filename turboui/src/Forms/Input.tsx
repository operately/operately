import React from "react";

import classNames from "../utils/classnames";
import { IconCheck } from "../icons";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  field?: string;
  testId?: string;
  error?: boolean;
  onEnter?: (event: React.KeyboardEvent) => void;
  okSign?: boolean;
  className?: string;
}

export function Input(props: InputProps) {
  const { field, testId, error, onEnter, okSign, className, ...rest } = props;

  return (
    <div className="relative w-full">
      <input
        {...rest}
        name={field}
        data-test-id={testId}
        className={inputStyles(error, className)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && onEnter) {
            onEnter(event);
          }
        }}
        autoFocus={props.autoFocus}
        data-autofocus={props.autoFocus ? true : undefined}
      />

      {!error && okSign ? (
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-accent-1">
          <IconCheck size={20} />
        </div>
      ) : null}
    </div>
  );
}

function inputStyles(error: boolean | undefined, className?: string) {
  return classNames(
    "w-full bg-surface-base text-content-accent placeholder-content-subtle border rounded-lg px-3 py-1.5",
    error ? "border-red-500" : "border-surface-outline",
    className,
  );
}
