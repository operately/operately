import React from "react";
import classNames from "../utils/classnames";

export interface FloatingActionButtonProps {
  /**
   * Icon component to display in the button
   */
  icon: React.ReactNode;

  /**
   * Click handler
   */
  onClick: () => void;

  /**
   * Button label for accessibility and tooltip
   */
  label: string;

  /**
   * Optional text to display next to the icon
   */
  text?: string;

  /**
   * Visual style variant
   */
  variant?: "primary" | "secondary";

  /**
   * Size of the FAB
   */
  size?: "normal" | "large";

  /**
   * Position on screen
   */
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";

  /**
   * Whether the FAB is disabled
   */
  disabled?: boolean;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Whether to show a tooltip on hover
   */
  showTooltip?: boolean;

  /**
   * Custom z-index value
   */
  zIndex?: number;
}

export function FloatingActionButton({
  icon,
  onClick,
  label,
  text,
  variant = "primary",
  size = "normal",
  position = "bottom-right",
  disabled = false,
  className,
  showTooltip = true,
  zIndex = 50,
}: FloatingActionButtonProps) {
  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6", 
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
  };

  const sizeClasses = text ? {
    normal: "h-14 px-6",
    large: "h-16 px-8",
  } : {
    normal: "w-14 h-14",
    large: "w-16 h-16",
  };

  const variantClasses = {
    primary: "bg-accent-base hover:bg-accent-hover text-white shadow-xl border-2 border-white/20 hover:shadow-2xl hover:border-white/30",
    secondary: "bg-surface-base hover:bg-surface-highlight text-content-base border-2 border-surface-outline shadow-xl hover:shadow-2xl",
  };

  const buttonClasses = classNames(
    "fixed flex items-center justify-center transition-all duration-200 ease-in-out",
    "focus:outline-none focus:ring-4 focus:ring-accent-base/50 focus:ring-offset-2 focus:ring-offset-white",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md",
    "backdrop-blur-sm", // Add backdrop blur for better contrast
    text ? "rounded-full" : "rounded-full",
    text ? "gap-3" : "",
    positionClasses[position],
    sizeClasses[size],
    variantClasses[variant],
    className
  );

  const iconSize = size === "large" ? 24 : 20;

  return (
    <div className="fixed" style={{ zIndex }}>
      <button
        onClick={onClick}
        disabled={disabled}
        className={buttonClasses}
        aria-label={label}
        title={showTooltip ? label : undefined}
      >
        <div style={{ width: iconSize, height: iconSize }}>
          {icon}
        </div>
        {text && (
          <span className={`font-medium whitespace-nowrap ${size === "large" ? "text-base" : "text-sm"}`}>
            {text}
          </span>
        )}
      </button>
    </div>
  );
}

export default FloatingActionButton;