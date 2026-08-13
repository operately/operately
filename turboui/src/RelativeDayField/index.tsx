import React from "react";
import { IconCalendar } from "../icons";
import { createTestId } from "../TestableElement";
import classNames from "../utils/classnames";

const INVALID_VALUE_MESSAGE = "Enter zero or a positive number of days.";

export namespace RelativeDayField {
  export interface Props {
    value: number | null;
    onChange?: (value: number | null) => void | Promise<void>;
    readonly?: boolean;
    variant?: "inline" | "form-field";
    placeholder?: string;
    label?: string;
    testId?: string;
    className?: string;
  }
}

export function formatRelativeDay(value: number | null, placeholder = "Set relative date") {
  if (value === null) return placeholder;
  if (value === 0) return "On the project start date";
  if (value === 1) return "1 day after project starts";
  return `${value} days after project starts`;
}

export function RelativeDayField({
  value,
  onChange,
  readonly = false,
  variant = "inline",
  placeholder = "Set relative date",
  label,
  testId = "relative-day-field",
  className,
}: RelativeDayField.Props) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value === null ? "" : String(value));
  const [error, setError] = React.useState<string | null>(null);
  const [editWidth, setEditWidth] = React.useState<number | undefined>();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!isEditing) setInputValue(value === null ? "" : String(value));
  }, [isEditing, value]);

  React.useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const cancel = () => {
    setInputValue(value === null ? "" : String(value));
    setError(null);
    setEditWidth(undefined);
    setIsEditing(false);
  };

  const save = async () => {
    const trimmedValue = inputValue.trim();
    const nextValue = trimmedValue === "" ? null : Number(trimmedValue);

    if (nextValue !== null && (!Number.isInteger(nextValue) || nextValue < 0)) {
      setError(INVALID_VALUE_MESSAGE);
      return;
    }

    setError(null);
    setEditWidth(undefined);
    setIsEditing(false);
    if (nextValue !== value) await onChange?.(nextValue);
  };

  const startEditing = () => {
    if (readonly || !onChange) return;
    setEditWidth(triggerRef.current?.offsetWidth);
    setError(null);
    setIsEditing(true);
  };

  const isFormField = variant === "form-field";

  const shellClassName = classNames(
    "items-center gap-1.5 text-left text-sm",
    isFormField
      ? classNames(
          "flex w-full rounded-lg border bg-surface-base px-2 py-1.5",
          error ? "border-red-500" : "border-surface-outline",
          isEditing && !error && "focus-within:outline focus-within:outline-indigo-600",
        )
      : classNames(
          "inline-flex rounded border border-transparent px-1 py-0.5",
          isEditing ? "bg-surface-dimmed" : !readonly && onChange && "hover:bg-surface-highlight",
        ),
  );

  const shellStyle = !isFormField && isEditing && editWidth ? { width: editWidth } : undefined;

  return (
    <div
      className={classNames(className, isFormField ? "block" : "inline-flex flex-col items-start")}
      data-test-id={testId}
    >
      {label && <label className="mb-1 block text-sm font-bold">{label}</label>}
      {isEditing ? (
        <div className={shellClassName} style={shellStyle}>
          <IconCalendar size={16} className="shrink-0 text-content-dimmed" />
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={inputValue}
            aria-label={label || placeholder}
            data-test-id={createTestId(testId, "input")}
            onChange={(event) => setInputValue(event.target.value)}
            onBlur={() => void save()}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void save();
              } else if (event.key === "Escape") {
                event.preventDefault();
                cancel();
              }
            }}
            className="min-w-0 flex-1 border-none bg-transparent text-sm outline-none"
          />
          <span className="shrink-0 text-sm text-content-dimmed">days</span>
        </div>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          onClick={startEditing}
          disabled={readonly || !onChange}
          className={classNames(
            shellClassName,
            value === null ? "text-content-dimmed" : "text-content-base",
            (readonly || !onChange) && "cursor-default",
          )}
        >
          <IconCalendar size={16} className="shrink-0 text-content-dimmed" />
          <span className="truncate">{formatRelativeDay(value, placeholder)}</span>
        </button>
      )}
      {error && <div className="mt-1 text-xs text-red-500">{error}</div>}
    </div>
  );
}
