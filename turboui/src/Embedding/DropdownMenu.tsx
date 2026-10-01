import React from "react";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { useEmbedding } from "./index";
export * from "@radix-ui/react-dropdown-menu";

export function Portal(props: Menu.DropdownMenuPortalProps) {
  const embedding = useEmbedding();
  return <Menu.Portal container={embedding?.portalContainer} {...props} />;
}

export const Content = React.forwardRef<HTMLDivElement, Menu.DropdownMenuContentProps>((props, ref) => {
  const embedding = useEmbedding();
  return <Menu.Content ref={ref} collisionBoundary={embedding?.portalContainer} {...props} />;
});
Content.displayName = "EmbeddedMenuContent";

export const SubContent = React.forwardRef<HTMLDivElement, Menu.DropdownMenuSubContentProps>((props, ref) => {
  const embedding = useEmbedding();
  return <Menu.SubContent ref={ref} collisionBoundary={embedding?.portalContainer} {...props} />;
});
SubContent.displayName = "EmbeddedSubMenuContent";
