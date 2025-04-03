import React from "react";

/**
 * Spinner component for button loading states
 * @param {Object} props
 * @param {boolean} [props.loading] - Whether the spinner is visible
 * @param {string} props.color - Color of the spinner
 * @param {"xxs" | "xs" | "sm" | "base" | "lg"} props.size - Size of the spinner
 * @returns {JSX.Element}
 */
export function Spinner({ loading, color, size }) {
  // Calculate size based on button size
  const getIconSize = () => {
    switch (size) {
      case "xxs": return 12;
      case "xs": return 14;
      case "sm": return 16;
      case "base": return 18;
      case "lg": return 20;
      default: return 18;
    }
  };

  const iconSize = getIconSize();

  return (
    <div className="inset-0 flex items-center justify-center absolute z-10">
      {loading && <SpinnerIcon size={iconSize} color={color} />}
    </div>
  );
}

// Simple spinner SVG component as replacement for PuffLoader
function SpinnerIcon({ size, color }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke={color}
      className="animate-spin"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        strokeWidth="4"
        strokeDasharray="30 30"
        strokeLinecap="round"
        strokeOpacity="0.3"
      />
      <circle
        cx="12"
        cy="12"
        r="10"
        strokeWidth="4"
        strokeDasharray="15 85"
        strokeLinecap="round"
      />
    </svg>
  );
}
