import React from "react";
import { IconFileText } from "../../icons";

export function DescriptionIndicator({ hasDescription, iconSize }: { hasDescription: boolean; iconSize: number }) {
  if (!hasDescription) return null;

  return (
    <span className="flex-shrink-0 text-content-dimmed" title="Has description" data-test-id="description-indicator">
      <IconFileText size={iconSize} />
    </span>
  );
}
