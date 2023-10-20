import * as React from "react";
import * as Paper from "@/components/PaperContainer";

import { useLoadedData } from "./loader";
import { useDocumentTitle } from "@/layouts/header";

import { Spacer } from "@/components/Spacer";

import { Notification } from "@/gql";
import { ProjectDiscussionSubmittedNotification } from "./types/ProjectDiscussionSubmittedNotification";

export function Page() {
  useDocumentTitle("Notifications");

  return (
    <Paper.Root>
      <Paper.Body>
        <UnreadNotifications />
        <Spacer size={4} />
        <PreviousNotifications />
      </Paper.Body>
    </Paper.Root>
  );
}

function UnreadNotifications() {
  const { notifications } = useLoadedData();

  const unread = notifications.filter((n) => !n.read);

  return (
    <div>
      <div className="text-orange-500 font-bold">New</div>
      {unread.map((n) => (
        <Notification key={n.id} notification={n} />
      ))}
    </div>
  );
}

function PreviousNotifications() {
  const { notifications } = useLoadedData();

  const previouslyRead = notifications.filter((n) => n.read);

  return (
    <div>
      <div className="text-white-1 font-bold mb-2">Previous Notifications</div>
      {previouslyRead.map((n) => (
        <Notification key={n.id} notification={n} />
      ))}
    </div>
  );
}

function Notification({ notification }) {
  switch (notification.activity.content.__typename) {
    case "ActivityContentProjectDiscussionSubmitted":
      return <ProjectDiscussionSubmittedNotification notification={notification} />;
    default:
      throw new Error(`Unknown notification type: ${notification.activity.content.__typename}`);
  }
}
