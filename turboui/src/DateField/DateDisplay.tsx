import React from "react";
import { getDateWithoutCurrentYear } from "./utils";
import { DateField } from ".";

/**
 * DateDisplay renders a contextual date in the same format as DateField,
 * but without wrapper elements or styling. Useful for inline text where
 * DateField would break the line and cause feature test issues.
 */
export namespace DateDisplay {
  export interface Props {
    date: DateField.ContextualDate | null;
    placeholder?: string;
  }
}

export function DateDisplay({ date, placeholder = "Date" }: DateDisplay.Props) {
  const displayText = date ? getDateWithoutCurrentYear(date) : placeholder;
  
  return <>{displayText}</>;
}
