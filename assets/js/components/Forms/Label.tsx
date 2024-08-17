import * as React from "react";

export function Label({ field, label }: { field: string; label: string }) {
  return (
    <label className="font-bold block" htmlFor={field}>
      {label}
    </label>
  );
}
