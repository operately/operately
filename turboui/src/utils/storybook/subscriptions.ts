import React from "react";
import { SidebarNotificationSection } from "../../SidebarSection";

interface Attrs {
  entityType: SidebarNotificationSection.Props["entityType"];
  initial?: boolean;
}

const MOCK_SUBSCRIBED_PEOPLE: NonNullable<SidebarNotificationSection.Props["subscribedPeople"]> = [
  { id: "person-1", fullName: "Alice Johnson", avatarUrl: null },
  { id: "person-2", fullName: "Marcus Lee", avatarUrl: null },
  { id: "person-3", fullName: "Priya Patel", avatarUrl: null },
  { id: "person-4", fullName: "Nina Chen", avatarUrl: null },
];

export function useMockSubscriptions({ entityType, initial = true }: Attrs): SidebarNotificationSection.Props {
  const [isSubscribed, setIsSubscribed] = React.useState(initial);

  return {
    isSubscribed,
    onToggle: () => setIsSubscribed((prev) => !prev),
    hidden: false,
    entityType,
    subscribedPeople: MOCK_SUBSCRIBED_PEOPLE,
  };
}
