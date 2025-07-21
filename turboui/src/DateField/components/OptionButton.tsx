import React from "react";

interface DatePickerOptionButtonProps {
  children: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
  ref?: React.Ref<HTMLButtonElement>;
  isCurrent?: boolean;
}

export const OptionButton = React.forwardRef<HTMLButtonElement, DatePickerOptionButtonProps>(
  ({ children, isSelected, onClick, className = "", isCurrent = false }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        className={`
          rounded text-center transition-colors
          ${
            isSelected
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
