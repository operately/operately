import classNames from "classnames";
import React from "react";

interface Props {
  color?: string;
  margin?: string;
}

export function BulletDot(props?: Props) {
  return <span className={calcClassName(props)}>•</span>;
}

export function MDash(props?: Props) {
  return <span className={calcClassName(props)}>&mdash;</span>;
}

function calcClassName(props?: Props) {
  return classNames(props?.color || "text-content-dimmed", props?.margin || "");
}
