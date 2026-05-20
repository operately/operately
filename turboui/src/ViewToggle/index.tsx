import React from "react";

import { DivLink } from "../Link";
import classNames from "../utils/classnames";

interface BaseOption<Value extends string> {
  value: Value;
  label: string;
  icon?: React.ReactNode;
  testId?: string;
}

interface LinkOption<Value extends string> extends BaseOption<Value> {
  to: string;
}

interface ButtonOption<Value extends string> extends BaseOption<Value> {
  onSelect: (value: Value) => void;
}

export type ViewToggleOption<Value extends string> = LinkOption<Value> | ButtonOption<Value>;

export interface ViewToggleProps<Value extends string> {
  value: Value;
  options: ViewToggleOption<Value>[];
  ariaLabel: string;
  className?: string;
}

export function ViewToggle<Value extends string>({ value, options, ariaLabel, className }: ViewToggleProps<Value>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={classNames(
        "inline-flex items-center gap-0.5 rounded-lg border border-surface-outline bg-surface-dimmed p-0.5 shadow-inner shadow-black/[0.03]",
        "dark:border-gray-700 dark:bg-gray-900/70 dark:shadow-none",
        className,
      )}
    >
      {options.map((option) => (
        <ViewToggleItem key={option.value} option={option} active={option.value === value} />
      ))}
    </div>
  );
}

function ViewToggleItem<Value extends string>({ option, active }: { option: ViewToggleOption<Value>; active: boolean }) {
  const className = classNames(
    "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold leading-none transition",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-base focus-visible:ring-offset-1",
    active
      ? "bg-surface-base text-content-accent shadow-sm ring-1 ring-black/5 dark:bg-gray-800 dark:text-gray-50 dark:ring-white/10"
      : "text-content-dimmed hover:bg-surface-base/70 hover:text-content-base dark:hover:bg-gray-800/80 dark:hover:text-gray-100",
  );

  const content = (
    <>
      {option.icon && <span className="flex size-3.5 items-center justify-center">{option.icon}</span>}
      <span>{option.label}</span>
    </>
  );

  if ("to" in option) {
    return (
      <DivLink
        to={option.to}
        className={className}
        testId={option.testId}
        aria-current={active ? "page" : undefined}
      >
        {content}
      </DivLink>
    );
  }

  return (
    <button
      type="button"
      className={className}
      data-test-id={option.testId}
      aria-pressed={active}
      onClick={() => option.onSelect(option.value)}
    >
      {content}
    </button>
  );
}
