import * as React from "react";

import { DateField } from "../DateField";
import { createTestId } from "../TestableElement";
import { toDateWithoutTime } from "../utils/time";
import { InputField } from "./FieldGroup";
import { useFieldError, useFieldValue } from "./context";
import type { DateInputProps } from "./types";
import { useValidation, validatePresence } from "./validation";

export function DateInput({ field, label, testId, hidden, required, requiredMessage }: DateInputProps) {
  const [value, setValue] = useFieldValue<string>(field);
  const error = useFieldError(field);

  useValidation(field, validatePresence(required, requiredMessage));

  return (
    <InputField field={field} label={label} error={error} hidden={hidden} required={required}>
      <DateField
        id={field}
        date={isoDateToContextualDate(value)}
        onDateSelect={(date) => setValue(date ? toDateWithoutTime(date.date) : "")}
        variant="form-input"
        calendarOnly
        placeholder="Select a date"
        testId={testId ?? createTestId(field)}
        error={!!error}
        ariaLabel={label}
        ariaDescribedBy={error ? `${field}-error` : undefined}
        ariaRequired={required}
      />
    </InputField>
  );
}

function isoDateToContextualDate(value: string | undefined): DateField.ContextualDate | null {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;

  return {
    date,
    dateType: "day",
    value: new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(date),
  };
}
