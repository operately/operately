import React from "react";
import classNames from "classnames";

interface Props {
  percentage: number;
  color: string;

  bgColor?: string;
  width?: string;
  height?: string;
}

const DEFAULTS = {
  width: "w-24",
  height: "h-2.5",
  bgColor: "bg-surface-outline",
};

export function ProgressBar(props: Props) {
  props = { ...DEFAULTS, ...props };

  const className = classNames("rounded relative", props.color, props.height, props.width, props.bgColor);

  const style = {
    width: `${props.percentage}%`,
    backgroundColor: props.color,
  };

  return (
    <div className={className}>
      <div className="rounded absolute top-0 bottom-0 left-0" style={style} />
    </div>
  );
}
