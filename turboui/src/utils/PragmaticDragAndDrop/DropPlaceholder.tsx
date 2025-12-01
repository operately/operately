import React from "react";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

import classNames from "../classnames";

interface DropPlaceholderProps {
  containerId: string;
  index: number;
  height?: number | null;
  className?: string;
}

/**
 * Placeholder block that reserves space for the dragged item.
 */
export function DropPlaceholder({ containerId, index, height, className }: DropPlaceholderProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const resolvedHeight = height ?? 72;

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      getData: () => ({
        containerId,
        index,
      }),
    });
  }, [containerId, index]);

  return (
    <div
      ref={ref}
      className={classNames(
        [
          "rounded-md border border-surface-outline/30 shadow-[0_10px_30px_rgba(0,0,0,0.14)] transition-none",
          "bg-surface-accent/35 ring-2 ring-surface-accent/50 backdrop-blur-[1px]",
        ].join(" "),
        className,
      )}
      style={{ height: resolvedHeight }}
      aria-hidden="true"
    />
  );
}
