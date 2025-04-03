import React from "react";
import * as ReactTooltip from "@radix-ui/react-tooltip";
import classNames from "classnames";

/**
 * Tooltip component for showing additional information on hover
 * @param {Object} props - Component props
 * @param {React.ReactNode|string} props.content - Content to display in the tooltip
 * @param {React.ReactNode} props.children - Trigger element that activates the tooltip on hover
 * @param {number} [props.delayDuration=200] - Delay before showing the tooltip (in ms)
 * @param {string} [props.className] - Additional classes for the tooltip
 * @returns {JSX.Element} Tooltip component
 */
export function Tooltip({ content, delayDuration, children, className }) {
  const tooltipClassName = classNames(
    "bg-surface-base rounded-lg",
    "py-4 px-5",
    "text-content-accent",
    "font-medium",
    "break-normal",
    "select-none",
    "shadow-xl",
    "whitespace-normal",
    "border border-stroke-dimmed",
    className || ""
  );

  // Use CSS variables for arrow styling to support both light and dark modes
  const arrowStyle = {
    fill: "var(--color-surface-base)",
    // Border for the arrow to match the tooltip border
    filter: "drop-shadow(0px -1px 0px var(--color-stroke-dimmed))",
  };

  return (
    <ReactTooltip.Provider>
      <ReactTooltip.Root delayDuration={delayDuration || 200}>
        <ReactTooltip.Trigger asChild>{children}</ReactTooltip.Trigger>
        <ReactTooltip.Portal>
          <ReactTooltip.Content sideOffset={5} className={tooltipClassName}>
            {content}
            <ReactTooltip.Arrow style={arrowStyle} />
          </ReactTooltip.Content>
        </ReactTooltip.Portal>
      </ReactTooltip.Root>
    </ReactTooltip.Provider>
  );
}
