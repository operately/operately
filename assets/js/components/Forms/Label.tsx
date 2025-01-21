import * as React from "react";

interface LabelProps {
  field: string;
  label: string | React.ReactNode;
  icon?: React.ReactNode;
}

export function Label({ field, label, icon }: LabelProps) {
  return (
    <label className="font-semibold flex items-center gap-2" htmlFor={field}>
      {icon}
      {label}
    </label>
  );
}
