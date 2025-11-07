import * as React from "react";

interface LabelProps {
  field?: string;
  label: string | React.ReactNode;
  icon?: React.ReactNode;
  required?: boolean;
}

export function Label({ field, label, icon, required }: LabelProps) {
  return (
    <label className="font-semibold flex items-center gap-2" htmlFor={field}>
      {icon}
      {label}
      {required && <span className="text-sm -ml-1 text-red-500">*</span>}
    </label>
  );
}
