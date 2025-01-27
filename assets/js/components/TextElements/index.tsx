import classNames from "classnames";
import React from "react";

interface Props {
  color?: string;
  margin?: string;
}

export function BulletDot(props?: Props) {
  props = applyDefaults(props);
  const className = classNames(props.color, props.margin);

  return <span className={className}>•</span>;
}

export function MDash(props?: Props) {
  props = applyDefaults(props);
  const className = classNames(props.color, props.margin);

  return <span className={className}>&mdash;</span>;
}

function applyDefaults(props?: Props) {
  return { color: "text-content-dimmed", ...props };
}
