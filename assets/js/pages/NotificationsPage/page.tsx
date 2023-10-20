import * as React from "react";
import * as Paper from "@/components/PaperContainer";

import { useLoadedData } from "./loader";
import { useDocumentTitle } from "@/layouts/header";

import Avatar from "@/components/Avatar";

export function Page() {
  useDocumentTitle("Notifications");

  return (
    <Paper.Root>
      <Paper.Body>
        <div className="text-white-1 text-3xl font-extrabold">Notifications</div>

        <UnreadNotifications />
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
      {unread.map((n) => (
        <Notification key={n.id} notification={n} />
      ))}
    </div>
  );
}

function PreviousNotifications() {
  const { notifications } = useLoadedData();

  const previouslyRead = notifications.filter((n) => !n.read);

  return (
    <div>
      {previouslyRead.map((n) => (
        <Notification key={n.id} notification={n} />
      ))}
    </div>
  );
}

function Notification({ notification }) {
  return <Avatar person={notification.author} />;
}
