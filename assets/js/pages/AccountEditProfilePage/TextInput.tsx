import * as React from "react";

import { getFormContext } from "./FormContext";
import { Label } from "./Label";
import { ErrorMessage } from "./ErrorMessage";

import classNames from "classnames";

export function TextInput({ field, label }: { field: string; label?: string }) {
  const form = getFormContext();
  const f = form.fields[field];

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    f.setValue(e.target.value);
  };

  const error = form.errors[field];

  const className = classNames({
    "w-full": true,
    "bg-surface text-content-accent placeholder-content-subtle": true,
    "border rounded-lg": true,
    "px-3 py-1.5": true,
    "border-surface-outline": !error,
    "border-red-500": error,
  });

  return (
    <div className="flex flex-col gap-0.5">
      {label ? <Label field={field} label={label} /> : null}
      <input name={field} className={className} type="text" value={f.value} onChange={onChange} />
      {error ? <ErrorMessage error={error} /> : null}
    </div>
  );
}
