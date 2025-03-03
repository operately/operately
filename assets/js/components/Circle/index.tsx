import React from "react";
import classNames from "classnames";

type CircleProps = {
  size: number;
  color?: string;
  border?: string;
  noFill?: boolean;
  borderSize?: number;
  borderDashed?: boolean;
};

export function Circle({ size, color, border, noFill, borderSize, borderDashed }: CircleProps) {
  const className = classNames(
    "rounded-full",
    border ? "border" : "",
    border ? border : "",
    noFill ? "" : color,
    borderDashed ? "border-dashed" : "",
  );

  const style = {
    width: size + "px",
    height: size + "px",
    borderWidth: borderSize ? borderSize + "px" : undefined,
  };

  return <div className={className} style={style} />;
}
