import React from "react";
import * as Popover from "@radix-ui/react-popover";
import { useEmbedding } from "./index";
export * from "@radix-ui/react-popover";

export function Portal(props: Popover.PopoverPortalProps) {
  const embedding = useEmbedding();
  return <Popover.Portal container={embedding?.portalContainer} {...props} />;
}

export const Content = React.forwardRef<HTMLDivElement, Popover.PopoverContentProps>((props, ref) => {
  const embedding = useEmbedding();
  return <Popover.Content ref={ref} collisionBoundary={embedding?.portalContainer} {...props} />;
});
Content.displayName = "EmbeddedPopoverContent";
