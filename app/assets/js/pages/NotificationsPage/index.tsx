import type { Notification } from "@/api";
import { loader, useLoadedData } from "./loader";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Notifications from "@/models/notifications";
import * as React from "react";
import { IconSparkles, NotificationRow, SecondaryButton } from "turboui";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import ActivityHandler from "@/features/activities";
import { PageModule } from "@/routes/types";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { usePaths } from "../../routes/paths";
import { optimisticallyMarkNotificationAsRead } from "./optimisticMarkAsRead";

export default { name: "NotificationsPage", loader, Page } as PageModule;

function Page() {
  const { notifications: loadedNotifications } = useLoadedData();
  const [notifications, setNotifications] = React.useState(loadedNotifications);
  const { mutateAsync: markNotificationAsRead } = Notifications.useMarkNotificationRead();

  React.useEffect(() => {
    setNotifications(loadedNotifications);
  }, [loadedNotifications]);

  const handleMarkAsRead = React.useCallback(
    (notification: Notification) =>
      optimisticallyMarkNotificationAsRead(notification, setNotifications, () =>
        markNotificationAsRead({ id: notification.id }),
      ),
    [markNotificationAsRead],
  );

  return (
    <Pages.Page title="Notifications">
      <Paper.Root size="medium">
        <Paper.Body className="relative flex flex-col items-stretch">
          <h1 className="text-2xl font-bold text-center">Notifications</h1>
          <div className="text-center text-sm">Here's every notification you've received from Operately.</div>

          <UnreadNotifications notifications={notifications} onMarkAsRead={handleMarkAsRead} />
          <PreviousNotifications notifications={notifications} onMarkAsRead={handleMarkAsRead} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (notification: Notification) => void;
}

function UnreadNotifications({ notifications, onMarkAsRead }: NotificationListProps) {
  const unread = notifications.filter((notification) => !notification.read);

  return (
    <div className="pt-2" style={{ minHeight: "200px" }}>
      <div className="flex items-center gap-4 mb-3">
        <div className="text-sm uppercase font-extrabold text-orange-500">New for you</div>
        <div className="h-px bg-stroke-base flex-1" />
        {unread.length > 0 && <MarkAllReadButton />}
      </div>

      {unread.length === 0 && (
        <div className="px-12 pt-16 py-20 text-content-accent font-medium flex items-center flex-col gap-2">
          <IconSparkles className="text-yellow-500" />
          Nothing new for you.
        </div>
      )}

      {unread.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} onMarkAsRead={onMarkAsRead} />
      ))}
    </div>
  );
}

function MarkAllReadButton() {
  const { mutateAsync: markAllRead, isPending: loading } = Notifications.useMarkAllNotificationsRead();

  const onClick = React.useCallback(async () => {
    await markAllRead({});
  }, [markAllRead]);

  return (
    <SecondaryButton size="xs" testId="mark-all-read" onClick={onClick} loading={loading}>
      Mark all read
    </SecondaryButton>
  );
}

function PreviousNotifications({ notifications, onMarkAsRead }: NotificationListProps) {
  const previouslyRead = notifications.filter((notification) => notification.read);

  return (
    <Paper.DimmedSection>
      <div className="text-content-accent font-bold mb-2">Previous Notifications</div>
      {previouslyRead.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} onMarkAsRead={onMarkAsRead} />
      ))}
    </Paper.DimmedSection>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (notification: Notification) => void;
}

function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const activity = notification.activity;
  const author = activity?.author;

  if (!activity || !author) return null;

  return (
    <NotificationItemWithActivity
      notification={notification}
      activity={activity}
      author={author}
      onMarkAsRead={onMarkAsRead}
    />
  );
}

interface NotificationItemWithActivityProps extends NotificationItemProps {
  activity: NonNullable<Notification["activity"]>;
  author: NonNullable<NonNullable<Notification["activity"]>["author"]>;
}

function NotificationItemWithActivity({
  notification,
  activity,
  author,
  onMarkAsRead,
}: NotificationItemWithActivityProps) {
  const paths = usePaths();
  const formattedTimePreferences = useFormattedTimePreferences();
  const testId = `notification-item-${activity.action}`;

  const goToActivity = useNavigateTo(ActivityHandler.pagePath(paths, activity));
  const { mutateAsync: mark } = Notifications.useMarkNotificationRead();

  const clickHandler = React.useCallback(async () => {
    await mark({ id: notification.id });
    goToActivity();
  }, [goToActivity, mark, notification.id]);

  return (
    <NotificationRow
      author={author}
      title={<ActivityHandler.NotificationTitle activity={activity} />}
      location={<ActivityHandler.NotificationLocation activity={activity} />}
      insertedAt={activity.insertedAt}
      formattedTimePreferences={formattedTimePreferences}
      read={notification.read}
      testId={testId}
      onOpen={clickHandler}
      onMarkAsRead={() => onMarkAsRead(notification)}
    />
  );
}
