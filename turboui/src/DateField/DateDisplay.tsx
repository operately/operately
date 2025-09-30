import React from "react";
import { getDateWithoutCurrentYear } from "./utils";

/**
 * DateDisplay renders a contextual date in the same format as DateField,
 * but without wrapper elements or styling. Useful for inline text where
 * DateField would break the line and cause feature test issues.
 */
export namespace DateDisplay {
  export interface Props {
    date: ContextualDate | null;
    placeholder?: string;
  }

  export type DateType = "day" | "month" | "quarter" | "year";

  export interface ContextualDate {
    date: Date;
    dateType: DateType;
    value: string;
  }
}

export function DateDisplay({ date, placeholder = "Date" }: DateDisplay.Props) {
  const displayText = date ? getDateWithoutCurrentYear(date) : placeholder;
  
  return <>{displayText}</>;
}
