import * as React from "react";

import type { FieldGroupProps, InputFieldProps } from "./types";

export function FieldGroup({ children }: FieldGroupProps) {
  return <div className="flex flex-col gap-4">{children}</div>;
}

export function InputField({ field, label, required, hidden, error, children }: InputFieldProps) {
  if (hidden) {
    return null;
  }

  return (
    <div className="flex flex-col gap-0.5">
      {label ? (
        <label className="flex items-center gap-2 font-semibold" htmlFor={field}>
          {label}
          {required && <span className="text-xs text-red-500">*</span>}
        </label>
      ) : null}
      {children}
      {error ? <div className="block text-sm text-content-error">{error}</div> : null}
    </div>
  );
}
