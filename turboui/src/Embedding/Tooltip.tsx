import React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useEmbedding } from "./index";
export * from "@radix-ui/react-tooltip";

export function Portal(props: Tooltip.TooltipPortalProps) {
  const embedding = useEmbedding();
  return <Tooltip.Portal container={embedding?.portalContainer} {...props} />;
}

export const Content = React.forwardRef<HTMLDivElement, Tooltip.TooltipContentProps>((props, ref) => {
  const embedding = useEmbedding();
  return <Tooltip.Content ref={ref} collisionBoundary={embedding?.portalContainer} {...props} />;
});
Content.displayName = "EmbeddedTooltipContent";
