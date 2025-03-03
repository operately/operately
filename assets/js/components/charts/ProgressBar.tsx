import React from "react";
import classNames from "classnames";

interface Props {
  percentage: number;

  color?: string;
  bgColor?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
}

const DEFAULTS = {
  width: "w-24",
  height: "h-2.5",
  color: "var(--color-accent-1)",
  bgColor: "var(--color-surface-outline)",
  rounded: true,
};

export function ProgressBar(props: Props) {
  props = { ...DEFAULTS, ...props };

  const roundedClass = props.rounded ? "rounded" : "";

  const outerClass = classNames("relative", props.height, props.width, roundedClass);

  const innerClass = classNames(
    "absolute top-0 bottom-0 left-0",
    props.color,
    roundedClass,
    "transition-all",
    "duration-300",
  );

  const bgStyle = {
    backgroundColor: props.bgColor,
  };

  const clampedPercentage = Math.min(100, Math.max(0, props.percentage));

  const style = {
    width: `${clampedPercentage}%`,
    backgroundColor: props.color,
  };

  return (
    <div className={outerClass} style={bgStyle}>
      <div className={innerClass} style={style} />
    </div>
  );
}
