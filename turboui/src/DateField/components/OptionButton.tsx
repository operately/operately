import React from "react";

interface DatePickerOptionButtonProps {
  children: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
  ref?: React.Ref<HTMLButtonElement>;
  isCurrent?: boolean;
  isDisabled?: boolean;
}

export const OptionButton = React.forwardRef<HTMLButtonElement, DatePickerOptionButtonProps>(
  ({ children, isSelected, onClick, className = "", isCurrent = false, isDisabled = false }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        disabled={isDisabled}
        className={`
          rounded text-center transition-colors
          ${
            isDisabled
              ? "opacity-50 cursor-not-allowed line-through text-gray-400"
              : isSelected
              ? "bg-blue-50 text-blue-700 font-medium"
              : isCurrent
              ? "border border-blue-300 text-blue-600 hover:bg-blue-50"
              : "hover:bg-gray-50 hover:text-blue-500"
          }
          ${className}
        `}
      >
        {children}
      </button>
    );
  },
);
