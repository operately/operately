import React from "react";
import { SidebarNotificationSection } from "../../SidebarSection";

interface Attrs {
  entityType: SidebarNotificationSection.Props["entityType"];
  initial?: boolean;
}

export function useMockSubscriptions({ entityType, initial = true }: Attrs): SidebarNotificationSection.Props {
  const [isSubscribed, setIsSubscribed] = React.useState(initial);

  return {
    isSubscribed,
    onToggle: () => setIsSubscribed((prev) => !prev),
    hidden: false,
    entityType,
  };
}
