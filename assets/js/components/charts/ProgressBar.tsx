import React from "react";
import classNames from "classnames";
import { COLORS } from "./constants";
import { COLORS as STATUS_COLORS } from "../status/constants";

interface Props {
  percentage: number;
  status: string;
  className?: string;
  width?: string;
  color?: string;
}

const DEFAULTS = {
  width: "w-24",
  className: "",
};

export function ProgressBar(props: Props) {
  props = { ...DEFAULTS, ...props };

  const className = classNames("h-2.5 bg-surface-outline rounded relative", props.className, props.width);
  const color = STATUS_COLORS[props.status];

  const style = {
    width: `${props.percentage}%`,
    backgroundColor: color && COLORS[color],
  };

  return (
    <div className={className}>
      <div className="rounded absolute top-0 bottom-0 left-0" style={style} />
    </div>
  );
}
