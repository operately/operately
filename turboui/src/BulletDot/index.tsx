import React from "react";

import classNames from "../utils/classnames";

export interface BulletDotProps {
  color?: string;
  margin?: string;
}

export function BulletDot({ color = "text-content-dimmed", margin = "" }: BulletDotProps = {}) {
  return <span className={classNames(color, margin)}>•</span>;
}
