import React from "react";
import classNames from "classnames";

export namespace Checkbox {
  export type Props = {
    label?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    size?: "sm" | "md" | "lg";
    testId?: string;
  };
}

export function Checkbox({ label, checked, onChange, disabled = false, size = "md", testId }: Checkbox.Props) {
  const handleChange = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const checkboxClasses = classNames(
    "border border-surface-outline rounded flex items-center justify-center flex-shrink-0 transition-all duration-200",
    sizeClasses[size],
    {
      "cursor-pointer hover:border-brand-1": !disabled,
      "cursor-not-allowed opacity-50": disabled,
      "bg-brand-1 border-brand-1": checked && !disabled,
      "bg-surface-base": !checked && !disabled,
      "bg-surface-dimmed border-surface-outline": disabled,
    },
  );

  const checkIconSize = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <label className="flex items-start gap-2 cursor-pointer">
      <button
        type="button"
        onClick={handleChange}
        disabled={disabled}
        className={checkboxClasses}
        data-test-id={testId}
        aria-checked={checked}
        role="checkbox"
      >
        {checked && (
          <svg
            width={checkIconSize[size]}
            height={checkIconSize[size]}
            viewBox="0 0 12 12"
            fill="none"
            className="text-white"
          >
            <path
              d="M10 3L4.5 8.5L2 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      {label && (
        <div className="flex flex-col">
          <div className="text-content-base leading-none select-none">{label}</div>
        </div>
      )}
    </label>
  );
}
