import classNames from "classnames";
import React from "react";

export namespace Checkbox {
  export type Props = {
    label?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    size?: "sm" | "md" | "lg";
    testId?: string;
    className?: string;
  };
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

const checkIconSize = {
  sm: 12,
  md: 14,
  lg: 16,
};

export function Checkbox({ className, checked, onChange, disabled = false, size = "md", testId }: Checkbox.Props) {
  const handleChange = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!disabled) {
      onChange(!checked);
    }
  };

  const checkClasses = classNames(
    className,
    sizeClasses[size],
    "border border-surface-outline rounded flex items-center justify-center flex-shrink-0",
    {
      "hover:bg-surface-base transition-colors cursor-pointer": !disabled,
      "opacity-50": disabled,
    },
  );

  const checkWidth = checkIconSize[size];
  const checkHeight = checkIconSize[size];

  return (
    <button type="button" onClick={handleChange} className={checkClasses} disabled={disabled} data-test-id={testId}>
      {checked && (
        <svg width={checkWidth} height={checkHeight} viewBox="0 0 12 12" fill="none">
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
  );
}
