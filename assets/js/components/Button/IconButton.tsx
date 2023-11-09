import React from "react";

import { TextTooltip } from "@/components/Tooltip";
import classnames from "classnames";

interface IconButtonProps {
  tooltip: string;
  icon: JSX.Element;
  color: keyof typeof IconButtonColors;
  onClick?: () => void;
  size: keyof typeof paddings;
}

const IconButtonColors = {
  green: "text-content-dimmed bg-surface-accent hover:bg-green-400/20 hover:text-green-400",
  red: "text-content-dimmed bg-surface-accent hover:bg-red-400/20 hover:text-red-400",
};

const paddings = {
  sm: "p-1",
  md: "p-1.5",
  lg: "p-2",
};

export function IconButton(props: IconButtonProps) {
  const { tooltip, icon, color, size, ...rest } = props;

  const colorClasses = IconButtonColors[color];
  const padding = paddings[size];

  return (
    <TextTooltip text={tooltip} delayDuration={600}>
      <div
        className={classnames("shrink-0 p-1 rounded cursor-pointer transition-colors", colorClasses, padding)}
        {...rest}
      >
        {icon}
      </div>
    </TextTooltip>
  );
}

IconButton.defaultProps = {
  color: "green",
  size: "md",
};
