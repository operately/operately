import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";
import * as Notifications from "@/models/notifications";

import { useLoadedData, useSubscribeToChanges, useRefresh } from "./loader";
import { useDocumentTitle } from "@/layouts/header";

import NotificationItem from "./NotificationItem";
import { GhostButton } from "@/components/Button";

export function Page() {
  useDocumentTitle("Notifications");

  return (
    <Paper.Root size="medium">
      <Paper.Body className="relative flex flex-col items-stretch">
        <h1 className="text-2xl font-bold text-center">Notifications</h1>
        <div className="text-center text-sm">Here's every notification you've received from Operately.</div>

        <UnreadNotifications />
        <PreviousNotifications />
      </Paper.Body>
    </Paper.Root>
  );
}

function UnreadNotifications() {
  useSubscribeToChanges();

  const { notifications } = useLoadedData();

  const unread = notifications.filter((n) => !n.read);

  return (
    <div className="pt-2" style={{ minHeight: "200px" }}>
      <div className="flex items-center gap-4 mb-3">
        <div className="text-sm uppercase font-extrabold text-orange-500">New for you</div>
        <div className="h-px bg-stroke-base flex-1" />
        {unread.length > 0 && <MarkAllReadButton />}
      </div>

      {unread.length === 0 && (
        <div className="px-12 pt-16 py-20 text-content-accent font-medium flex items-center flex-col gap-2">
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

function MarkAllReadButton() {
  const refresh = useRefresh();
  const [markAllRead, { loading }] = Notifications.useMarkAllNotificationsRead();

  const onClick = React.useCallback(async () => {
    await markAllRead();
    refresh();
  }, [markAllRead]);

  return (
    <GhostButton type="secondary" size="xs" testId="mark-all-read" onClick={onClick} loading={loading}>
      Mark all read
    </GhostButton>
  );
}

function PreviousNotifications() {
  const { notifications } = useLoadedData();

  const previouslyRead = notifications.filter((n) => n.read);

  return (
    <Paper.DimmedSection>
      <div className="text-content-accent font-bold mb-2">Previous Notifications</div>
      {previouslyRead.map((n) => (
        <NotificationItem key={n.id} notification={n} />
      ))}
    </Paper.DimmedSection>
  );
}
