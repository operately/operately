import React from "react";

interface DatePickerOptionButtonProps {
  children: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
  ref?: React.Ref<HTMLButtonElement>;
}

export const OptionButton = React.forwardRef<HTMLButtonElement, DatePickerOptionButtonProps>(
  ({ children, isSelected, onClick, className = "" }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        className={`
          rounded text-center transition-colors
          ${isSelected ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-50 hover:text-blue-500"}
          ${className}
        `}
      >
        {children}
      </button>
    );
  },
);
