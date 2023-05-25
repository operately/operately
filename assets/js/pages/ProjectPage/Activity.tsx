import React from "react";

import * as Chat from "@/components/Chat";

function Event({ eventData }): JSX.Element {
  switch (eventData.__typename) {
    case "ActivityStatusUpdate":
      return <Chat.Post update={eventData} />;

    case "ActivityCreated":
      return <></>;

    default:
      throw "Unknown event type " + eventData.__typename;
  }
}

export default function Activity({ data }): JSX.Element {
  const activities: any[] = data.project.activities;

  return (
    <div className="mt-[76px]">
      {activities.map((u, i) => (
        <Event key={i} eventData={u} />
      ))}
    </div>
  );
}
