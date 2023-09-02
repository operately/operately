import React from "react";

import { TextTooltip } from "@/components/Tooltip";
import classnames from "classnames";

interface IconButtonProps {
  tooltip: string;
  icon: JSX.Element;
  color: keyof typeof IconButtonColors;
  onClick?: () => void;
}

const IconButtonColors = {
  green: "text-white-1/60 bg-shade-1 hover:bg-green-400/20 hover:text-green-400",
  red: "text-white-1/60 bg-shade-1 hover:bg-red-400/20 hover:text-red-400",
};

export function IconButton(props: IconButtonProps) {
  const { tooltip, icon, color, ...rest } = props;

  const colorClasses = IconButtonColors[color];

  return (
    <TextTooltip text={tooltip} delayDuration={600}>
      <div className={classnames("shrink-0 p-1.5 rounded cursor-pointer transition-colors", colorClasses)} {...rest}>
        {icon}
      </div>
    </TextTooltip>
  );
}
