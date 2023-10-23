import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";

import { useLoadedData, useSubscribeToChanges } from "./loader";
import { useDocumentTitle } from "@/layouts/header";

import NotificationItem from "./NotificationItem";

export function Page() {
  useDocumentTitle("Notifications");

  return (
    <Paper.Root>
      <Paper.Body className="relative flex flex-col items-stretch">
        <div className="-mx-12 -my-10 flex flex-col items-stretch bg-dark-2 flex-1">
          <div className="bg-dark-2 pt-8 pb-6">
            <h1 className="text-2xl font-bold text-center">Notifications</h1>
            <div className="text-center text-sm">Here's every notification you've received from Operately.</div>
          </div>

          <UnreadNotifications />
          <PreviousNotifications />
        </div>
      </Paper.Body>
    </Paper.Root>
  );
}

function UnreadNotifications() {
  useSubscribeToChanges();

  const { notifications } = useLoadedData();

  const unread = notifications.filter((n) => !n.read);

  return (
    <div className="px-12" style={{ minHeight: "200px" }}>
      <div className="flex items-center gap-4 mb-3">
        <div className="text-sm uppercase font-extrabold text-orange-500">New for you</div>
        <div className="h-px bg-dark-5 flex-1" />
      </div>

      {unread.length === 0 && (
        <div className="px-12 pt-16 py-20 text-white-1 font-medium flex items-center flex-col gap-2">
          <Icons.IconSparkles className="text-yellow-500" />
          Nothing new for you.
        </div>
      )}

      {unread.map((n) => (
        <NotificationItem key={n.id} notification={n} />
      ))}
    </div>
  );
}

function PreviousNotifications() {
  const { notifications } = useLoadedData();

  const previouslyRead = notifications.filter((n) => n.read);

  return (
    <div className="px-12 bg-dark-3/30 border-t border-dark-4 flex-1 pt-8">
      <div className="text-white-1 font-bold mb-2">Previous Notifications</div>
      {previouslyRead.map((n) => (
        <NotificationItem key={n.id} notification={n} />
      ))}
    </div>
  );
}
