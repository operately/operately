import React from "react";
import { DropPlaceholder } from "../../utils/PragmaticDragAndDrop";

interface Props {
  containerId: string;
  index: number;
  height?: number | null;
}

const baseClassName = "border border-surface-outline/15 bg-surface-highlight/25 shadow-none ring-0";

export function TaskBoardDropPlaceholder({ containerId, index, height }: Props) {
  return <DropPlaceholder containerId={containerId} index={index} height={height} className={baseClassName} />;
}
